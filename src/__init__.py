"""
ShenCha Agent - 基于 Claude Agent SDK 的自主代码审计系统

特性：
- 完全 LLM 驱动的自主决策
- 持续运行和学习
- 与用户实时沟通
- 知识库积累和应用
"""

from .agent import ShenChaAgent, main, async_main
from .knowledge import KnowledgeBase, Pattern, Fix, Insight
from .reporters import AuditReporter, ConsoleReporter

__version__ = "1.0.0"
__author__ = "X-Tavern Team"

__all__ = [
    "ShenChaAgent",
    "KnowledgeBase",
    "Pattern",
    "Fix",
    "Insight",
    "AuditReporter",
    "ConsoleReporter",
    "main",
    "async_main",
]
