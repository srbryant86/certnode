"""
JWKS management for CertNode SDK.
"""

import json
import time
from typing import Dict, Any, List, Optional, Callable
from urllib.request import urlopen
from urllib.error import URLError

from .exceptions import JWKSError
from .utils import jwk_thumbprint


class JWKSManager:
    """
    Manages JWKS fetching and caching.

    Example:
        >>> manager = JWKSManager(ttl_seconds=300)  # 5 minute cache
        >>> jwks = manager.fetch_from_url("https://api.certnode.io/.well-known/jwks.json")
        >>> thumbprints = manager.thumbprints()
    """

    def __init__(
        self,
        ttl_seconds: int = 300,
        fetcher: Optional[Callable[[str], Dict[str, Any]]] = None
    ):
        """
        Initialize JWKS manager.

        Args:
            ttl_seconds: Cache TTL in seconds (default: 5 minutes)
            fetcher: Custom fetch function (url -> dict)
        """
        self.ttl_seconds = ttl_seconds
        self.fetcher = fetcher or self._default_fetcher
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_time: float = 0

    def fetch_from_url(self, url: str) -> Dict[str, Any]:
        """
        Fetch JWKS from URL with caching.

        Args:
            url: URL to fetch JWKS from

        Returns:
            JWKS dictionary

        Raises:
            JWKSError: If fetch fails or JWKS is invalid
        """
        # Check cache
        current_time = time.time()
        if (self._cache and
            current_time - self._cache_time < self.ttl_seconds):
            return self._cache

        try:
            jwks = self.fetcher(url)
            self.set_from_object(jwks)
            self._cache_time = current_time
            return self._cache

        except Exception as e:
            raise JWKSError(f"Failed to fetch JWKS from {url}: {e}")

    def set_from_object(self, jwks: Dict[str, Any]) -> Dict[str, Any]:
        """
        Set JWKS from object with validation.

        Args:
            jwks: JWKS dictionary

        Returns:
            Validated JWKS

        Raises:
            JWKSError: If JWKS is invalid
        """
        if not isinstance(jwks, dict):
            raise JWKSError("JWKS must be a dictionary")

        if "keys" not in jwks:
            raise JWKSError("JWKS must contain 'keys' field")

        if not isinstance(jwks["keys"], list):
            raise JWKSError("JWKS 'keys' must be a list")

        # Validate each key
        for i, key in enumerate(jwks["keys"]):
            if not isinstance(key, dict):
                raise JWKSError(f"Key {i} must be a dictionary")

            kty = key.get("kty")
            if kty not in ["EC", "OKP"]:
                raise JWKSError(f"Key {i}: Unsupported key type '{kty}'. Use 'EC' or 'OKP'")

            if kty == "EC":
                if key.get("crv") != "P-256":
                    raise JWKSError(f"Key {i}: Only P-256 curve supported for EC keys")
                if not all(field in key for field in ["x", "y"]):
                    raise JWKSError(f"Key {i}: EC key missing x or y coordinate")

            elif kty == "OKP":
                if key.get("crv") != "Ed25519":
                    raise JWKSError(f"Key {i}: Only Ed25519 curve supported for OKP keys")
                if "x" not in key:
                    raise JWKSError(f"Key {i}: OKP key missing x coordinate")

        self._cache = jwks
        return jwks

    def get_fresh(self) -> Optional[Dict[str, Any]]:
        """
        Get cached JWKS if still fresh.

        Returns:
            JWKS dictionary if cache is fresh, None otherwise
        """
        if not self._cache:
            return None

        current_time = time.time()
        if current_time - self._cache_time < self.ttl_seconds:
            return self._cache

        return None

    def thumbprints(self, jwks: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Get thumbprints of all keys in JWKS.

        Args:
            jwks: JWKS to get thumbprints from (uses cached if None)

        Returns:
            List of key thumbprints

        Raises:
            JWKSError: If no JWKS available or thumbprint generation fails
        """
        if jwks is None:
            jwks = self._cache

        if not jwks:
            raise JWKSError("No JWKS available")

        thumbprints = []
        for key in jwks.get("keys", []):
            try:
                thumbprints.append(jwk_thumbprint(key))
            except Exception as e:
                # Skip keys that can't generate thumbprints
                continue

        return thumbprints

    def _default_fetcher(self, url: str) -> Dict[str, Any]:
        """
        Default JWKS fetcher using urllib.

        Args:
            url: URL to fetch from

        Returns:
            JWKS dictionary

        Raises:
            URLError: If fetch fails
            json.JSONDecodeError: If response is not valid JSON
        """
        try:
            with urlopen(url, timeout=30) as response:
                if response.status != 200:
                    raise URLError(f"HTTP {response.status}")

                content = response.read().decode('utf-8')
                return json.loads(content)

        except URLError:
            raise
        except Exception as e:
            raise URLError(f"Failed to fetch JWKS: {e}")


def fetch_jwks(url: str, timeout: int = 30) -> Dict[str, Any]:
    """
    Simple JWKS fetch function.

    Args:
        url: URL to fetch JWKS from
        timeout: Request timeout in seconds

    Returns:
        JWKS dictionary

    Raises:
        JWKSError: If fetch fails

    Example:
        >>> jwks = fetch_jwks("https://api.certnode.io/.well-known/jwks.json")
        >>> print(f"Found {len(jwks['keys'])} keys")
    """
    try:
        with urlopen(url, timeout=timeout) as response:
            if response.status != 200:
                raise JWKSError(f"HTTP {response.status} from {url}")

            content = response.read().decode('utf-8')
            jwks = json.loads(content)

            # Basic validation
            if not isinstance(jwks, dict) or "keys" not in jwks:
                raise JWKSError("Invalid JWKS format")

            return jwks

    except Exception as e:
        if isinstance(e, JWKSError):
            raise
        raise JWKSError(f"Failed to fetch JWKS from {url}: {e}")