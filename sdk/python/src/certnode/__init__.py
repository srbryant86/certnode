"""
CertNode Python SDK

Zero-dependency Python SDK for CertNode receipt verification.
Supports ES256 (ECDSA P-256) and EdDSA (Ed25519) algorithms.

Example:
    >>> from certnode import verify_receipt, JWKSManager
    >>>
    >>> receipt = {
    ...     "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
    ...     "payload": {"document": "Hello, World!"},
    ...     "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
    ...     "kid": "test-key"
    ... }
    >>>
    >>> jwks = {
    ...     "keys": [{
    ...         "kty": "EC",
    ...         "crv": "P-256",
    ...         "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
    ...         "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    ...         "kid": "test-key"
    ...     }]
    ... }
    >>>
    >>> result = verify_receipt(receipt, jwks)
    >>> print("Valid!" if result.ok else f"Invalid: {result.reason}")
"""

from .verification import verify_receipt, VerifyResult
from .jwks import JWKSManager
from .exceptions import CertNodeError, VerificationError, JWKSError

__version__ = "1.1.0"
__author__ = "CertNode"
__email__ = "noreply@certnode.io"

__all__ = [
    "verify_receipt",
    "VerifyResult",
    "JWKSManager",
    "CertNodeError",
    "VerificationError",
    "JWKSError",
]