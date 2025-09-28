from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="certnode-python",
    version="2.0.0",
    author="CertNode",
    author_email="support@certnode.io",
    description="Official Python SDK for CertNode Content Authenticity API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/srbryant86/certnode",
    project_urls={
        "Bug Tracker": "https://github.com/srbryant86/certnode/issues",
        "Documentation": "https://docs.certnode.io",
        "Homepage": "https://certnode.io",
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Security :: Cryptography",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=1.0.0",
        ],
    },
    keywords=[
        "certnode",
        "content-authenticity",
        "ai-detection",
        "cryptographic-receipts",
        "content-verification",
        "ai-generated-content",
    ],
)