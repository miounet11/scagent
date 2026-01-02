# ShenCha Agent (审查) - AI Code Audit Agent

> 🔍 **AI-Powered Autonomous Code Audit Agent** with Multi-Expert Team | 基于 Claude Agent SDK 的自主代码审计系统

```
   _____ _                  _____ _
  / ____| |                / ____| |
 | (___ | |__   ___ _ __  | |    | |__   __ _
  \___ \| '_ \ / _ \ '_ \ | |    | '_ \ / _` |
  ____) | | | |  __/ | | || |____| | | | (_| |
 |_____/|_| |_|\___|_| |_| \_____|_| |_|\__,_|

 AI-Powered Autonomous Code Audit Agent
 With Multi-Expert Team
```

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/miounet11/scagent)
[![Claude Agent SDK](https://img.shields.io/badge/Claude-Agent%20SDK-orange.svg)](https://docs.anthropic.com/)
[![MCP](https://img.shields.io/badge/MCP-Tools-purple.svg)](https://modelcontextprotocol.io/)

## What is ShenCha? | 什么是 ShenCha？

**ShenCha Agent** is an autonomous code audit system built on the [Claude Agent SDK](https://docs.anthropic.com/). It combines **multiple AI models** (Claude, Gemini, Grok) and **expert perspectives** to provide comprehensive code reviews.

**ShenCha Agent** 是一个基于 [Claude Agent SDK](https://docs.anthropic.com/) 构建的自主代码审计系统。它结合**多个 AI 模型**（Claude、Gemini、Grok）和**多专家视角**，提供全方位的代码审查。

### Key Features | 核心特性

- 🤖 **Fully Autonomous** - LLM-driven decisions, no human intervention needed | 完全自主，无需人工干预
- 🔍 **Continuous Audit** - 72-hour non-stop operation, audits every 3 hours | 72小时持续审计
- 🧠 **Continuous Learning** - Accumulates knowledge from each audit | 持续学习积累知识
- 💬 **Interactive Mode** - Real-time communication with developers | 实时与开发者沟通
- 🔧 **Auto-Fix** - Safely auto-fix discoverable issues | 安全自动修复问题
- 🌟 **Multi-Expert Team** - 5 expert perspectives for comprehensive review | 5位专家多维度审查

## v2.0: Multi-Expert Audit Team | 多专家审计团队

ShenCha v2.0 introduces a powerful **Multi-Expert Audit Team** for comprehensive code review:

| Expert | Tool | Expertise |
|--------|------|-----------|
| 🎨 **UI Master** | `expert_ui_audit` | Component structure, visual consistency, responsive design, accessibility |
| 📊 **Product Manager** | `expert_product_audit` | Feature completeness, UX flow, edge cases, user feedback |
| ✨ **Aesthetics Master** | `expert_aesthetics_audit` | Visual hierarchy, color theory, animation, emotional design |
| 🏛️ **Architect** | `expert_architect_audit` | Single responsibility, dependency management, design patterns |
| 🧠 **Logic Master** | `expert_logic_audit` | Logical correctness, boundary conditions, algorithm efficiency |
| 🌟 **Multi-Expert** | `multi_expert_audit` | Combined analysis from all experts |

### Multi-Model Collaboration | 多模型协作

ShenCha leverages multiple AI models for their unique strengths:

| Model | Strengths | Use Cases |
|-------|-----------|-----------|
| **Claude** | Code analysis, security audit, logic verification | Security issues, bug detection |
| **Gemini** | Performance analysis, architecture review | Optimization, system design |
| **Grok** | Creative insights, product thinking | UX improvements, feature ideas |

## Quick Start | 快速开始

### Installation | 安装

```bash
# From source
pip install -e .

# Or via pip
pip install shencha-agent
```

### Configuration | 配置

```bash
# Create .env file
cat > .env << EOF
SHENCHA_LLM_URL=https://api.anthropic.com/v1/chat/completions
SHENCHA_API_KEY=your-api-key
EOF
```

### Usage | 使用

```bash
# Interactive mode (default)
shencha /path/to/project

# Single audit
shencha /path/to/project --mode once

# Continuous audit (72 hours)
shencha /path/to/project --mode continuous --interval 3 --cycles 24
```

## Use Cases | 使用场景

### Code Review Automation | 代码审查自动化

```bash
$ shencha ./my-project

💬 ShenCha Interactive Mode
Type 'quit' to exit, 'audit' to run audit, 'report' to generate report

You: Run multi-expert audit on the homepage component
Agent: Summoning the expert team for comprehensive review...
  🔧 Using tool: mcp__shencha__multi_expert_audit

# 🌟 Multi-Expert Audit Report

## 🎨 UI Master
- Component structure is reasonable, but consider splitting into smaller sub-components
- Responsive breakpoints could be more granular...

## 🏛️ Architect
- Recommend extracting data fetching logic into custom hooks
- State management could be optimized with Context...

## 🧠 Logic Master
- Found potential null pointer exception
- Recommend adding boundary value checks...
```

### Continuous Integration | 持续集成

```bash
# Run in CI/CD pipeline
shencha ./src --mode once --output json > audit-report.json
```

### PM2 Deployment | PM2 部署

```bash
# Run with PM2 for production
pm2 start /usr/local/bin/shencha \
  --name shencha-agent \
  -- /path/to/project --mode continuous --interval 3

# Check status
pm2 status shencha-agent

# View logs
pm2 logs shencha-agent
```

## Available Tools | 可用工具

### Core Tools | 核心工具

| Tool | Description |
|------|-------------|
| `analyze_file` | Deep analysis of a single code file |
| `scan_project` | Scan project structure and files |
| `find_issues` | Find issues using pattern matching |
| `propose_fix` | Generate fix suggestions |
| `apply_fix` | Apply code fixes |
| `learn_pattern` | Learn new issue patterns |
| `get_knowledge` | Get knowledge base content |
| `save_insight` | Save project insights |
| `generate_report` | Generate audit reports |

### Multi-Model Tools | 多模型工具

| Tool | Description |
|------|-------------|
| `ask_gemini` | Use Gemini for performance/architecture analysis |
| `ask_grok` | Use Grok for product/creative insights |
| `multi_model_analysis` | Combined analysis from all models |

### Expert Tools (v2.0) | 专家工具

| Tool | Description |
|------|-------------|
| `expert_ui_audit` | 🎨 UI Master perspective audit |
| `expert_product_audit` | 📊 Product Manager perspective audit |
| `expert_aesthetics_audit` | ✨ Aesthetics Master perspective audit |
| `expert_architect_audit` | 🏛️ Architect perspective audit |
| `expert_logic_audit` | 🧠 Logic Master perspective audit |
| `multi_expert_audit` | 🌟 Multi-expert comprehensive audit |

## Issue Categories | 问题分类

ShenCha detects issues across multiple categories:

| Category | Description | Examples |
|----------|-------------|----------|
| `security` | Security vulnerabilities | SQL injection, XSS, hardcoded secrets |
| `performance` | Performance issues | N+1 queries, sync operations |
| `quality` | Code quality | Console logs, TODO comments |
| `architecture` | Architectural issues | Circular dependencies, god classes |
| `ui_design` | UI/UX issues | Missing ARIA, inline styles |
| `aesthetics` | Visual design issues | Hardcoded colors, inconsistent spacing |
| `code_logic` | Logic errors | Null checks, type safety |
| `product_logic` | Product issues | Missing loading states, error handling |

## Knowledge Base | 知识库

ShenCha creates a `.shencha/` directory to store:

```
.shencha/
├── knowledge/
│   ├── patterns.json    # Learned issue patterns
│   ├── fixes.json       # Fix history
│   ├── insights.json    # Project insights
│   └── stats.json       # Statistics
└── reports/
    ├── summary-*.md     # Summary reports
    ├── detailed-*.md    # Detailed reports
    └── final-*.md       # Final reports
```

## Architecture | 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ShenCha Agent v2.0                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │  Claude SDK │◄───── LLM-Driven Decisions ─────┐          │
│  └─────────────┘                                 │          │
│         │                                        │          │
│         ▼                                        │          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    MCP Tools Server                    │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │ │
│  │  │analyze │ │ scan   │ │ fix    │ │ learn  │         │ │
│  │  │ file   │ │project │ │ code   │ │pattern │         │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘         │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         🌟 Multi-Expert Team (v2.0)              │ │ │
│  │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │ │ │
│  │  │  │ UI │ │ PM │ │ AE │ │ARCH│ │LOGIC│           │ │ │
│  │  │  └────┘ └────┘ └────┘ └────┘ └────┘            │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│         │                                │                  │
│         ▼                                │                  │
│  ┌─────────────┐    ┌─────────────┐     │                  │
│  │ Knowledge   │◄───│   Hooks     │◄────┘                  │
│  │    Base     │    │  (Pre/Post) │                         │
│  └─────────────┘    └─────────────┘                         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Reporter   │───► Markdown/JSON Reports                  │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Reference | API 参考

```python
import asyncio
from shencha_agent import ShenChaAgent

async def main():
    # Create agent
    agent = ShenChaAgent(
        project_path="./my-project",
        llm_base_url="https://api.anthropic.com/v1/chat/completions",
        llm_api_key="your-api-key"
    )

    # Initialize
    await agent.initialize()

    # Run single audit
    result = await agent.run_once()
    print(f"Issues found: {result['issues_found']}")
    print(f"Issues fixed: {result['issues_fixed']}")

    # Or run interactive mode
    await agent.run_interactive()

asyncio.run(main())
```

## Configuration | 配置参数

### CLI Arguments | 命令行参数

```bash
shencha [PROJECT_PATH] [OPTIONS]

Options:
  --mode [once|continuous|interactive]  Run mode (default: interactive)
  --interval FLOAT                      Interval hours for continuous mode (default: 3)
  --cycles INTEGER                      Max audit cycles (default: 24)
  --config PATH                         Config file path
  --help                                Show help
```

### Environment Variables | 环境变量

| Variable | Description |
|----------|-------------|
| `SHENCHA_LLM_URL` | LLM API endpoint |
| `SHENCHA_API_KEY` | API key |
| `SHENCHA_MODEL` | Model name (default: claude-opus-4-5-20251101) |

## Contributing | 贡献

```bash
# Clone repository
git clone https://github.com/miounet11/scagent.git
cd scagent

# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/
isort src/
```

## Related Projects | 相关项目

- [Claude Agent SDK](https://docs.anthropic.com/) - Official SDK for building Claude agents
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) - Protocol for AI tool integration
- [Anthropic API](https://docs.anthropic.com/claude/reference) - Claude API reference

## License | 许可证

MIT License - See [LICENSE](./LICENSE)

---

<div align="center">

**ShenCha v2.0** - Multi-Expert Team, Comprehensive Audit

审查不止，进化不息 | Expert Team, Comprehensive Audit

[![Star History Chart](https://api.star-history.com/svg?repos=miounet11/scagent&type=Date)](https://star-history.com/#miounet11/scagent&Date)

</div>
