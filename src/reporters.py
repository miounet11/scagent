#!/usr/bin/env python3
"""
ShenCha Audit Reporter - 审计报告生成器

生成多种格式的审计报告：
- Markdown 格式
- JSON 格式
- 控制台输出
"""

import json
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .knowledge import KnowledgeBase


class AuditReporter:
    """
    审计报告生成器

    支持：
    - 单周期报告
    - 汇总报告
    - 知识库导出
    """

    def __init__(self, output_path: Path):
        self.output_path = output_path
        self.output_path.mkdir(parents=True, exist_ok=True)

    async def generate(self, report_type: str, knowledge: "KnowledgeBase") -> Path:
        """生成报告"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

        if report_type == "summary":
            return await self._generate_summary(knowledge, timestamp)
        elif report_type == "detailed":
            return await self._generate_detailed(knowledge, timestamp)
        elif report_type == "fixes":
            return await self._generate_fixes_report(knowledge, timestamp)
        elif report_type == "insights":
            return await self._generate_insights_report(knowledge, timestamp)
        elif report_type == "final":
            return await self._generate_final_report(knowledge, timestamp)
        else:
            return await self._generate_summary(knowledge, timestamp)

    async def _generate_summary(self, knowledge: "KnowledgeBase", timestamp: str) -> Path:
        """生成摘要报告"""
        summary = knowledge.get_summary("all")

        content = f"""# ShenCha 审计摘要报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 概览

| 指标 | 数值 |
|------|------|
| 知识库条目 | {summary['total_entries']} |
| 已学习模式 | {summary.get('patterns', {}).get('count', 0)} |
| 修复记录 | {summary.get('fixes', {}).get('count', 0)} |
| 项目洞察 | {summary.get('insights', {}).get('count', 0)} |

## 模式分布

### 按类型
"""
        patterns = summary.get('patterns', {})
        for issue_type, count in patterns.get('by_type', {}).items():
            content += f"- {issue_type}: {count}\n"

        content += "\n### 按严重程度\n"
        for severity, count in patterns.get('by_severity', {}).items():
            content += f"- {severity}: {count}\n"

        content += f"""

## 修复统计

- 成功率: {summary.get('fixes', {}).get('success_rate', 0) * 100:.1f}%

### 最近修复
"""
        for fix in summary.get('fixes', {}).get('recent', []):
            content += f"- `{fix['file']}`: {fix['description'][:50]}...\n"

        content += f"""

## 待处理洞察

共 {summary.get('insights', {}).get('pending', 0)} 项待处理洞察

---
*由 ShenCha Agent 自动生成*
"""

        # 保存
        report_path = self.output_path / f"summary-{timestamp}.md"
        report_path.write_text(content, encoding="utf-8")

        # 同时保存 JSON
        json_path = self.output_path / f"summary-{timestamp}.json"
        json_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

        print(f"[Reporter] Summary saved: {report_path}")
        return report_path

    async def _generate_detailed(self, knowledge: "KnowledgeBase", timestamp: str) -> Path:
        """生成详细报告"""
        content = f"""# ShenCha 详细审计报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 1. 已学习模式

共 {len(knowledge.patterns)} 个自定义模式

"""
        for i, pattern in enumerate(knowledge.patterns, 1):
            content += f"""### {i}. {pattern.name}

- **类型**: {pattern.issue_type}
- **严重程度**: {pattern.severity}
- **正则**: `{pattern.regex}`
- **修复建议**: {pattern.fix_suggestion}
- **学习时间**: {pattern.learned_at}
- **匹配次数**: {pattern.match_count}

"""

        content += f"""## 2. 修复历史

共 {len(knowledge.fixes)} 条修复记录

"""
        for i, fix in enumerate(knowledge.fixes[-20:], 1):  # 最近 20 条
            content += f"""### {i}. {fix.description[:60]}

- **文件**: `{fix.file}`
- **时间**: {fix.timestamp}
- **状态**: {'✅ 成功' if fix.success else '❌ 失败'}

<details>
<summary>代码变更</summary>

**原代码:**
```
{fix.old_code[:500]}
```

**新代码:**
```
{fix.new_code[:500]}
```
</details>

"""

        content += f"""## 3. 项目洞察

共 {len(knowledge.insights)} 条洞察

"""
        for i, insight in enumerate(knowledge.insights, 1):
            status = "⏳ 待处理" if not insight.applied else "✅ 已应用"
            content += f"""### {i}. {insight.title}

- **类别**: {insight.category}
- **优先级**: {insight.priority}
- **状态**: {status}
- **创建时间**: {insight.created_at}

{insight.insight}

"""

        content += """
---
*由 ShenCha Agent 自动生成*
"""

        report_path = self.output_path / f"detailed-{timestamp}.md"
        report_path.write_text(content, encoding="utf-8")

        print(f"[Reporter] Detailed report saved: {report_path}")
        return report_path

    async def _generate_fixes_report(self, knowledge: "KnowledgeBase", timestamp: str) -> Path:
        """生成修复专项报告"""
        content = f"""# ShenCha 修复报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 修复统计

| 指标 | 数值 |
|------|------|
| 总修复数 | {len(knowledge.fixes)} |
| 成功数 | {sum(1 for f in knowledge.fixes if f.success)} |
| 失败数 | {sum(1 for f in knowledge.fixes if not f.success)} |
| 成功率 | {sum(1 for f in knowledge.fixes if f.success) / len(knowledge.fixes) * 100 if knowledge.fixes else 0:.1f}% |

## 按文件分组

"""
        # 按文件分组
        by_file: dict[str, list] = {}
        for fix in knowledge.fixes:
            if fix.file not in by_file:
                by_file[fix.file] = []
            by_file[fix.file].append(fix)

        for file_path, fixes in sorted(by_file.items(), key=lambda x: -len(x[1])):
            content += f"### `{file_path}` ({len(fixes)} 次修复)\n\n"
            for fix in fixes:
                content += f"- {fix.description} ({fix.timestamp[:10]})\n"
            content += "\n"

        report_path = self.output_path / f"fixes-{timestamp}.md"
        report_path.write_text(content, encoding="utf-8")

        print(f"[Reporter] Fixes report saved: {report_path}")
        return report_path

    async def _generate_insights_report(self, knowledge: "KnowledgeBase", timestamp: str) -> Path:
        """生成洞察专项报告"""
        content = f"""# ShenCha 项目洞察报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 洞察统计

| 类别 | 数量 |
|------|------|
"""
        by_category: dict[str, int] = {}
        by_priority: dict[str, int] = {}

        for insight in knowledge.insights:
            by_category[insight.category] = by_category.get(insight.category, 0) + 1
            by_priority[insight.priority] = by_priority.get(insight.priority, 0) + 1

        for cat, count in sorted(by_category.items()):
            content += f"| {cat} | {count} |\n"

        content += f"""

## 按优先级

"""
        priority_order = ['critical', 'high', 'medium', 'low']
        for priority in priority_order:
            if priority in by_priority:
                content += f"### {priority.upper()} ({by_priority[priority]})\n\n"
                for insight in knowledge.insights:
                    if insight.priority == priority:
                        status = "⏳" if not insight.applied else "✅"
                        content += f"- {status} **{insight.title}** [{insight.category}]\n"
                        content += f"  {insight.insight[:100]}...\n\n"

        report_path = self.output_path / f"insights-{timestamp}.md"
        report_path.write_text(content, encoding="utf-8")

        print(f"[Reporter] Insights report saved: {report_path}")
        return report_path

    async def _generate_final_report(self, knowledge: "KnowledgeBase", timestamp: str) -> Path:
        """生成最终汇总报告"""
        content = f"""# ShenCha 审计最终报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## 执行摘要

本次审计周期已完成，以下是主要发现和建议。

### 核心指标

| 指标 | 数值 |
|------|------|
| 学习的模式 | {len(knowledge.patterns)} |
| 执行的修复 | {len(knowledge.fixes)} |
| 发现的洞察 | {len(knowledge.insights)} |
| 修复成功率 | {sum(1 for f in knowledge.fixes if f.success) / len(knowledge.fixes) * 100 if knowledge.fixes else 100:.1f}% |

## 高优先级待办

"""
        # 高优先级洞察
        high_priority = [i for i in knowledge.insights if i.priority in ['critical', 'high'] and not i.applied]
        if high_priority:
            for insight in high_priority[:10]:
                content += f"### ⚠️ {insight.title}\n\n"
                content += f"**类别**: {insight.category} | **优先级**: {insight.priority}\n\n"
                content += f"{insight.insight}\n\n"
        else:
            content += "无高优先级待办项。\n\n"

        content += """## 建议的下一步

1. 审查高优先级洞察并制定行动计划
2. 验证自动修复的代码变更
3. 将学习到的模式应用到 CI/CD 流程
4. 定期运行审计以持续改进

---

## 附录

### 工具使用统计

"""
        for tool, count in sorted(knowledge.tool_usage.items(), key=lambda x: -x[1]):
            content += f"- {tool}: {count} 次\n"

        content += """

---
*由 ShenCha Agent 自动生成*
*审查不止，进化不息*
"""

        report_path = self.output_path / f"final-report-{timestamp}.md"
        report_path.write_text(content, encoding="utf-8")

        # 保存完整 JSON 数据
        full_data = {
            "generated_at": datetime.now().isoformat(),
            "knowledge_summary": knowledge.get_summary("all"),
            "patterns": [
                {
                    "name": p.name,
                    "issue_type": p.issue_type,
                    "severity": p.severity,
                    "match_count": p.match_count
                }
                for p in knowledge.patterns
            ],
            "recent_fixes": [
                {
                    "file": f.file,
                    "description": f.description,
                    "success": f.success,
                    "timestamp": f.timestamp
                }
                for f in knowledge.fixes[-50:]
            ],
            "pending_insights": [
                {
                    "title": i.title,
                    "category": i.category,
                    "priority": i.priority
                }
                for i in knowledge.insights if not i.applied
            ]
        }

        json_path = self.output_path / f"final-report-{timestamp}.json"
        json_path.write_text(json.dumps(full_data, indent=2, ensure_ascii=False), encoding="utf-8")

        print(f"[Reporter] Final report saved: {report_path}")
        return report_path


class ConsoleReporter:
    """控制台实时报告"""

    @staticmethod
    def print_cycle_start(cycle_num: int, total_cycles: int):
        """打印周期开始"""
        print(f"\n{'='*60}")
        print(f"🔍 审计周期 #{cycle_num}/{total_cycles}")
        print(f"{'='*60}\n")

    @staticmethod
    def print_cycle_end(result: dict):
        """打印周期结束"""
        print(f"\n{'='*60}")
        print(f"✅ 周期完成")
        print(f"   发现问题: {result.get('issues_found', 0)}")
        print(f"   修复问题: {result.get('issues_fixed', 0)}")
        print(f"   新增洞察: {len(result.get('insights', []))}")
        print(f"{'='*60}\n")

    @staticmethod
    def print_tool_use(tool_name: str, status: str = "running"):
        """打印工具使用"""
        icons = {
            "running": "🔧",
            "success": "✅",
            "error": "❌"
        }
        print(f"  {icons.get(status, '•')} {tool_name}")

    @staticmethod
    def print_finding(title: str, severity: str):
        """打印发现"""
        severity_icons = {
            "critical": "🔴",
            "high": "🟠",
            "medium": "🟡",
            "low": "🟢"
        }
        print(f"  {severity_icons.get(severity, '•')} [{severity.upper()}] {title}")
