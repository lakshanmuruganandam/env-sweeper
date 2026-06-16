<div align="center">

# 🛡️ Env Sweeper

> **Hunt down exposed `.env` files and API keys before they get committed and ruin your life.**

[![npm version](https://badge.fury.io/js/env-sweeper.svg)](https://www.npmjs.com/package/env-sweeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

</div>

```text
    ███████╗███╗   ██╗██╗   ██╗    ███████╗██╗    ██╗███████╗███████╗██████╗ ███████╗██████╗ 
    ██╔════╝████╗  ██║██║   ██║    ██╔════╝██║    ██║██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗
    █████╗  ██╔██╗ ██║██║   ██║    ███████╗██║ █╗ ██║█████╗  █████╗  ██████╔╝█████╗  ██████╔╝
    ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ╚════██║██║███╗██║██╔══╝  ██╔══╝  ██╔═══╝ ██╔══╝  ██╔══██╗
    ███████╗██║ ╚████║ ╚████╔╝     ███████║╚███╔███╔╝███████╗███████╗██║     ███████╗██║  ██║
    ╚══════╝╚═╝  ╚═══╝  ╚═══╝      ╚══════╝ ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

Did you know thousands of AWS keys, Stripe tokens, and OpenAI keys are leaked on GitHub every single day because developers forget to add `.env` to their `.gitignore`?

**Env Sweeper** is a blazing-fast, interactive CLI security scanner that recursively sweeps your local directories for unprotected `.env` files and exposed API keys, allowing you to instantly preview, delete, or safely `.gitignore` them.

## ✨ Features

- **⚡ Lightning Fast:** Uses `fast-glob` to rip through massive codebases in milliseconds while aggressively ignoring `node_modules`.
- **👀 Smart Preview:** Safely peeks inside discovered `.env` files and automatically masks sensitive keys so you can verify them securely.
- **🛡️ Instant Remediation:** Automatically injects the `.env` path into the correct local `.gitignore` file with a single keystroke.
- **🗑️ Secure Shredding:** Permanently deletes dangerous files if you choose to obliterate them.
- **🎯 Interactive UX:** Powered by `inquirer` for a bulletproof, non-glitchy terminal experience.

## 🚀 Installation

You can run it instantly without installing:

```bash
npx env-sweeper
```

Or install it globally to sweep any folder at any time:

```bash
npm install -g env-sweeper
```

## 🎮 Usage

Navigate to any directory you want to scan and run:

```bash
env-sweeper
```

### Flow:
1. Sweeper will scan the directory and list all unprotected `.env` files.
2. Select the files you want to handle (Space to select, Enter to proceed).
3. Choose an action:
   - **Preview masked secrets** (to see what keys are inside).
   - **Shred them** (delete permanently).
   - **Add to .gitignore** (secures them without deleting).

## 🛠️ How it works

1. It recursively globs `**/.env*` while bypassing massive folders like `node_modules` and `.git`.
2. It parses `.gitignore` files to ensure it doesn't bother you with `.env` files that are already safely ignored.
3. It presents a beautiful terminal UI for you to take immediate action on vulnerabilities.

---

### Architected by [@lakshanmuruganandam](https://github.com/lakshanmuruganandam)
*Built for developers who prefer not to wake up to a $50,000 AWS bill.*
