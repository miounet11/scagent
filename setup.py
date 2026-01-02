#!/usr/bin/env python3
"""
ShenCha Agent - Setup Script

使用方式:
    pip install .
    pip install -e .  # 开发模式
    shencha --help
"""

from setuptools import setup, find_packages
from pathlib import Path

# 读取 README
readme_path = Path(__file__).parent / "README.md"
long_description = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""

# 读取依赖
requirements_path = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_path.exists():
    requirements = [
        line.strip()
        for line in requirements_path.read_text().split("\n")
        if line.strip() and not line.startswith("#")
    ]

setup(
    name="shencha-agent",
    version="1.0.0",
    author="X-Tavern Team",
    author_email="dev@x-tavern.com",
    description="AI-Powered Autonomous Code Audit Agent based on Claude Agent SDK",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/x-tavern/shencha-agent",
    project_urls={
        "Bug Tracker": "https://github.com/x-tavern/shencha-agent/issues",
        "Documentation": "https://github.com/x-tavern/shencha-agent#readme",
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Quality Assurance",
        "Topic :: Software Development :: Testing",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    keywords=[
        "code-audit",
        "ai",
        "llm",
        "claude",
        "automation",
        "code-review",
        "security",
        "agent",
    ],
    package_dir={"": "."},
    packages=find_packages(where="."),
    python_requires=">=3.10",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.23.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "mypy>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "shencha=src.agent:main",
            "shencha-agent=src.agent:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
