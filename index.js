#!/usr/bin/env node

import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import enquirer from 'enquirer';
import pc from 'picocolors';
import { Command } from 'commander';
import boxen from 'boxen';
import os from 'os';

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
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Stripe Live', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  { name: 'GitHub Token', regex: /ghp_[0-9a-zA-Z]{36}/ },
  { name: 'OpenAI API', regex: /sk-[a-zA-Z0-9]{48}/ },
  { name: 'Generic Password', regex: /password\s*=\s*.+/i },
];

async function scan() {
  const scanPath = options.global ? os.homedir() : process.cwd();
  console.log(pc.cyan(`\n📡 Sweeping for .env files in ${scanPath}...\n`));

  const entries = await fg(['**/.env*'], {
    cwd: scanPath,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    absolute: true,
    suppressErrors: true
  });

  return entries;
}

function analyzeFiles(files) {
  const results = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const foundSecrets = [];
      
      for (const secret of SECRETS) {
        if (secret.regex.test(content)) {
          foundSecrets.push(secret.name);
        }
      }

      results.push({
        path: file,
        secrets: foundSecrets,
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

  const files = await scan();

  if (files.length === 0) {
    console.log(pc.green('✨ Clean as a whistle. No .env files found.'));
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
    
    // Convert absolute to relative for display if not global
    const displayPath = options.global ? f.path : path.relative(process.cwd(), f.path);

    return {
      name: f.path,
      message: `${nameColored.padEnd(20)} 📁 ${pc.gray(displayPath)}`,
      hint: hint,
      value: f.path
    };
  });

  const { selected } = await enquirer.prompt({
    type: 'multiselect',
    name: 'selected',
    message: 'Select exposed .env files to secure (Space to select, Enter to execute):',
    choices: choices,
    result(names) {
      return this.map(names);
    }
  });

  const targets = Object.values(selected);

  if (targets.length === 0) {
    console.log(pc.gray('\nRetreating. No files secured.'));
    process.exit(0);
  }

  const { action } = await enquirer.prompt({
    type: 'select',
    name: 'action',
    message: 'What do you want to do with these targets?',
    choices: [
      { message: '🗑️  Shred them (Permanently Delete)', name: 'delete' },
      { message: '🙈 Add them to .gitignore in their respective folders', name: 'gitignore' },
      { message: '❌ Cancel', name: 'cancel' }
    ]
  });

  if (action === 'cancel') {
    console.log(pc.gray('\nMission aborted.'));
    process.exit(0);
  }

  console.log();
  let successCount = 0;

  for (const target of targets) {
    if (action === 'delete') {
      try {
        fs.unlinkSync(target);
        console.log(pc.green(`✅ Shredded: `) + pc.white(target));
        successCount++;
      } catch (err) {
        console.log(pc.red(`❌ Failed to shred ${target}: ${err.message}`));
      }
    } else if (action === 'gitignore') {
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
