#!/usr/bin/env node

import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import pc from 'picocolors';
import { Command } from 'commander';
import boxen from 'boxen';
import os from 'os';
import cliSpinners from 'cli-spinners';
import logUpdate from 'log-update';

const program = new Command();

program
  .name('env-sweeper')
  .description('Hunt down exposed .env files and API keys before they get committed.')
  .version('1.0.0')
  .option('-g, --global', 'Scan your entire home directory instead of just the current project')
  .parse(process.argv);

const options = program.opts();

const BANNER = pc.cyan(`
    ███████╗███╗   ██╗██╗   ██╗    ███████╗██╗    ██╗███████╗███████╗██████╗ ███████╗██████╗ 
    ██╔════╝████╗  ██║██║   ██║    ██╔════╝██║    ██║██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗
    █████╗  ██╔██╗ ██║██║   ██║    ███████╗██║ █╗ ██║█████╗  █████╗  ██████╔╝█████╗  ██████╔╝
    ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ╚════██║██║███╗██║██╔══╝  ██╔══╝  ██╔═══╝ ██╔══╝  ██╔══██╗
    ███████╗██║ ╚████║ ╚████╔╝     ███████║╚███╔███╔╝███████╗███████╗██║     ███████╗██║  ██║
    ╚══════╝╚═╝  ╚═══╝  ╚═══╝      ╚══════╝ ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
`);

const SECRETS = [
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Stripe Live', regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: 'GitHub Token', regex: /ghp_[0-9a-zA-Z]{36}/g },
  { name: 'OpenAI API', regex: /sk-[a-zA-Z0-9]{48}/g },
  { name: 'Generic Password', regex: /password\s*=\s*(.+)/ig },
];

function maskSecret(secret) {
  if (secret.length <= 4) return '****';
  return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
}

async function scan() {
  const scanPath = options.global ? os.homedir() : process.cwd();
  
  const spinner = cliSpinners.dots;
  let i = 0;
  const timer = setInterval(() => {
    logUpdate(pc.cyan(`${spinner.frames[i = ++i % spinner.frames.length]} Sweeping for exposed secrets in ${scanPath}...`));
  }, spinner.interval);

  const startTime = Date.now();

  const entries = await fg(['**/.env*'], {
    cwd: scanPath,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/Library/**'],
    absolute: true,
    suppressErrors: true
  });

  clearInterval(timer);
  logUpdate.clear();
  
  const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
  return { entries, timeTaken };
}

function analyzeFiles(files) {
  const results = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const foundSecrets = [];
      const previews = [];
      
      for (const secret of SECRETS) {
        const matches = [...content.matchAll(secret.regex)];
        if (matches.length > 0) {
          foundSecrets.push(secret.name);
          matches.forEach(m => {
            const raw = m[0];
            previews.push(`${secret.name}: ${maskSecret(raw)}`);
          });
        }
      }

      results.push({
        path: file,
        secrets: foundSecrets,
        previews: previews,
        size: Buffer.byteLength(content, 'utf8')
      });
    } catch (err) {
      // ignore read errors
    }
  }
  return results;
}

async function run() {
  console.log(BANNER);
  console.log(pc.gray(' Architected by @lakshanmuruganandam \n'));

  const { entries: files, timeTaken } = await scan();

  if (files.length === 0) {
    console.log(pc.green(`✨ Clean as a whistle. Scanned in ${timeTaken}s. No .env files found.`));
    process.exit(0);
  }

  const analysis = analyzeFiles(files);
  
  // Sort by risk (files with secrets first)
  analysis.sort((a, b) => b.secrets.length - a.secrets.length);

  const choices = analysis.map(f => {
    const isRisky = f.secrets.length > 0;
    const nameColored = isRisky ? pc.red(path.basename(f.path)) : pc.white(path.basename(f.path));
    const hint = isRisky 
      ? pc.red(`[CRITICAL: ${f.secrets.join(', ')}]`) 
      : pc.gray(`[${f.size} bytes]`);
    
    const displayPath = options.global ? f.path : path.relative(process.cwd(), f.path);

    return {
      name: f.path,
      message: `${nameColored.padEnd(20)} 📁 ${pc.gray(displayPath)} ${hint}`,
      value: f
    };
  });

  console.log(pc.yellow(`⚠️  Found ${files.length} .env files in ${timeTaken}s.`));

  const { selected } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selected',
    message: 'Select exposed files to secure:',
    choices: choices,
    pageSize: 10
  }]);

  const targets = Object.values(selected); // Array of objects

  if (targets.length === 0) {
    console.log(pc.gray('\nRetreating. No files secured.'));
    process.exit(0);
  }

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do with these targets?',
    choices: [
      { name: '👀 Preview masked secrets before deciding', value: 'preview' },
      { name: '🗑️  Shred them (Permanently Delete)', value: 'delete' },
      { name: '🙈 Add them to .gitignore in their respective folders', value: 'gitignore' },
      { name: '❌ Cancel', value: 'cancel' }
    ]
  }]);

  if (action === 'cancel') {
    console.log(pc.gray('\nMission aborted.'));
    process.exit(0);
  }

  if (action === 'preview') {
    console.log('\n' + pc.cyan('--- SECRET PREVIEWS ---'));
    for (const t of targets) {
      console.log(pc.white(`\n📄 ${t.path}`));
      if (t.previews.length > 0) {
        t.previews.forEach(p => console.log(pc.red(`  ↳ ${p}`)));
      } else {
        console.log(pc.gray('  ↳ No known critical secrets detected (but could still contain local passwords).'));
      }
    }
    console.log(pc.cyan('-----------------------\n'));
    
    const { nextAction } = await inquirer.prompt([{
      type: 'list',
      name: 'nextAction',
      message: 'Now what?',
      choices: [
        { name: '🗑️  Shred them', value: 'delete' },
        { name: '🙈 Add to .gitignore', value: 'gitignore' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    }]);
    
    if (nextAction === 'cancel') process.exit(0);
    var finalAction = nextAction;
  } else {
    var finalAction = action;
  }

  console.log();
  let successCount = 0;

  for (const targetObj of targets) {
    const target = targetObj.path;
    if (finalAction === 'delete') {
      try {
        fs.unlinkSync(target);
        console.log(pc.green(`✅ Shredded: `) + pc.white(target));
        successCount++;
      } catch (err) {
        console.log(pc.red(`❌ Failed to shred ${target}: ${err.message}`));
      }
    } else if (finalAction === 'gitignore') {
      try {
        const dir = path.dirname(target);
        const gitignorePath = path.join(dir, '.gitignore');
        const envName = path.basename(target);
        
        let content = '';
        if (fs.existsSync(gitignorePath)) {
          content = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        if (!content.includes(envName)) {
          fs.appendFileSync(gitignorePath, `\n# Added by env-sweeper\n${envName}\n`);
          console.log(pc.green(`✅ Secured in .gitignore: `) + pc.white(target));
          successCount++;
        } else {
          console.log(pc.yellow(`⚠️ Already in .gitignore: `) + pc.white(target));
        }
      } catch (err) {
        console.log(pc.red(`❌ Failed to secure ${target}: ${err.message}`));
      }
    }
  }

  const summary = boxen(
    pc.white(`Files Secured: ${pc.green(successCount)}\n`) +
    pc.gray(`Mission Accomplished.`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  );

  console.log(summary);
}

run().catch(err => {
  console.error(pc.red('\nFatal error:'), err);
  process.exit(1);
});
