#!/usr/bin/env python3
"""
CertNode Python CLI tool.
"""

import sys
import json
import argparse
from typing import Dict, Any, List

from . import verify_receipt, JWKSManager, __version__
from .exceptions import CertNodeError


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="certnode-py",
        description="CertNode Python SDK CLI tool"
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"certnode-py {__version__}"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify a receipt")
    verify_parser.add_argument(
        "-r", "--receipt",
        required=True,
        help="Receipt file (JSON) or JSON string"
    )
    verify_parser.add_argument(
        "-k", "--jwks",
        required=True,
        help="JWKS file or URL"
    )
    verify_parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output"
    )

    # Inspect command
    inspect_parser = subparsers.add_parser("inspect", help="Inspect a receipt or JWKS")
    inspect_parser.add_argument("file", help="File to inspect")
    inspect_parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="table",
        help="Output format"
    )

    # Thumbprint command
    thumbprint_parser = subparsers.add_parser("thumbprint", help="Generate key thumbprints")
    thumbprint_parser.add_argument("jwks", help="JWKS file or URL")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        if args.command == "verify":
            cmd_verify(args)
        elif args.command == "inspect":
            cmd_inspect(args)
        elif args.command == "thumbprint":
            cmd_thumbprint(args)
    except CertNodeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nInterrupted", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_verify(args) -> None:
    """Handle verify command."""
    # Load receipt
    receipt = load_json_input(args.receipt)

    # Load JWKS
    jwks = load_jwks(args.jwks)

    if args.verbose:
        print(f"Verifying receipt with kid: {receipt.get('kid')}")
        print(f"JWKS contains {len(jwks.get('keys', []))} key(s)")

    # Verify
    result = verify_receipt(receipt, jwks)

    if result.ok:
        print("✅ Receipt verification: VALID")
        if args.verbose:
            print(f"Kid: {receipt.get('kid')}")
            if "receipt_id" in receipt:
                print(f"Receipt ID: {receipt['receipt_id']}")
        sys.exit(0)
    else:
        print("❌ Receipt verification: INVALID")
        print(f"Reason: {result.reason}")
        sys.exit(1)


def cmd_inspect(args) -> None:
    """Handle inspect command."""
    data = load_json_input(args.file)

    if "keys" in data:
        # JWKS file
        inspect_jwks(data, args.format)
    elif "protected" in data and "signature" in data:
        # Receipt file
        inspect_receipt(data, args.format)
    else:
        print("Unknown file format")
        sys.exit(1)


def cmd_thumbprint(args) -> None:
    """Handle thumbprint command."""
    jwks = load_jwks(args.jwks)
    manager = JWKSManager()
    thumbprints = manager.thumbprints(jwks)

    print(f"JWKS contains {len(thumbprints)} key(s):")
    for i, thumbprint in enumerate(thumbprints, 1):
        print(f"  {i}. {thumbprint}")


def load_json_input(input_str: str) -> Dict[str, Any]:
    """Load JSON from file or string."""
    # Try as file first
    try:
        with open(input_str, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    # Try as JSON string
    try:
        return json.loads(input_str)
    except json.JSONDecodeError:
        pass

    raise CertNodeError(f"Could not load JSON from: {input_str}")


def load_jwks(input_str: str) -> Dict[str, Any]:
    """Load JWKS from file or URL."""
    # Try as URL first
    if input_str.startswith(('http://', 'https://')):
        try:
            from .jwks import fetch_jwks
            return fetch_jwks(input_str)
        except Exception as e:
            raise CertNodeError(f"Failed to fetch JWKS from URL: {e}")

    # Try as file
    return load_json_input(input_str)


def inspect_jwks(jwks: Dict[str, Any], format_type: str) -> None:
    """Inspect JWKS data."""
    if format_type == "json":
        print(json.dumps(jwks, indent=2))
        return

    keys = jwks.get("keys", [])
    print(f"JWKS file with {len(keys)} key(s):")

    for i, key in enumerate(keys, 1):
        kty = key.get("kty", "unknown")
        crv = key.get("crv", "unknown")
        kid = key.get("kid", "none")
        alg = key.get("alg", "none")

        print(f"  Key {i}: {kty} {crv} (kid: {kid}, alg: {alg})")


def inspect_receipt(receipt: Dict[str, Any], format_type: str) -> None:
    """Inspect receipt data."""
    if format_type == "json":
        print(json.dumps(receipt, indent=2))
        return

    # Decode header to get algorithm
    try:
        import base64
        protected_bytes = base64.urlsafe_b64decode(
            receipt["protected"] + "=" * (4 - len(receipt["protected"]) % 4)
        )
        header = json.loads(protected_bytes.decode('utf-8'))
        algorithm = header.get("alg", "unknown")
    except Exception:
        algorithm = "unknown"

    print(f"Receipt ({algorithm}):")
    print(f"  Kid: {receipt.get('kid')}")
    print(f"  Algorithm: {algorithm}")

    if "payload_jcs_sha256" in receipt:
        jcs_hash = receipt["payload_jcs_sha256"]
        print(f"  JCS Hash: {jcs_hash[:16]}...")

    if "receipt_id" in receipt:
        receipt_id = receipt["receipt_id"]
        print(f"  Receipt ID: {receipt_id[:16]}...")

    print(f"  Payload: {json.dumps(receipt.get('payload', {}))}")


if __name__ == "__main__":
    main()