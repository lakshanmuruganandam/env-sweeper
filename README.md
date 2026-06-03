# 🛡️ Env Sweeper

> **Hunt down exposed `.env` files and API keys before they get committed and ruin your life.**

```
    ███████╗███╗   ██╗██╗   ██╗    ███████╗██╗    ██╗███████╗███████╗██████╗ ███████╗██████╗ 
    ██╔════╝████╗  ██║██║   ██║    ██╔════╝██║    ██║██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗
    █████╗  ██╔██╗ ██║██║   ██║    ███████╗██║ █╗ ██║█████╗  █████╗  ██████╔╝█████╗  ██████╔╝
    ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ╚════██║██║███╗██║██╔══╝  ██╔══╝  ██╔═══╝ ██╔══╝  ██╔══██╗
    ███████╗██║ ╚████║ ╚████╔╝     ███████║╚███╔███╔╝███████╗███████╗██║     ███████╗██║  ██║
    ╚══════╝╚═╝  ╚═══╝  ╚═══╝      ╚══════╝ ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

<p align="center">
  <strong>Architected by <a href="https://github.com/lakshanmuruganandam">@lakshanmuruganandam</a></strong>
</p>

---

## ⚡ Quick Start

Zero install. Run it instantly:

```bash
npx env-sweeper-cli
```

Or install globally for instant access:
```bash
npm install -g env-sweeper-cli
env-sweeper
```

---

## 🔥 Why Env Sweeper?

Every developer has accidentally committed an AWS key or Stripe token because they forgot to add `.env` to their `.gitignore`.

**Env Sweeper** is your last line of defense:

1. **Lightning Fast Globbing** — Scans your entire project (or machine) for `.env*` files instantly.
2. **Secret Detection** — Reads the files and highlights them in RED if they contain live AWS keys, Stripe tokens, or GitHub tokens.
3. **Interactive Security** — Select the files and choose to either permanently shred them, or instantly add them to the `.gitignore` of their respective folder.

---

## 🛠️ Usage

### Local Scan (Current Project)
Scan the current directory and all subdirectories:
```bash
npx env-sweeper-cli
```

### Global Scan (Entire Machine)
Scan your entire home directory for forgotten secrets:
```bash
npx env-sweeper-cli --global
```

---

## 📄 License
MIT
