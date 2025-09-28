"""Type definitions for the CertNode SDK."""

from typing import Dict, List, Optional, Tuple, Union
from typing_extensions import TypedDict


class AIDetectionMethods(TypedDict):
    """AI detection method scores."""
    linguistic: float
    statistical: float
    perplexity: float
    fingerprint: float


class AIDetectionResult(TypedDict):
    """AI detection analysis result."""
    confidence: float
    methods: AIDetectionMethods
    detected_models: List[str]
    indicators: List[str]
    reasoning: str
    confidence_interval: Tuple[float, float]
    processing_time: int


class CryptographicProof(TypedDict):
    """Cryptographic proof data."""
    signature: str
    merkle_root: str
    algorithm: str
    issued_at: str


class ContentReceipt(TypedDict):
    """Content authenticity receipt."""
    id: str
    content_hash: str
    content_type: str
    status: str
    created_at: str
    ai_detection: AIDetectionResult
    cryptographic_proof: CryptographicProof


class CertificationResponse(TypedDict):
    """Response from content certification."""
    success: bool
    receipt: ContentReceipt


class VerificationResponse(TypedDict):
    """Response from content verification."""
    valid: bool
    receipt: ContentReceipt


class RateLimitInfo(TypedDict):
    """Rate limiting information."""
    limit: int
    remaining: int
    reset: int
    retry_after: Optional[int]


class UsageStats(TypedDict):
    """API usage statistics."""
    current_period: Dict[str, Union[int, str]]
    tier: str


class ContentCertificationRequest:
    """Request for content certification."""

    def __init__(
        self,
        content: Union[str, bytes],
        content_type: str,
        metadata: Optional[Dict[str, any]] = None,
        provenance: Optional[Dict[str, any]] = None,
    ):
        self.content = content
        self.content_type = content_type
        self.metadata = metadata or {}
        self.provenance = provenance or {}