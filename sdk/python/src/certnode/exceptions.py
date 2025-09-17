"""
Exceptions for CertNode SDK.
"""


class CertNodeError(Exception):
    """Base exception for CertNode SDK."""
    pass


class VerificationError(CertNodeError):
    """Exception raised during receipt verification."""
    pass


class JWKSError(CertNodeError):
    """Exception raised during JWKS operations."""
    pass