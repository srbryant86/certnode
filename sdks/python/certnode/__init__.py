"""
CertNode Python SDK

Official Python SDK for the CertNode Content Authenticity API.
Detect AI-generated content with 90%+ accuracy using advanced
perplexity analysis and model fingerprinting.
"""

from .client import CertNodeClient, CertNodeError
from .types import (
    ContentCertificationRequest,
    AIDetectionResult,
    ContentReceipt,
    CertificationResponse,
    VerificationResponse,
    RateLimitInfo,
)

__version__ = "2.0.0"
__all__ = [
    "CertNodeClient",
    "CertNodeError",
    "ContentCertificationRequest",
    "AIDetectionResult",
    "ContentReceipt",
    "CertificationResponse",
    "VerificationResponse",
    "RateLimitInfo",
]