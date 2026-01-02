#!/usr/bin/env python3
"""
Multi-LLM Client - 多模型 LLM 客户端

支持通过 NewAPI 调用多个 LLM：
- Claude: 代码分析、安全审计、Bug 修复
- Gemini: 性能优化、架构建议
- Grok: 创意功能、产品建议
"""

import os
import json
import asyncio
from typing import Any, Optional
from dataclasses import dataclass
from enum import Enum
import aiohttp


class LLMModel(Enum):
    """可用的 LLM 模型"""
    CLAUDE = "claude-opus-4-5-20251101"
    GEMINI = "gemini-3-pro-preview"
    GROK = "grok-4"


@dataclass
class LLMConfig:
    """LLM 配置"""
    base_url: str = "https://ttkk.inping.com/v1/chat/completions"
    api_key: str = ""
    default_model: str = "claude-opus-4-5-20251101"
    timeout: int = 120

    @classmethod
    def from_env(cls) -> "LLMConfig":
        """从环境变量加载配置"""
        return cls(
            base_url=os.getenv("SHENCHA_LLM_URL", "https://ttkk.inping.com/v1/chat/completions"),
            api_key=os.getenv("SHENCHA_API_KEY", os.getenv("ANTHROPIC_AUTH_TOKEN", "")),
            default_model=os.getenv("SHENCHA_DEFAULT_MODEL", "claude-opus-4-5-20251101"),
            timeout=int(os.getenv("SHENCHA_TIMEOUT", "120"))
        )


# 任务类型到模型的映射
TASK_MODEL_MAPPING = {
    # Claude 擅长
    "code_analysis": LLMModel.CLAUDE,
    "security_audit": LLMModel.CLAUDE,
    "bug_fix": LLMModel.CLAUDE,
    "code_review": LLMModel.CLAUDE,
    "refactoring": LLMModel.CLAUDE,

    # Gemini 擅长
    "performance": LLMModel.GEMINI,
    "architecture": LLMModel.GEMINI,
    "optimization": LLMModel.GEMINI,
    "best_practices": LLMModel.GEMINI,

    # Grok 擅长
    "creative": LLMModel.GROK,
    "feature_ideas": LLMModel.GROK,
    "product_insight": LLMModel.GROK,
    "user_experience": LLMModel.GROK,
}


class MultiLLMClient:
    """多模型 LLM 客户端"""

    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig.from_env()
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()

    async def _ensure_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()

    async def call(
        self,
        prompt: str,
        model: Optional[str] = None,
        task_type: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        调用 LLM

        Args:
            prompt: 用户提示
            model: 直接指定模型名称
            task_type: 任务类型（自动选择模型）
            system_prompt: 系统提示
            temperature: 温度
            max_tokens: 最大 token 数

        Returns:
            LLM 响应文本
        """
        await self._ensure_session()

        # 确定使用的模型
        if model:
            model_name = model
        elif task_type and task_type in TASK_MODEL_MAPPING:
            model_name = TASK_MODEL_MAPPING[task_type].value
        else:
            model_name = self.config.default_model

        # 构建消息
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # 调用 API
        try:
            async with self._session.post(
                self.config.base_url,
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    return f"[LLM Error] {response.status}: {error_text[:200]}"

                data = await response.json()
                return data["choices"][0]["message"]["content"]

        except asyncio.TimeoutError:
            return f"[LLM Error] Timeout after {self.config.timeout}s"
        except Exception as e:
            return f"[LLM Error] {str(e)}"

    async def analyze_code(self, code: str, focus: str = "all") -> str:
        """使用 Claude 分析代码"""
        return await self.call(
            prompt=f"分析以下代码，关注 {focus}：\n\n```\n{code}\n```",
            task_type="code_analysis",
            system_prompt="你是一个专业的代码审计专家。分析代码并指出问题。"
        )

    async def get_performance_suggestions(self, code: str) -> str:
        """使用 Gemini 获取性能建议"""
        return await self.call(
            prompt=f"分析以下代码的性能问题并提供优化建议：\n\n```\n{code}\n```",
            task_type="performance",
            system_prompt="你是性能优化专家。分析代码性能并提供具体的优化方案。"
        )

    async def get_creative_ideas(self, context: str) -> str:
        """使用 Grok 获取创意建议"""
        return await self.call(
            prompt=f"基于以下项目情况，提供创新的功能建议：\n\n{context}",
            task_type="creative",
            system_prompt="你是产品创新专家。提供有创意但可行的功能建议。"
        )

    async def multi_model_analysis(self, code: str, context: str = "") -> dict:
        """
        多模型综合分析

        同时调用三个模型，各取所长
        """
        # 并行调用三个模型
        tasks = [
            self.call(
                prompt=f"审计以下代码的安全性和正确性：\n\n```\n{code}\n```",
                model=LLMModel.CLAUDE.value,
                system_prompt="你是代码安全专家。"
            ),
            self.call(
                prompt=f"分析以下代码的性能和架构：\n\n```\n{code}\n```",
                model=LLMModel.GEMINI.value,
                system_prompt="你是性能和架构专家。"
            ),
            self.call(
                prompt=f"基于这段代码，有什么创新改进建议？\n\n```\n{code}\n```\n\n上下文：{context}",
                model=LLMModel.GROK.value,
                system_prompt="你是产品创新专家。"
            ),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            "claude_security": results[0] if not isinstance(results[0], Exception) else str(results[0]),
            "gemini_performance": results[1] if not isinstance(results[1], Exception) else str(results[1]),
            "grok_innovation": results[2] if not isinstance(results[2], Exception) else str(results[2]),
        }


# 全局客户端实例
_client: Optional[MultiLLMClient] = None


async def get_llm_client() -> MultiLLMClient:
    """获取全局 LLM 客户端"""
    global _client
    if _client is None:
        _client = MultiLLMClient()
    return _client


# 便捷函数
async def ask_claude(prompt: str, system: str = "") -> str:
    """快速调用 Claude"""
    client = await get_llm_client()
    return await client.call(prompt, model=LLMModel.CLAUDE.value, system_prompt=system)


async def ask_gemini(prompt: str, system: str = "") -> str:
    """快速调用 Gemini"""
    client = await get_llm_client()
    return await client.call(prompt, model=LLMModel.GEMINI.value, system_prompt=system)


async def ask_grok(prompt: str, system: str = "") -> str:
    """快速调用 Grok"""
    client = await get_llm_client()
    return await client.call(prompt, model=LLMModel.GROK.value, system_prompt=system)
