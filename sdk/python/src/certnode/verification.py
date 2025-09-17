"""
CertNode receipt verification implementation.
"""

import json
import base64
import hashlib
from typing import Dict, Any, Union, Optional
from dataclasses import dataclass

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, ed25519
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature, decode_dss_signature
from cryptography.exceptions import InvalidSignature

from .exceptions import VerificationError
from .utils import canonicalize_json, b64u_decode, b64u_encode, jwk_thumbprint


@dataclass
class VerifyResult:
    """Result of receipt verification."""
    ok: bool
    reason: Optional[str] = None


def verify_receipt(
    receipt: Union[Dict[str, Any], str],
    jwks: Dict[str, Any]
) -> VerifyResult:
    """
    Verify a CertNode receipt using a JWKS object.

    Args:
        receipt: The receipt to verify (dict or JSON string)
        jwks: The JWKS containing public keys

    Returns:
        VerifyResult with ok=True if valid, ok=False with reason if invalid

    Example:
        >>> receipt = {
        ...     "protected": "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5In0",
        ...     "payload": {"document": "Hello, World!"},
        ...     "signature": "MEQCIAH8B3K2l1D0F9X7Zz8Q2P5M6N7R3S4T5U6V7W8X9Y0Z...",
        ...     "kid": "test-key"
        ... }
        >>> jwks = {"keys": [...]}
        >>> result = verify_receipt(receipt, jwks)
        >>> print(result.ok)
        True
    """
    try:
        # Parse receipt if string
        if isinstance(receipt, str):
            receipt = json.loads(receipt)

        # Validate receipt structure
        required_fields = ["protected", "signature", "payload", "kid"]
        for field in required_fields:
            if field not in receipt:
                return VerifyResult(False, f"Missing required field: {field}")

        # Decode protected header
        try:
            protected_bytes = b64u_decode(receipt["protected"])
            header = json.loads(protected_bytes.decode('utf-8'))
        except Exception as e:
            return VerifyResult(False, f"Invalid protected header: {e}")

        # Validate algorithm
        algorithm = header.get("alg")
        if algorithm not in ["ES256", "EdDSA"]:
            return VerifyResult(False, f"Unsupported algorithm: {algorithm}. Use ES256 or EdDSA.")

        # Validate kid consistency
        if header.get("kid") != receipt["kid"]:
            return VerifyResult(False, "Kid mismatch between header and receipt")

        # Find matching key in JWKS
        key = None
        for k in jwks.get("keys", []):
            try:
                # Try matching by RFC7638 thumbprint
                thumbprint = jwk_thumbprint(k)
                if thumbprint == receipt["kid"]:
                    key = k
                    break
            except Exception:
                # Try matching by kid field
                if k.get("kid") == receipt["kid"]:
                    key = k
                    break

        if not key:
            return VerifyResult(False, f"Key not found in JWKS: {receipt['kid']}")

        # Validate JCS hash if present
        if "payload_jcs_sha256" in receipt:
            jcs_bytes = canonicalize_json(receipt["payload"])
            jcs_hash = hashlib.sha256(jcs_bytes).digest()
            expected_hash = b64u_decode(receipt["payload_jcs_sha256"])

            if jcs_hash != expected_hash:
                return VerifyResult(False, "JCS hash mismatch")

        # Create signing input (protected + '.' + JCS(payload))
        payload_b64u = b64u_encode(canonicalize_json(receipt["payload"]))
        signing_input = f"{receipt['protected']}.{payload_b64u}"
        signing_data = signing_input.encode('utf-8')

        # Verify signature based on algorithm
        try:
            signature_bytes = b64u_decode(receipt["signature"])

            if algorithm == "ES256":
                is_valid = _verify_es256(key, signing_data, signature_bytes)
            elif algorithm == "EdDSA":
                is_valid = _verify_eddsa(key, signing_data, signature_bytes)
            else:
                return VerifyResult(False, f"Unsupported algorithm: {algorithm}")

        except Exception as e:
            return VerifyResult(False, f"Signature verification failed: {e}")

        if not is_valid:
            return VerifyResult(False, "Invalid signature")

        # Optional receipt_id check if present
        if "receipt_id" in receipt:
            full_receipt = f"{receipt['protected']}.{payload_b64u}.{receipt['signature']}"
            computed_hash = hashlib.sha256(full_receipt.encode('utf-8')).digest()
            computed_id = b64u_encode(computed_hash)

            if computed_id != receipt["receipt_id"]:
                return VerifyResult(False, "Receipt ID mismatch")

        return VerifyResult(True)

    except Exception as e:
        return VerifyResult(False, f"Verification failed: {e}")


def _verify_es256(jwk: Dict[str, Any], signing_data: bytes, signature_bytes: bytes) -> bool:
    """Verify ES256 signature using ECDSA P-256."""
    if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
        raise VerificationError("ES256 requires EC P-256 key")

    if not all(field in jwk for field in ["x", "y"]):
        raise VerificationError("Invalid P-256 JWK: missing x or y coordinate")

    # Convert JWK to public key
    try:
        x_bytes = b64u_decode(jwk["x"])
        y_bytes = b64u_decode(jwk["y"])

        if len(x_bytes) != 32 or len(y_bytes) != 32:
            raise VerificationError("Invalid coordinate length for P-256")

        # Create uncompressed point (0x04 + x + y)
        uncompressed_point = b'\x04' + x_bytes + y_bytes

        public_key = ec.EllipticCurvePublicKey.from_encoded_point(
            ec.SECP256R1(), uncompressed_point
        )

    except Exception as e:
        raise VerificationError(f"Failed to construct P-256 public key: {e}")

    # Convert JOSE signature to DER format
    if len(signature_bytes) != 64:
        raise VerificationError("ES256 signature must be 64 bytes")

    try:
        # JOSE format: r (32 bytes) + s (32 bytes)
        r = int.from_bytes(signature_bytes[:32], 'big')
        s = int.from_bytes(signature_bytes[32:], 'big')

        # Convert to DER format
        der_signature = encode_dss_signature(r, s)

        # Verify signature
        public_key.verify(der_signature, signing_data, ec.ECDSA(hashes.SHA256()))
        return True

    except InvalidSignature:
        return False
    except Exception as e:
        raise VerificationError(f"ES256 verification failed: {e}")


def _verify_eddsa(jwk: Dict[str, Any], signing_data: bytes, signature_bytes: bytes) -> bool:
    """Verify EdDSA signature using Ed25519."""
    if jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
        raise VerificationError("EdDSA requires OKP Ed25519 key")

    if "x" not in jwk:
        raise VerificationError("Invalid Ed25519 JWK: missing x coordinate")

    # Convert JWK to public key
    try:
        public_key_bytes = b64u_decode(jwk["x"])

        if len(public_key_bytes) != 32:
            raise VerificationError("Invalid public key length for Ed25519")

        public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)

    except Exception as e:
        raise VerificationError(f"Failed to construct Ed25519 public key: {e}")

    # Verify signature (Ed25519 uses raw signature format)
    try:
        public_key.verify(signature_bytes, signing_data)
        return True

    except InvalidSignature:
        return False
    except Exception as e:
        raise VerificationError(f"EdDSA verification failed: {e}")