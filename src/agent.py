#!/usr/bin/env python3
"""
ShenCha Agent - 基于 Claude Agent SDK 的自主代码审计系统

特性：
- 完全 LLM 驱动的自主决策
- 持续运行和学习
- 与用户实时沟通
- 知识库积累和应用
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# Claude Agent SDK - 官方 SDK
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    HookMatcher,
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ResultMessage,
)

from .knowledge import KnowledgeBase
from .reporters import AuditReporter


class ShenChaAgent:
    """
    审查 Agent - 自主代码审计系统

    通过不断的总结和学习，持续提升目标项目质量
    """

    def __init__(
        self,
        project_path: str,
        config_path: Optional[str] = None,
        llm_base_url: Optional[str] = None,
        llm_api_key: Optional[str] = None,
    ):
        self.project_path = Path(project_path).resolve()
        self.config_path = config_path
        self.llm_base_url = llm_base_url or os.getenv("SHENCHA_LLM_URL")
        self.llm_api_key = llm_api_key or os.getenv("SHENCHA_API_KEY")

        # 状态
        self.session_id: Optional[str] = None
        self.cycle_count = 0
        self.total_issues_found = 0
        self.total_issues_fixed = 0
        self.is_running = False

        # 知识库 - 持续学习
        self.knowledge = KnowledgeBase(self.project_path / ".shencha" / "knowledge")

        # 报告器
        self.reporter = AuditReporter(self.project_path / ".shencha" / "reports")

        # MCP 服务器和工具
        self.mcp_server = None
        self.options = None

    async def initialize(self):
        """初始化 Agent 和所有工具"""

        print("🔧 初始化 ShenCha Agent...")

        # 创建目录
        (self.project_path / ".shencha" / "knowledge").mkdir(parents=True, exist_ok=True)
        (self.project_path / ".shencha" / "reports").mkdir(parents=True, exist_ok=True)

        # 加载知识库
        await self.knowledge.load()

        # 创建 MCP 工具服务器
        self.mcp_server = self._create_tools()

        # 配置 Agent 选项
        self.options = self._create_options()

        print(f"✅ Agent 初始化完成")
        print(f"   项目路径: {self.project_path}")
        print(f"   知识库条目: {self.knowledge.entries}")

    def _create_tools(self):
        """创建自定义审计工具"""

        knowledge = self.knowledge
        project_path = self.project_path

        # ========== 代码分析工具 ==========

        @tool(
            "analyze_file",
            "深度分析单个代码文件，检查安全、性能、代码质量问题",
            {
                "file_path": str,
                "focus_areas": str,  # "security,performance,quality,all"
            }
        )
        async def analyze_file(args: dict[str, Any]) -> dict[str, Any]:
            """分析单个文件"""
            file_path = project_path / args["file_path"]
            focus = args.get("focus_areas", "all").split(",")

            if not file_path.exists():
                return {
                    "content": [{"type": "text", "text": f"文件不存在: {file_path}"}],
                    "is_error": True
                }

            try:
                content = file_path.read_text(encoding="utf-8")
                lines = len(content.split("\n"))

                # 检查知识库中是否有相关模式
                known_patterns = knowledge.get_patterns_for_file(str(file_path))

                analysis = {
                    "file": args["file_path"],
                    "lines": lines,
                    "size_bytes": len(content),
                    "focus_areas": focus,
                    "known_patterns": known_patterns,
                    "content_preview": content[:2000] if len(content) > 2000 else content,
                }

                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(analysis, indent=2, ensure_ascii=False)
                    }]
                }
            except Exception as e:
                return {
                    "content": [{"type": "text", "text": f"分析失败: {str(e)}"}],
                    "is_error": True
                }

        @tool(
            "scan_project",
            "扫描整个项目，获取文件结构和概览",
            {
                "file_pattern": str,  # e.g., "**/*.py", "**/*.ts"
                "exclude_patterns": str,  # 逗号分隔的排除模式
            }
        )
        async def scan_project(args: dict[str, Any]) -> dict[str, Any]:
            """扫描项目结构"""
            import glob

            pattern = args.get("file_pattern", "**/*")
            excludes = args.get("exclude_patterns", "node_modules,__pycache__,.git,.next").split(",")

            all_files = []
            for f in project_path.glob(pattern):
                if f.is_file():
                    rel_path = str(f.relative_to(project_path))
                    if not any(exc in rel_path for exc in excludes):
                        all_files.append({
                            "path": rel_path,
                            "size": f.stat().st_size,
                            "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
                        })

            # 按修改时间排序
            all_files.sort(key=lambda x: x["modified"], reverse=True)

            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "total_files": len(all_files),
                        "recent_files": all_files[:50],
                        "file_types": self._count_file_types(all_files)
                    }, indent=2, ensure_ascii=False)
                }]
            }

        # ========== 问题发现工具 ==========

        @tool(
            "find_issues",
            "使用模式匹配查找潜在问题",
            {
                "issue_type": str,  # "security", "performance", "deprecated", "todo"
                "file_pattern": str,
            }
        )
        async def find_issues(args: dict[str, Any]) -> dict[str, Any]:
            """查找特定类型的问题"""
            issue_type = args["issue_type"]
            pattern = args.get("file_pattern", "**/*.py")

            # 从知识库获取已知模式
            patterns = knowledge.get_issue_patterns(issue_type)

            issues = []
            for f in project_path.glob(pattern):
                if f.is_file():
                    try:
                        content = f.read_text(encoding="utf-8")
                        for p in patterns:
                            import re
                            matches = list(re.finditer(p["regex"], content))
                            for m in matches:
                                line_num = content[:m.start()].count("\n") + 1
                                issues.append({
                                    "file": str(f.relative_to(project_path)),
                                    "line": line_num,
                                    "pattern": p["name"],
                                    "severity": p.get("severity", "medium"),
                                    "match": m.group()[:100]
                                })
                    except:
                        pass

            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "issue_type": issue_type,
                        "total_issues": len(issues),
                        "issues": issues[:100]
                    }, indent=2, ensure_ascii=False)
                }]
            }

        # ========== 修复工具 ==========

        @tool(
            "propose_fix",
            "为发现的问题生成修复方案",
            {
                "file_path": str,
                "issue_description": str,
                "issue_line": int,
            }
        )
        async def propose_fix(args: dict[str, Any]) -> dict[str, Any]:
            """生成修复建议"""
            file_path = project_path / args["file_path"]

            if not file_path.exists():
                return {
                    "content": [{"type": "text", "text": "文件不存在"}],
                    "is_error": True
                }

            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
            line_num = args["issue_line"]

            # 获取上下文
            start = max(0, line_num - 5)
            end = min(len(lines), line_num + 5)
            context = "\n".join(f"{i+start+1}: {lines[i+start]}" for i in range(end - start))

            # 查看知识库中是否有类似修复
            similar_fixes = knowledge.find_similar_fixes(args["issue_description"])

            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "file": args["file_path"],
                        "issue": args["issue_description"],
                        "line": line_num,
                        "context": context,
                        "similar_fixes": similar_fixes[:3],
                        "instruction": "基于上下文和类似修复，请生成具体的修复代码"
                    }, indent=2, ensure_ascii=False)
                }]
            }

        @tool(
            "apply_fix",
            "应用代码修复",
            {
                "file_path": str,
                "old_code": str,
                "new_code": str,
                "fix_description": str,
            }
        )
        async def apply_fix(args: dict[str, Any]) -> dict[str, Any]:
            """应用修复"""
            file_path = project_path / args["file_path"]

            if not file_path.exists():
                return {
                    "content": [{"type": "text", "text": "文件不存在"}],
                    "is_error": True
                }

            content = file_path.read_text(encoding="utf-8")

            if args["old_code"] not in content:
                return {
                    "content": [{"type": "text", "text": "找不到要替换的代码"}],
                    "is_error": True
                }

            # 应用修复
            new_content = content.replace(args["old_code"], args["new_code"], 1)
            file_path.write_text(new_content, encoding="utf-8")

            # 记录到知识库
            await knowledge.add_fix({
                "file": args["file_path"],
                "description": args["fix_description"],
                "old_code": args["old_code"],
                "new_code": args["new_code"],
                "timestamp": datetime.now().isoformat()
            })

            return {
                "content": [{
                    "type": "text",
                    "text": f"✅ 修复已应用: {args['fix_description']}"
                }]
            }

        # ========== 学习工具 ==========

        @tool(
            "learn_pattern",
            "将发现的问题模式添加到知识库",
            {
                "pattern_name": str,
                "pattern_regex": str,
                "issue_type": str,
                "severity": str,
                "fix_suggestion": str,
            }
        )
        async def learn_pattern(args: dict[str, Any]) -> dict[str, Any]:
            """学习新模式"""
            await knowledge.add_pattern({
                "name": args["pattern_name"],
                "regex": args["pattern_regex"],
                "issue_type": args["issue_type"],
                "severity": args["severity"],
                "fix_suggestion": args["fix_suggestion"],
                "learned_at": datetime.now().isoformat()
            })

            return {
                "content": [{
                    "type": "text",
                    "text": f"✅ 已学习新模式: {args['pattern_name']}"
                }]
            }

        @tool(
            "get_knowledge",
            "获取知识库中的学习成果",
            {
                "category": str,  # "patterns", "fixes", "insights", "all"
            }
        )
        async def get_knowledge(args: dict[str, Any]) -> dict[str, Any]:
            """获取知识库"""
            category = args.get("category", "all")

            data = knowledge.get_summary(category)

            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps(data, indent=2, ensure_ascii=False)
                }]
            }

        @tool(
            "save_insight",
            "保存项目洞察和建议",
            {
                "title": str,
                "insight": str,
                "category": str,
                "priority": str,
            }
        )
        async def save_insight(args: dict[str, Any]) -> dict[str, Any]:
            """保存洞察"""
            await knowledge.add_insight({
                "title": args["title"],
                "insight": args["insight"],
                "category": args["category"],
                "priority": args["priority"],
                "created_at": datetime.now().isoformat()
            })

            return {
                "content": [{
                    "type": "text",
                    "text": f"✅ 洞察已保存: {args['title']}"
                }]
            }

        # ========== 报告工具 ==========

        @tool(
            "generate_report",
            "生成审计报告",
            {
                "report_type": str,  # "summary", "detailed", "fixes", "insights"
            }
        )
        async def generate_report(args: dict[str, Any]) -> dict[str, Any]:
            """生成报告"""
            report_type = args.get("report_type", "summary")
            report_path = await self.reporter.generate(report_type, knowledge)

            return {
                "content": [{
                    "type": "text",
                    "text": f"📄 报告已生成: {report_path}"
                }]
            }

        # ========== 多模型 LLM 工具 ==========

        @tool(
            "ask_gemini",
            "使用 Gemini 模型进行性能分析、架构建议、优化方案",
            {
                "prompt": str,
                "task_type": str,  # "performance", "architecture", "optimization"
            }
        )
        async def ask_gemini_tool(args: dict[str, Any]) -> dict[str, Any]:
            """调用 Gemini 模型"""
            from .llm_client import MultiLLMClient, LLMModel

            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=args["prompt"],
                    model=LLMModel.GEMINI.value,
                    system_prompt="你是性能和架构优化专家。提供专业、可行的建议。"
                )

            return {
                "content": [{
                    "type": "text",
                    "text": f"[Gemini 分析]\n\n{response}"
                }]
            }

        @tool(
            "ask_grok",
            "使用 Grok 模型进行创意功能建议、产品洞察、用户体验改进",
            {
                "prompt": str,
                "task_type": str,  # "creative", "feature_ideas", "product_insight"
            }
        )
        async def ask_grok_tool(args: dict[str, Any]) -> dict[str, Any]:
            """调用 Grok 模型"""
            from .llm_client import MultiLLMClient, LLMModel

            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=args["prompt"],
                    model=LLMModel.GROK.value,
                    system_prompt="你是产品创新专家。提供有创意但可行的建议。"
                )

            return {
                "content": [{
                    "type": "text",
                    "text": f"[Grok 创意]\n\n{response}"
                }]
            }

        @tool(
            "multi_model_analysis",
            "使用多个模型（Claude+Gemini+Grok）综合分析代码，各取所长",
            {
                "code": str,
                "context": str,
            }
        )
        async def multi_model_analysis_tool(args: dict[str, Any]) -> dict[str, Any]:
            """多模型综合分析"""
            from .llm_client import MultiLLMClient

            async with MultiLLMClient() as client:
                results = await client.multi_model_analysis(
                    code=args["code"],
                    context=args.get("context", "")
                )

            output = f"""# 多模型综合分析

## 🔐 Claude - 安全与正确性
{results['claude_security']}

## ⚡ Gemini - 性能与架构
{results['gemini_performance']}

## 💡 Grok - 创新建议
{results['grok_innovation']}
"""
            return {
                "content": [{
                    "type": "text",
                    "text": output
                }]
            }

        # ========== 多专家审计工具 ==========

        @tool(
            "expert_ui_audit",
            "🎨 UI大师审计 - 分析界面设计、组件结构、视觉一致性、响应式设计、无障碍性",
            {
                "file_path": str,
                "component_type": str,  # "page", "component", "layout", "form"
            }
        )
        async def expert_ui_audit(args: dict[str, Any]) -> dict[str, Any]:
            """UI大师视角审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            component_type = args.get("component_type", "component")

            prompt = f"""作为一位顶级 UI 大师，请审计以下{component_type}代码：

```
{content[:8000]}
```

请从以下维度评审：

1. **组件结构** - 组件拆分是否合理？职责是否单一？
2. **视觉一致性** - 是否遵循设计系统？间距、颜色、字体是否统一？
3. **响应式设计** - 是否适配不同屏幕尺寸？断点是否合理？
4. **交互设计** - 交互状态是否完整（hover, focus, active, disabled）？
5. **无障碍性** - ARIA 属性是否正确？键盘导航是否支持？
6. **性能** - 是否有不必要的重渲染？图片是否优化？
7. **代码质量** - CSS/样式是否整洁？是否有重复代码？

请给出具体问题和改进建议，格式如下：
- 问题描述
- 严重程度（high/medium/low）
- 具体代码位置
- 改进建议
"""
            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=prompt,
                    model="gemini",
                    system_prompt="你是世界级的 UI/UX 设计专家，精通 React、Mantine、Tailwind。你的审美标准对标 Apple、Stripe、Linear。"
                )

            return {"content": [{"type": "text", "text": f"🎨 **UI大师审计报告**\n\n{response}"}]}

        @tool(
            "expert_product_audit",
            "📊 顶级产品经理审计 - 分析功能完整性、用户体验流程、业务逻辑、边界情况处理",
            {
                "file_path": str,
                "feature_context": str,  # 功能上下文描述
            }
        )
        async def expert_product_audit(args: dict[str, Any]) -> dict[str, Any]:
            """顶级产品经理视角审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            feature_context = args.get("feature_context", "")

            prompt = f"""作为一位顶级产品经理（对标 Notion、Discord、Figma 级别），请审计以下代码的产品逻辑：

功能上下文：{feature_context}

```
{content[:8000]}
```

请从以下维度评审：

1. **功能完整性** - 核心功能是否完整？是否有遗漏的用户场景？
2. **用户体验流程** - 操作流程是否顺畅？是否有不必要的步骤？
3. **边界情况** - 空状态、错误状态、加载状态是否处理？
4. **用户反馈** - 操作是否有即时反馈？成功/失败提示是否清晰？
5. **数据一致性** - 数据状态是否正确同步？乐观更新是否合理？
6. **竞品对比** - 与行业最佳实践相比有何差距？
7. **可扩展性** - 功能是否为未来扩展留有空间？

请给出具体问题和产品改进建议。
"""
            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=prompt,
                    model="grok",
                    system_prompt="你是 Notion、Discord、Figma 级别的产品经理。你深谙用户心理，能发现产品逻辑中的细微问题。"
                )

            return {"content": [{"type": "text", "text": f"📊 **产品经理审计报告**\n\n{response}"}]}

        @tool(
            "expert_aesthetics_audit",
            "✨ 审美大师审计 - 分析视觉美学、色彩搭配、动效设计、情感化设计",
            {
                "file_path": str,
                "design_context": str,  # 设计背景说明
            }
        )
        async def expert_aesthetics_audit(args: dict[str, Any]) -> dict[str, Any]:
            """审美大师视角审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            design_context = args.get("design_context", "")

            prompt = f"""作为一位顶级审美大师（对标 Apple、Porsche、Dieter Rams 设计哲学），请审计以下代码的视觉美学：

设计背景：{design_context}

```
{content[:8000]}
```

请从以下维度评审：

1. **视觉层次** - 信息层级是否清晰？视觉焦点是否正确引导？
2. **色彩运用** - 色彩搭配是否和谐？是否符合情感表达需求？
3. **空间韵律** - 留白是否得当？元素间距是否有节奏感？
4. **动效设计** - 动画是否流畅自然？是否增强了交互体验？
5. **细节打磨** - 圆角、阴影、边框等细节是否精致？
6. **情感化设计** - 是否触发正确的情感反应？品牌调性是否一致？
7. **简约美学** - 是否做到了"少即是多"？有无冗余视觉元素？

请像艺术评论家一样，给出美学层面的具体问题和提升建议。
"""
            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=prompt,
                    model="gemini",
                    system_prompt="你是具有顶级审美品位的设计大师，精通包豪斯设计哲学和现代极简主义。你的眼光挑剔但建设性。"
                )

            return {"content": [{"type": "text", "text": f"✨ **审美大师审计报告**\n\n{response}"}]}

        @tool(
            "expert_architect_audit",
            "🏛️ 顶级架构师审计 - 分析系统架构、模块设计、依赖关系、可扩展性、设计模式",
            {
                "file_path": str,
                "architecture_scope": str,  # "module", "feature", "system"
            }
        )
        async def expert_architect_audit(args: dict[str, Any]) -> dict[str, Any]:
            """顶级架构师视角审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            scope = args.get("architecture_scope", "module")

            prompt = f"""作为一位顶级软件架构师（对标 Google、Meta、Netflix 级别），请审计以下{scope}级代码的架构设计：

```
{content[:8000]}
```

请从以下维度评审：

1. **单一职责** - 模块职责是否单一清晰？是否有混杂的关注点？
2. **依赖管理** - 依赖方向是否正确？是否存在循环依赖？
3. **抽象层次** - 抽象是否恰当？是否过度抽象或抽象不足？
4. **接口设计** - API 设计是否清晰？是否易于使用和理解？
5. **可测试性** - 代码是否易于测试？依赖是否可注入？
6. **可扩展性** - 是否遵循开闭原则？扩展是否方便？
7. **设计模式** - 是否正确运用设计模式？是否有反模式？
8. **边界划分** - 模块边界是否清晰？是否有越界调用？

请给出架构层面的具体问题和重构建议。
"""
            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=prompt,
                    model="gemini",
                    system_prompt="你是 Google、Meta、Netflix 级别的软件架构师。你精通 DDD、Clean Architecture、SOLID 原则。"
                )

            return {"content": [{"type": "text", "text": f"🏛️ **架构师审计报告**\n\n{response}"}]}

        @tool(
            "expert_logic_audit",
            "🧠 逻辑大师审计 - 分析业务逻辑正确性、算法效率、条件覆盖、数据流",
            {
                "file_path": str,
                "logic_context": str,  # 业务逻辑上下文
            }
        )
        async def expert_logic_audit(args: dict[str, Any]) -> dict[str, Any]:
            """逻辑大师视角审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            logic_context = args.get("logic_context", "")

            prompt = f"""作为一位逻辑大师（精通形式逻辑、数学证明、算法分析），请审计以下代码的逻辑正确性：

业务上下文：{logic_context}

```
{content[:8000]}
```

请从以下维度评审：

1. **逻辑正确性** - 条件判断是否完整？是否有逻辑漏洞？
2. **边界条件** - 边界值是否正确处理？off-by-one 错误？
3. **状态转换** - 状态机是否完整？是否有非法状态转换？
4. **数据流** - 数据流向是否清晰？是否有数据竞争风险？
5. **算法效率** - 时间复杂度是否最优？是否有不必要的计算？
6. **类型安全** - 类型使用是否正确？是否有隐式转换风险？
7. **空值处理** - null/undefined 是否正确处理？
8. **不变量** - 是否维护了必要的不变量？前置/后置条件是否满足？

请像数学家一样严谨地分析，给出逻辑问题和修复建议。
"""
            async with MultiLLMClient() as client:
                response = await client.call(
                    prompt=prompt,
                    model="claude",
                    system_prompt="你是一位精通形式逻辑和程序验证的专家。你的分析严谨如数学证明，不放过任何逻辑漏洞。"
                )

            return {"content": [{"type": "text", "text": f"🧠 **逻辑大师审计报告**\n\n{response}"}]}

        @tool(
            "multi_expert_audit",
            "🌟 多专家综合审计 - 同时调用5位专家（UI、产品、审美、架构、逻辑）进行全方位审计",
            {
                "file_path": str,
                "context": str,  # 文件上下文描述
            }
        )
        async def multi_expert_audit(args: dict[str, Any]) -> dict[str, Any]:
            """多专家综合审计"""
            from .llm_client import MultiLLMClient

            file_path = project_path / args["file_path"]
            if not file_path.exists():
                return {"content": [{"type": "text", "text": f"文件不存在: {file_path}"}], "is_error": True}

            content = file_path.read_text(encoding="utf-8")
            context = args.get("context", "")

            # 判断文件类型，选择合适的专家组合
            ext = Path(args["file_path"]).suffix.lower()
            is_frontend = ext in ['.tsx', '.jsx', '.css', '.scss']
            is_backend = ext in ['.ts', '.js', '.py'] and not is_frontend

            async with MultiLLMClient() as client:
                results = {}

                # UI + 审美（前端文件）
                if is_frontend:
                    ui_prompt = f"作为UI大师，简要评审这个前端文件的UI设计问题（3-5点）:\n```\n{content[:4000]}\n```"
                    results['ui'] = await client.call(ui_prompt, "gemini", "你是UI设计专家")

                    aesthetics_prompt = f"作为审美大师，简要评审这个文件的视觉美学问题（3-5点）:\n```\n{content[:4000]}\n```"
                    results['aesthetics'] = await client.call(aesthetics_prompt, "gemini", "你是审美设计专家")

                # 架构（所有文件）
                arch_prompt = f"作为架构师，简要评审这个文件的架构设计问题（3-5点）:\n```\n{content[:4000]}\n```"
                results['architecture'] = await client.call(arch_prompt, "gemini", "你是软件架构专家")

                # 逻辑（所有文件）
                logic_prompt = f"作为逻辑专家，简要评审这个文件的逻辑正确性问题（3-5点）:\n```\n{content[:4000]}\n```"
                results['logic'] = await client.call(logic_prompt, "claude", "你是逻辑分析专家")

                # 产品（功能文件）
                if 'page' in args["file_path"].lower() or 'component' in args["file_path"].lower():
                    product_prompt = f"作为产品经理，简要评审这个文件的产品逻辑问题（3-5点）:\n```\n{content[:4000]}\n```"
                    results['product'] = await client.call(product_prompt, "grok", "你是产品经理专家")

            output = f"""# 🌟 多专家综合审计报告

**文件**: {args["file_path"]}
**上下文**: {context}

"""
            if 'ui' in results:
                output += f"## 🎨 UI大师\n{results['ui']}\n\n"
            if 'aesthetics' in results:
                output += f"## ✨ 审美大师\n{results['aesthetics']}\n\n"
            output += f"## 🏛️ 架构师\n{results['architecture']}\n\n"
            output += f"## 🧠 逻辑大师\n{results['logic']}\n\n"
            if 'product' in results:
                output += f"## 📊 产品经理\n{results['product']}\n\n"

            return {"content": [{"type": "text", "text": output}]}

        # 创建 MCP 服务器
        return create_sdk_mcp_server(
            name="shencha-tools",
            version="2.0.0",
            tools=[
                analyze_file,
                scan_project,
                find_issues,
                propose_fix,
                apply_fix,
                learn_pattern,
                get_knowledge,
                save_insight,
                generate_report,
                # 多模型工具
                ask_gemini_tool,
                ask_grok_tool,
                multi_model_analysis_tool,
                # 多专家审计工具
                expert_ui_audit,
                expert_product_audit,
                expert_aesthetics_audit,
                expert_architect_audit,
                expert_logic_audit,
                multi_expert_audit,
            ]
        )

    def _count_file_types(self, files: list) -> dict:
        """统计文件类型"""
        types = {}
        for f in files:
            ext = Path(f["path"]).suffix or "无扩展名"
            types[ext] = types.get(ext, 0) + 1
        return dict(sorted(types.items(), key=lambda x: x[1], reverse=True)[:20])

    def _create_options(self) -> ClaudeAgentOptions:
        """创建 Agent 配置"""

        return ClaudeAgentOptions(
            # MCP 工具
            mcp_servers={"shencha": self.mcp_server},

            # 允许的工具
            allowed_tools=[
                # 自定义工具
                "mcp__shencha__analyze_file",
                "mcp__shencha__scan_project",
                "mcp__shencha__find_issues",
                "mcp__shencha__propose_fix",
                "mcp__shencha__apply_fix",
                "mcp__shencha__learn_pattern",
                "mcp__shencha__get_knowledge",
                "mcp__shencha__save_insight",
                "mcp__shencha__generate_report",
                # 多模型工具
                "mcp__shencha__ask_gemini",
                "mcp__shencha__ask_grok",
                "mcp__shencha__multi_model_analysis",
                # 多专家审计工具
                "mcp__shencha__expert_ui_audit",
                "mcp__shencha__expert_product_audit",
                "mcp__shencha__expert_aesthetics_audit",
                "mcp__shencha__expert_architect_audit",
                "mcp__shencha__expert_logic_audit",
                "mcp__shencha__multi_expert_audit",
                # 内置工具
                "Read",
                "Write",
                "Edit",
                "Bash",
                "Glob",
                "Grep",
            ],

            # 自动接受编辑
            permission_mode="acceptEdits",

            # 工作目录
            cwd=str(self.project_path),

            # Hook 配置
            hooks={
                "PreToolUse": [
                    HookMatcher(
                        matcher="mcp__shencha__apply_fix",
                        hooks=[self._pre_fix_hook]
                    ),
                ],
                "PostToolUse": [
                    HookMatcher(
                        hooks=[self._post_tool_hook]
                    ),
                ],
            },

            # 系统提示词
            system_prompt=self._get_system_prompt(),
        )

    def _get_system_prompt(self) -> str:
        """获取系统提示词"""
        return f"""你是 ShenCha（审查）- 一个自主的代码审计 Agent。

你的使命是持续监控和改进项目代码质量。你可以：
1. 自主扫描和分析代码
2. 发现安全、性能、代码质量问题
3. 生成并应用修复
4. 从每次审计中学习，积累知识
5. 与用户沟通，汇报进展

当前项目: {self.project_path}

知识库状态:
- 已学习模式: {len(self.knowledge.patterns)}
- 已记录修复: {len(self.knowledge.fixes)}
- 已保存洞察: {len(self.knowledge.insights)}

## 多模型能力

你可以使用多个 AI 模型，各取所长：

1. **Claude (你自己)**: 代码分析、安全审计、Bug 修复、代码审查
2. **Gemini** (ask_gemini 工具): 性能分析、架构建议、优化方案
3. **Grok** (ask_grok 工具): 创意功能、产品洞察、用户体验改进
4. **综合分析** (multi_model_analysis 工具): 同时调用三个模型分析代码

## 🌟 多专家审计团队

你拥有一支顶级专家团队，可以对代码进行多维度审计：

1. **🎨 UI大师** (expert_ui_audit):
   - 组件结构、视觉一致性、响应式设计
   - 交互设计、无障碍性、前端性能
   - 对标 Apple、Stripe、Linear 设计标准

2. **📊 顶级产品经理** (expert_product_audit):
   - 功能完整性、用户体验流程、边界情况
   - 用户反馈、数据一致性、竞品对比
   - 对标 Notion、Discord、Figma 级别

3. **✨ 审美大师** (expert_aesthetics_audit):
   - 视觉层次、色彩运用、空间韵律
   - 动效设计、细节打磨、情感化设计
   - 对标 Apple、Porsche、包豪斯设计哲学

4. **🏛️ 顶级架构师** (expert_architect_audit):
   - 单一职责、依赖管理、抽象层次
   - 接口设计、可测试性、设计模式
   - 对标 Google、Meta、Netflix 架构标准

5. **🧠 逻辑大师** (expert_logic_audit):
   - 逻辑正确性、边界条件、状态转换
   - 数据流、算法效率、类型安全
   - 像数学家一样严谨分析

6. **🌟 多专家综合审计** (multi_expert_audit):
   - 同时调用多位专家对文件进行全方位审计
   - 根据文件类型自动选择合适的专家组合

## 工作原则

1. 始终优先处理安全问题
2. 修复前先备份或确认
3. 每次发现新模式时记录到知识库
4. 定期生成报告
5. 保持与用户的沟通
6. 善用多模型和多专家能力，取长补短

## 审计策略

**对于前端组件/页面**:
- 优先使用 expert_ui_audit、expert_aesthetics_audit、expert_product_audit

**对于后端服务/API**:
- 优先使用 expert_architect_audit、expert_logic_audit

**对于核心业务逻辑**:
- 使用 multi_expert_audit 进行全方位审计

**对于安全敏感代码**:
- 始终使用 Claude 直接分析 + expert_logic_audit

使用可用工具来完成任务。每次审计后，总结发现并提出下一步建议。"""

    async def _pre_fix_hook(
        self,
        input_data: dict[str, Any],
        tool_use_id: str | None,
        context: Any
    ) -> dict[str, Any]:
        """修复前的验证"""
        file_path = input_data.get("tool_input", {}).get("file_path", "")

        # 测试文件可以自动修复
        if "test" in file_path.lower() or file_path.endswith((".test.ts", ".test.py", ".spec.ts")):
            print(f"  ✅ 自动批准修复测试文件: {file_path}")
            return {}

        # 其他文件记录但允许
        print(f"  ⚠️ 修复生产文件: {file_path}")
        return {}

    async def _post_tool_hook(
        self,
        input_data: dict[str, Any],
        tool_use_id: str | None,
        context: Any
    ) -> dict[str, Any]:
        """工具执行后的学习"""
        tool_name = input_data.get("tool_name", "")

        # 记录工具使用
        self.knowledge.record_tool_usage(tool_name)

        return {}

    # ========== 运行模式 ==========

    async def run_once(self, task: Optional[str] = None) -> dict:
        """运行单次审计"""

        prompt = task or """
执行一次完整的代码审计：
1. 扫描项目结构
2. 分析最近修改的文件
3. 查找安全和性能问题
4. 对可修复的问题生成修复建议
5. 总结发现并更新知识库
6. 生成审计报告
"""

        self.cycle_count += 1
        print(f"\n{'='*60}")
        print(f"🔍 审计周期 #{self.cycle_count}")
        print(f"{'='*60}\n")

        result = {
            "cycle": self.cycle_count,
            "start_time": datetime.now().isoformat(),
            "issues_found": 0,
            "issues_fixed": 0,
            "insights": [],
            "messages": [],
        }

        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(prompt)

            async for message in client.receive_response():
                await self._process_message(message, result)

                # 保存会话 ID
                if hasattr(message, 'session_id'):
                    self.session_id = message.session_id

        result["end_time"] = datetime.now().isoformat()

        # 保存知识库
        await self.knowledge.save()

        print(f"\n{'='*60}")
        print(f"✅ 周期 #{self.cycle_count} 完成")
        print(f"   发现问题: {result['issues_found']}")
        print(f"   修复问题: {result['issues_fixed']}")
        print(f"{'='*60}\n")

        return result

    async def run_continuous(self, interval_hours: float = 3, max_cycles: int = 24):
        """持续运行审计"""

        self.is_running = True
        print(f"\n🚀 启动持续审计模式")
        print(f"   间隔: {interval_hours} 小时")
        print(f"   最大周期: {max_cycles}")

        try:
            while self.is_running and self.cycle_count < max_cycles:
                await self.run_once()

                if self.cycle_count < max_cycles:
                    next_run = datetime.now().isoformat()
                    print(f"\n⏰ 下次审计: {interval_hours} 小时后")
                    await asyncio.sleep(interval_hours * 3600)

        except asyncio.CancelledError:
            print("\n⏹️ 审计已取消")

        finally:
            self.is_running = False
            await self.knowledge.save()
            print("\n📊 生成最终报告...")
            await self.reporter.generate("final", self.knowledge)

    async def run_interactive(self):
        """交互模式 - 与用户对话"""

        print("\n💬 ShenCha 交互模式")
        print("输入 'quit' 退出, 'audit' 运行审计, 'report' 生成报告\n")

        async with ClaudeSDKClient(options=self.options) as client:
            # 初始化
            await client.query("你好，我是项目的开发者。请简要介绍你自己和当前项目状态。")

            async for message in client.receive_response():
                self._print_message(message)

            # 交互循环
            while True:
                try:
                    user_input = input("\n你: ").strip()

                    if not user_input:
                        continue

                    if user_input.lower() == "quit":
                        print("\n👋 再见！")
                        break

                    if user_input.lower() == "audit":
                        user_input = "执行一次完整的代码审计"

                    if user_input.lower() == "report":
                        user_input = "生成当前审计状态的详细报告"

                    await client.query(user_input)

                    print("\nAgent: ", end="", flush=True)
                    async for message in client.receive_response():
                        self._print_message(message)

                except KeyboardInterrupt:
                    print("\n\n👋 再见！")
                    break

        await self.knowledge.save()

    async def _process_message(self, message: Any, result: dict):
        """处理 Agent 响应"""

        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)
                    result["messages"].append(block.text)
                elif isinstance(block, ToolUseBlock):
                    print(f"  🔧 使用工具: {block.name}")

        elif isinstance(message, ResultMessage):
            if message.total_cost_usd:
                print(f"  💰 成本: ${message.total_cost_usd:.4f}")

    def _print_message(self, message: Any):
        """打印消息"""
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)
                elif isinstance(block, ToolUseBlock):
                    print(f"\n  🔧 {block.name}")


# ========== CLI 入口 ==========

async def async_main():
    """异步主函数"""
    import argparse

    parser = argparse.ArgumentParser(
        description="ShenCha (审查) - 基于 Claude Agent SDK 的自主代码审计 Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  shencha ./my-project                    # 交互模式
  shencha ./my-project --mode once        # 单次审计
  shencha ./my-project --mode continuous  # 持续审计 (72小时)

更多信息请访问: https://github.com/x-tavern/shencha-agent
        """
    )
    parser.add_argument("project", nargs="?", default=".", help="项目路径 (默认: 当前目录)")
    parser.add_argument(
        "--mode", "-m",
        choices=["once", "continuous", "interactive"],
        default="interactive",
        help="运行模式: once=单次审计, continuous=持续审计, interactive=交互模式 (默认)"
    )
    parser.add_argument(
        "--interval", "-i",
        type=float, default=3,
        help="持续模式的间隔小时数 (默认: 3)"
    )
    parser.add_argument(
        "--cycles", "-c",
        type=int, default=24,
        help="最大审计周期数 (默认: 24, 即 72 小时)"
    )
    parser.add_argument(
        "--config",
        type=str, default=None,
        help="配置文件路径"
    )
    parser.add_argument(
        "--version", "-v",
        action="version",
        version="ShenCha Agent v1.0.0"
    )

    args = parser.parse_args()

    # 打印 Banner
    print("""
   _____ _                  _____ _
  / ____| |                / ____| |
 | (___ | |__   ___ _ __  | |    | |__   __ _
  \\___ \\| '_ \\ / _ \\ '_ \\ | |    | '_ \\ / _` |
  ____) | | | |  __/ | | || |____| | | | (_| |
 |_____/|_| |_|\\___|_| |_| \\_____|_| |_|\\__,_|

 AI-Powered Autonomous Code Audit Agent
 Based on Claude Agent SDK
    """)

    try:
        agent = ShenChaAgent(
            project_path=args.project,
            config_path=args.config
        )
        await agent.initialize()

        if args.mode == "once":
            await agent.run_once()
        elif args.mode == "continuous":
            await agent.run_continuous(args.interval, args.cycles)
        else:
            await agent.run_interactive()

    except KeyboardInterrupt:
        print("\n\n👋 审计已中断")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        raise


def main():
    """CLI 入口点"""
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
