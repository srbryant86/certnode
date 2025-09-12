# Security Policy

This document outlines our security posture and how to report vulnerabilities.

## Overview
- Minimal attack surface: ES256 (P‑256) only, zero‑dependency SDKs
- No payload logging: logs contain hashes and correlation IDs only
- Error responses sanitized in production; request correlation via `X-Request-Id`
- Rate limiting and input validation enforced on `/v1/sign`
- JWKS served statically (S3+CDN recommended); service never exposes private keys

## Supported Versions
- Main branch is supported; releases are patched as needed. Use the latest SDKs.

## Reporting a Vulnerability
- Please open a private issue or email security contact (owner/maintainer) with details and reproduction steps.
- We will acknowledge within 3 business days and coordinate disclosure if applicable.

## Cryptography
- Signing: AWS KMS RAW `ECDSA_SHA_256` (ES256)
- Canonicalization: RFC 8785 (JCS) prior to signing and verification
- Key identifiers: RFC 7638 JWK thumbprints
- Signatures: DER↔JOSE conversions where applicable

## Transport & Headers
- HSTS (in production and HTTPS): `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- CORS allowlist with strict preflight handling
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`

## Logging & Privacy
- No payload content is logged. Only hashes and correlation IDs are emitted.
- Errors are categorized; production responses omit sensitive details.

## Rate Limiting & Validation
- Per‑IP token‑bucket on `/v1/sign` with configurable thresholds
- Strict JSON schema validation; size warnings and hard limits

## Key Management
- JWKS integrity validated with tooling (see `docs/ROTATION.md`)
- Rotation validation requires overlapping keys to avoid verification failures
