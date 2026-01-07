# ShenCha - AI Code Audit Agent 🔍

<div align="center">

```
   _____ _                  _____ _
  / ____| |                / ____| |
 | (___ | |__   ___ _ __  | |    | |__   __ _
  \___ \| '_ \ / _ \ '_ \ | |    | '_ \ / _` |
  ____) | | | |  __/ | | || |____| | | | (_| |
 |_____/|_| |_|\___|_| |_| \_____|_| |_|\__,_|

 AI-Powered Code Audit • Security Scanner • Performance Analyzer
```

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.1.0-green.svg)](https://github.com/miounet11/scagent/releases)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC.svg)](./vscode-extension)

**English** | [中文](./README_CN.md)

</div>

## 🚀 What is ShenCha?

**ShenCha** is an AI-powered autonomous code audit agent that helps developers find security vulnerabilities, performance issues, and code quality problems. Built on Claude AI, it provides:

- 🔒 **Security Scanning** - Detect vulnerabilities in dependencies (npm audit, pip-audit, cargo audit)
- ⚡ **Performance Analysis** - Find N+1 queries, complexity issues, bundle size problems
- 🧪 **Test Coverage** - Analyze test coverage with pytest-cov and jest
- 📊 **Beautiful Reports** - Generate HTML reports with actionable insights
- 🤖 **Multi-Expert Team** - AI experts for UI, Architecture, Logic, Product, and Aesthetics

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Vulnerability Scanner** | npm audit, pip-audit, cargo audit integration |
| 📈 **Performance Analyzer** | Detect N+1 queries, deep nesting, slow patterns |
| 🧪 **Coverage Analysis** | pytest-cov, jest coverage reports |
| 📄 **HTML Reports** | Beautiful dark-themed audit reports |
| 🌐 **i18n Support** | English and Chinese languages |
| 💻 **VS Code Extension** | Audit directly from your editor |
| 🤖 **Multi-Expert AI** | 5 specialized AI experts for comprehensive audits |

## 📦 Quick Start

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/miounet11/scagent/main/install.sh | bash
```

### Manual Install

```bash
pip install shencha-agent

# Or from source
git clone https://github.com/miounet11/scagent.git
cd scagent
pip install -e .
```

### Configuration

```bash
# Set API key (choose one)
export ANTHROPIC_API_KEY=your-key
# or
export SHENCHA_API_KEY=your-key

# Or use interactive config
shencha config
```

### Run Audit

```bash
# Audit current directory
shencha

# Audit specific project
shencha ./my-project

# Quick audit mode
shencha -q

# Check environment
shencha doctor
```

## 🔧 VS Code Extension

Install the VS Code extension for in-editor auditing:

```bash
cd vscode-extension
npm install && npm run compile
```

Then press F5 to launch Extension Development Host.

**Commands:**
- `ShenCha: Audit Current File`
- `ShenCha: Audit Project`
- `ShenCha: Show Report`

## 📊 Sample Output

```
╭──────────────────────────────────────────────────────────────╮
│                      审计摘要 / Audit Summary                 │
├──────────────────────────────────────────────────────────────┤
│ 类别              │ 数量  │ 状态                              │
├──────────────────────────────────────────────────────────────┤
│ 扫描文件          │ 42    │ ✓                                 │
│ 发现问题          │ 3     │ !                                 │
│ 依赖漏洞          │ 0     │ ✓                                 │
│ 性能问题          │ 2     │ i                                 │
╰──────────────────────────────────────────────────────────────╯

📄 HTML 报告: .shencha/reports/report-20250107-223456.html
```

## 🤖 Multi-Expert AI Team

ShenCha v2.1 includes 5 specialized AI experts:

| Expert | Focus Area |
|--------|------------|
| 🎨 **UI Master** | Component structure, responsive design, accessibility |
| 📊 **Product Manager** | User experience, feature completeness, edge cases |
| ✨ **Aesthetics Master** | Visual hierarchy, color theory, animations |
| 🏛️ **Architect** | Design patterns, SOLID principles, scalability |
| 🧠 **Logic Master** | Algorithm correctness, edge cases, state management |

## 🔒 Security Scanners

| Scanner | Languages | Command |
|---------|-----------|---------|
| npm audit | JavaScript/TypeScript | Auto-detected |
| pip-audit | Python | Auto-detected |
| cargo audit | Rust | Auto-detected |

## 📈 Performance Analysis

Detects common performance anti-patterns:

- ⚠️ Nested loops O(n²)
- ⚠️ N+1 query patterns
- ⚠️ Serial await (should use Promise.all)
- ⚠️ SELECT * queries
- ⚠️ Deep nesting (>5 levels)
- ⚠️ Large bundle sizes

## 🌐 Supported Languages

- Python (.py)
- JavaScript (.js)
- TypeScript (.ts, .tsx)
- React/Vue components
- Rust (.rs)

## 📁 Project Structure

```
.shencha/
├── reports/
│   └── report-*.html    # HTML audit reports
├── knowledge/
│   ├── patterns.json    # Learned patterns
│   ├── fixes.json       # Fix history
│   └── insights.json    # Project insights
└── config.yaml          # Local config
```

## 🛠️ CLI Commands

```bash
shencha [PROJECT] [OPTIONS]

Commands:
  shencha              # Interactive audit
  shencha config       # Configuration wizard
  shencha doctor       # Environment check
  shencha pr REPO NUM  # Review GitHub PR

Options:
  -m, --mode [interactive|once|continuous]
  -q, --quick          # Quick audit mode
  --lang [en|zh]       # Report language
```

## 🔗 Integrations

- **GitHub Actions** - Auto-audit on PR
- **VS Code** - In-editor auditing
- **CI/CD** - Pipeline integration

## 📖 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [API Documentation](./docs/api.md)
- [VS Code Extension](./vscode-extension/README.md)

## 🤝 Contributing

```bash
git clone https://github.com/miounet11/scagent.git
cd scagent
pip install -e ".[dev]"
pytest
```

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

<div align="center">

**ShenCha v2.1** - AI-Powered Code Audit Agent

[GitHub](https://github.com/miounet11/scagent) • [Issues](https://github.com/miounet11/scagent/issues) • [Releases](https://github.com/miounet11/scagent/releases)

</div>
