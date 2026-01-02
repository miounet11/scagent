#!/usr/bin/env python3
"""
ShenCha Knowledge Base - 知识库系统

用于持续学习和积累审计经验：
- 问题模式识别
- 修复历史记录
- 项目洞察
- 工具使用统计
"""

import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from dataclasses import dataclass, field, asdict
import re


@dataclass
class Pattern:
    """问题模式"""
    name: str
    regex: str
    issue_type: str  # security, performance, quality, deprecated
    severity: str  # critical, high, medium, low
    fix_suggestion: str
    learned_at: str
    match_count: int = 0
    false_positives: int = 0


@dataclass
class Fix:
    """修复记录"""
    file: str
    description: str
    old_code: str
    new_code: str
    timestamp: str
    issue_type: str = "unknown"
    success: bool = True


@dataclass
class Insight:
    """项目洞察"""
    title: str
    insight: str
    category: str  # architecture, security, performance, ux, business, ui_design, aesthetics, product_logic, code_logic
    priority: str  # critical, high, medium, low
    created_at: str
    applied: bool = False
    expert_source: str = "general"  # general, ui_master, product_manager, aesthetics_master, architect, logic_master


class KnowledgeBase:
    """
    知识库 - 持续学习和积累审计经验

    数据结构：
    - patterns: 问题识别模式
    - fixes: 修复历史
    - insights: 项目洞察
    - tool_usage: 工具使用统计
    - file_analysis: 文件分析缓存
    """

    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # 核心数据
        self.patterns: list[Pattern] = []
        self.fixes: list[Fix] = []
        self.insights: list[Insight] = []

        # 统计数据
        self.tool_usage: dict[str, int] = {}
        self.file_analysis: dict[str, dict] = {}

        # 内置默认模式
        self._default_patterns = self._get_default_patterns()

    def _get_default_patterns(self) -> list[dict]:
        """默认问题模式"""
        return [
            # 安全问题
            {
                "name": "hardcoded_secret",
                "regex": r"(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]",
                "issue_type": "security",
                "severity": "critical",
                "fix_suggestion": "将敏感信息移到环境变量"
            },
            {
                "name": "sql_injection",
                "regex": r"(query|exec|execute)\s*\(\s*[\"'].*\$\{.*\}",
                "issue_type": "security",
                "severity": "critical",
                "fix_suggestion": "使用参数化查询"
            },
            {
                "name": "eval_usage",
                "regex": r"\beval\s*\(",
                "issue_type": "security",
                "severity": "high",
                "fix_suggestion": "避免使用 eval，使用更安全的替代方案"
            },
            # 性能问题
            {
                "name": "n_plus_one",
                "regex": r"for\s*\(.*\)\s*\{[^}]*await\s+.*\.(find|query|fetch)",
                "issue_type": "performance",
                "severity": "medium",
                "fix_suggestion": "考虑批量查询而非循环内逐个查询"
            },
            {
                "name": "sync_fs",
                "regex": r"(readFileSync|writeFileSync|existsSync)",
                "issue_type": "performance",
                "severity": "low",
                "fix_suggestion": "使用异步 fs 方法避免阻塞"
            },
            # 代码质量
            {
                "name": "console_log",
                "regex": r"console\.(log|debug|info)\s*\(",
                "issue_type": "quality",
                "severity": "low",
                "fix_suggestion": "移除调试日志或使用专门的日志库"
            },
            {
                "name": "todo_comment",
                "regex": r"(TODO|FIXME|HACK|XXX)[\s:]+",
                "issue_type": "quality",
                "severity": "low",
                "fix_suggestion": "处理 TODO 注释或创建任务跟踪"
            },
            {
                "name": "empty_catch",
                "regex": r"catch\s*\([^)]*\)\s*\{\s*\}",
                "issue_type": "quality",
                "severity": "medium",
                "fix_suggestion": "不要吞掉异常，至少记录日志"
            },
            # 已弃用
            {
                "name": "deprecated_react",
                "regex": r"(componentWillMount|componentWillReceiveProps|componentWillUpdate)",
                "issue_type": "deprecated",
                "severity": "medium",
                "fix_suggestion": "使用新的生命周期方法"
            },
            # ========== 架构问题 ==========
            {
                "name": "circular_import",
                "regex": r"from\s+['\"]\.\.\/.*['\"].*from\s+['\"]\.\.\/.*['\"]",
                "issue_type": "architecture",
                "severity": "medium",
                "fix_suggestion": "重构以消除循环依赖"
            },
            {
                "name": "god_class",
                "regex": r"class\s+\w+\s*\{[^}]{5000,}",
                "issue_type": "architecture",
                "severity": "high",
                "fix_suggestion": "拆分为多个更小、职责单一的类"
            },
            {
                "name": "mixed_concerns",
                "regex": r"(fetch|axios).*setState|useEffect.*\.(save|update|delete)",
                "issue_type": "architecture",
                "severity": "medium",
                "fix_suggestion": "将数据获取与UI逻辑分离"
            },
            # ========== UI/UX 问题 ==========
            {
                "name": "inline_styles",
                "regex": r"style=\{\{[^}]+\}\}",
                "issue_type": "ui_design",
                "severity": "low",
                "fix_suggestion": "使用 CSS 类或 styled-components 替代内联样式"
            },
            {
                "name": "missing_aria",
                "regex": r"<(button|a|input)[^>]*(?!aria-)[^>]*>",
                "issue_type": "ui_design",
                "severity": "medium",
                "fix_suggestion": "添加适当的 ARIA 属性以提高可访问性"
            },
            {
                "name": "magic_numbers_style",
                "regex": r"(padding|margin|width|height):\s*\d{3,}px",
                "issue_type": "ui_design",
                "severity": "low",
                "fix_suggestion": "使用设计系统的间距变量"
            },
            {
                "name": "hardcoded_colors",
                "regex": r"color:\s*#[0-9a-fA-F]{6}",
                "issue_type": "aesthetics",
                "severity": "low",
                "fix_suggestion": "使用主题色彩变量"
            },
            # ========== 逻辑问题 ==========
            {
                "name": "missing_null_check",
                "regex": r"\w+\.\w+\.\w+",
                "issue_type": "code_logic",
                "severity": "medium",
                "fix_suggestion": "添加可选链(?.)或空值检查"
            },
            {
                "name": "dangling_promise",
                "regex": r"async\s+\w+\s*\([^)]*\)\s*\{[^}]*\}\s*[^.]",
                "issue_type": "code_logic",
                "severity": "medium",
                "fix_suggestion": "确保 async 函数的 Promise 被正确处理"
            },
            # ========== 产品问题 ==========
            {
                "name": "missing_loading_state",
                "regex": r"useEffect.*fetch.*\{[^}]*\}[^}]*(?!loading)",
                "issue_type": "product_logic",
                "severity": "medium",
                "fix_suggestion": "添加加载状态以提升用户体验"
            },
            {
                "name": "missing_error_boundary",
                "regex": r"<ErrorBoundary>",
                "issue_type": "product_logic",
                "severity": "high",
                "fix_suggestion": "使用 ErrorBoundary 捕获组件错误"
            },
        ]

    async def load(self):
        """加载知识库"""
        try:
            # 加载模式
            patterns_file = self.storage_path / "patterns.json"
            if patterns_file.exists():
                data = json.loads(patterns_file.read_text())
                self.patterns = [Pattern(**p) for p in data]

            # 加载修复历史
            fixes_file = self.storage_path / "fixes.json"
            if fixes_file.exists():
                data = json.loads(fixes_file.read_text())
                self.fixes = [Fix(**f) for f in data]

            # 加载洞察
            insights_file = self.storage_path / "insights.json"
            if insights_file.exists():
                data = json.loads(insights_file.read_text())
                self.insights = [Insight(**i) for i in data]

            # 加载统计
            stats_file = self.storage_path / "stats.json"
            if stats_file.exists():
                data = json.loads(stats_file.read_text())
                self.tool_usage = data.get("tool_usage", {})
                self.file_analysis = data.get("file_analysis", {})

            print(f"[KnowledgeBase] Loaded: {len(self.patterns)} patterns, {len(self.fixes)} fixes, {len(self.insights)} insights")

        except Exception as e:
            print(f"[KnowledgeBase] Load error: {e}")

    async def save(self):
        """保存知识库"""
        try:
            # 保存模式
            patterns_file = self.storage_path / "patterns.json"
            patterns_file.write_text(json.dumps(
                [asdict(p) for p in self.patterns],
                indent=2, ensure_ascii=False
            ))

            # 保存修复历史
            fixes_file = self.storage_path / "fixes.json"
            fixes_file.write_text(json.dumps(
                [asdict(f) for f in self.fixes],
                indent=2, ensure_ascii=False
            ))

            # 保存洞察
            insights_file = self.storage_path / "insights.json"
            insights_file.write_text(json.dumps(
                [asdict(i) for i in self.insights],
                indent=2, ensure_ascii=False
            ))

            # 保存统计
            stats_file = self.storage_path / "stats.json"
            stats_file.write_text(json.dumps({
                "tool_usage": self.tool_usage,
                "file_analysis": self.file_analysis,
                "last_saved": datetime.now().isoformat()
            }, indent=2, ensure_ascii=False))

            print(f"[KnowledgeBase] Saved successfully")

        except Exception as e:
            print(f"[KnowledgeBase] Save error: {e}")

    @property
    def entries(self) -> int:
        """总条目数"""
        return len(self.patterns) + len(self.fixes) + len(self.insights)

    # ========== 模式管理 ==========

    def get_patterns_for_file(self, file_path: str) -> list[dict]:
        """获取适用于特定文件的模式"""
        all_patterns = [asdict(p) for p in self.patterns]
        all_patterns.extend(self._default_patterns)

        # 根据文件类型过滤
        ext = Path(file_path).suffix.lower()

        if ext in ['.py']:
            # Python 特定模式
            pass
        elif ext in ['.ts', '.tsx', '.js', '.jsx']:
            # JavaScript/TypeScript 模式
            pass

        return all_patterns

    def get_issue_patterns(self, issue_type: str) -> list[dict]:
        """获取特定类型的问题模式"""
        all_patterns = [asdict(p) for p in self.patterns if p.issue_type == issue_type]
        all_patterns.extend([p for p in self._default_patterns if p["issue_type"] == issue_type])
        return all_patterns

    async def add_pattern(self, pattern_data: dict):
        """添加新模式"""
        pattern = Pattern(
            name=pattern_data["name"],
            regex=pattern_data["regex"],
            issue_type=pattern_data["issue_type"],
            severity=pattern_data["severity"],
            fix_suggestion=pattern_data["fix_suggestion"],
            learned_at=pattern_data.get("learned_at", datetime.now().isoformat())
        )

        # 检查是否已存在
        existing = next((p for p in self.patterns if p.name == pattern.name), None)
        if existing:
            # 更新现有模式
            self.patterns.remove(existing)

        self.patterns.append(pattern)
        print(f"[KnowledgeBase] Added pattern: {pattern.name}")

    # ========== 修复管理 ==========

    def find_similar_fixes(self, issue_description: str) -> list[dict]:
        """查找相似的修复记录"""
        # 简单的关键词匹配
        keywords = set(issue_description.lower().split())

        scored_fixes = []
        for fix in self.fixes:
            desc_keywords = set(fix.description.lower().split())
            score = len(keywords & desc_keywords)
            if score > 0:
                scored_fixes.append((score, asdict(fix)))

        # 按相似度排序
        scored_fixes.sort(key=lambda x: x[0], reverse=True)
        return [f[1] for f in scored_fixes[:5]]

    async def add_fix(self, fix_data: dict):
        """添加修复记录"""
        fix = Fix(
            file=fix_data["file"],
            description=fix_data["description"],
            old_code=fix_data["old_code"],
            new_code=fix_data["new_code"],
            timestamp=fix_data.get("timestamp", datetime.now().isoformat()),
            issue_type=fix_data.get("issue_type", "unknown"),
            success=fix_data.get("success", True)
        )
        self.fixes.append(fix)
        print(f"[KnowledgeBase] Added fix: {fix.description[:50]}...")

    # ========== 洞察管理 ==========

    async def add_insight(self, insight_data: dict):
        """添加项目洞察"""
        insight = Insight(
            title=insight_data["title"],
            insight=insight_data["insight"],
            category=insight_data["category"],
            priority=insight_data["priority"],
            created_at=insight_data.get("created_at", datetime.now().isoformat())
        )
        self.insights.append(insight)
        print(f"[KnowledgeBase] Added insight: {insight.title}")

    def get_pending_insights(self) -> list[dict]:
        """获取未应用的洞察"""
        return [asdict(i) for i in self.insights if not i.applied]

    # ========== 统计 ==========

    def record_tool_usage(self, tool_name: str):
        """记录工具使用"""
        self.tool_usage[tool_name] = self.tool_usage.get(tool_name, 0) + 1

    def get_summary(self, category: str = "all") -> dict:
        """获取知识库摘要"""
        summary = {
            "total_entries": self.entries,
            "last_updated": datetime.now().isoformat(),
        }

        if category in ["all", "patterns"]:
            summary["patterns"] = {
                "count": len(self.patterns),
                "by_type": {},
                "by_severity": {},
            }
            for p in self.patterns:
                summary["patterns"]["by_type"][p.issue_type] = summary["patterns"]["by_type"].get(p.issue_type, 0) + 1
                summary["patterns"]["by_severity"][p.severity] = summary["patterns"]["by_severity"].get(p.severity, 0) + 1

        if category in ["all", "fixes"]:
            summary["fixes"] = {
                "count": len(self.fixes),
                "success_rate": sum(1 for f in self.fixes if f.success) / len(self.fixes) if self.fixes else 0,
                "recent": [asdict(f) for f in self.fixes[-5:]],
            }

        if category in ["all", "insights"]:
            summary["insights"] = {
                "count": len(self.insights),
                "pending": len([i for i in self.insights if not i.applied]),
                "by_category": {},
                "by_priority": {},
            }
            for i in self.insights:
                summary["insights"]["by_category"][i.category] = summary["insights"]["by_category"].get(i.category, 0) + 1
                summary["insights"]["by_priority"][i.priority] = summary["insights"]["by_priority"].get(i.priority, 0) + 1

        if category in ["all", "stats"]:
            summary["tool_usage"] = self.tool_usage

        return summary


# ========== 辅助函数 ==========

def calculate_similarity(text1: str, text2: str) -> float:
    """计算文本相似度（简单实现）"""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())

    if not words1 or not words2:
        return 0.0

    intersection = len(words1 & words2)
    union = len(words1 | words2)

    return intersection / union if union > 0 else 0.0
