"""
Utility functions for CertNode SDK.
"""

import json
import base64
import hashlib
from typing import Any, Dict


def canonicalize_json(obj: Any) -> bytes:
    """
    Canonicalize JSON according to RFC 8785 (JCS).

    Args:
        obj: The object to canonicalize

    Returns:
        Canonical JSON representation as bytes
    """
    return _stringify_canonical(obj).encode('utf-8')


def _stringify_canonical(value: Any) -> str:
    """Stringify value in canonical form."""
    if value is None:
        return "null"
    elif isinstance(value, bool):
        return "true" if value else "false"
    elif isinstance(value, (int, float)):
        # Handle numbers (including scientific notation)
        if isinstance(value, float) and (value != value):  # NaN check
            raise ValueError("NaN is not allowed in JSON")
        if isinstance(value, float) and abs(value) == float('inf'):
            raise ValueError("Infinity is not allowed in JSON")
        return json.dumps(value, separators=(',', ':'))
    elif isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    elif isinstance(value, list):
        items = [_stringify_canonical(v) for v in value]
        return '[' + ','.join(items) + ']'
    elif isinstance(value, dict):
        # Sort keys and filter out undefined values
        keys = sorted(value.keys())
        parts = []
        for k in keys:
            v = value[k]
            if v is not None:  # Skip undefined/null values at top level
                parts.append(json.dumps(k, ensure_ascii=False, separators=(',', ':')) +
                           ':' + _stringify_canonical(v))
        return '{' + ','.join(parts) + '}'
    else:
        # Fallback to regular JSON for other types
        return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def b64u_encode(data: bytes) -> str:
    """
    Base64url encode data.

    Args:
        data: Bytes to encode

    Returns:
        Base64url encoded string
    """
    return base64.urlsafe_b64encode(data).decode('ascii').rstrip('=')


def b64u_decode(data: str) -> bytes:
    """
    Base64url decode data.

    Args:
        data: Base64url encoded string

    Returns:
        Decoded bytes
    """
    # Add padding if needed
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding

    return base64.urlsafe_b64decode(data)


def jwk_thumbprint(jwk: Dict[str, Any]) -> str:
    """
    Generate JWK thumbprint according to RFC 7638.

    Args:
        jwk: JSON Web Key

    Returns:
        Base64url encoded SHA-256 thumbprint

    Raises:
        ValueError: If JWK type is not supported
    """
    if jwk.get("kty") == "EC" and jwk.get("crv") == "P-256":
        if not all(field in jwk for field in ["x", "y"]):
            raise ValueError("Invalid EC P-256 JWK: missing x or y")

        # Canonical representation for EC P-256
        canonical = {
            "crv": jwk["crv"],
            "kty": jwk["kty"],
            "x": jwk["x"],
            "y": jwk["y"]
        }

    elif jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519":
        if "x" not in jwk:
            raise ValueError("Invalid Ed25519 JWK: missing x")

        # Canonical representation for Ed25519
        canonical = {
            "crv": jwk["crv"],
            "kty": jwk["kty"],
            "x": jwk["x"]
        }

    else:
        raise ValueError("Only EC P-256 and OKP Ed25519 JWK supported for thumbprint")

    # Create canonical JSON and hash
    canonical_json = json.dumps(canonical, separators=(',', ':'), sort_keys=True)
    hash_bytes = hashlib.sha256(canonical_json.encode('utf-8')).digest()

    return b64u_encode(hash_bytes)