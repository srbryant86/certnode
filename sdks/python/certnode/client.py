"""CertNode Python SDK client implementation."""

import base64
import time
from typing import Dict, List, Optional, Union
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .types import (
    ContentCertificationRequest,
    CertificationResponse,
    VerificationResponse,
    RateLimitInfo,
    UsageStats,
)


class CertNodeError(Exception):
    """Exception raised for CertNode API errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 0,
        error_code: str = "UNKNOWN_ERROR",
        rate_limit_info: Optional[RateLimitInfo] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.rate_limit_info = rate_limit_info

    def __str__(self) -> str:
        return f"CertNodeError({self.status_code}): {self.message}"


class CertNodeClient:
    """Official Python client for the CertNode Content Authenticity API."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://certnode.io/api/v1",
        timeout: int = 30,
        retries: int = 3,
    ):
        """
        Initialize the CertNode client.

        Args:
            api_key: Your CertNode API key
            base_url: API base URL (default: https://certnode.io/api/v1)
            timeout: Request timeout in seconds (default: 30)
            retries: Number of retry attempts for rate limiting (default: 3)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.retries = retries

        # Configure session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=1,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set default headers
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": f"certnode-python/2.0.0 (Python)",
        })

    def certify_content(self, request: ContentCertificationRequest) -> CertificationResponse:
        """
        Certify content and receive AI detection analysis.

        Args:
            request: Content certification request

        Returns:
            CertificationResponse with receipt and AI detection results

        Raises:
            CertNodeError: If the API request fails
        """
        # Convert content to base64
        if isinstance(request.content, str):
            content_base64 = base64.b64encode(request.content.encode()).decode()
        else:
            content_base64 = base64.b64encode(request.content).decode()

        payload = {
            "contentBase64": content_base64,
            "contentType": request.content_type,
            "metadata": request.metadata,
            "provenance": request.provenance,
        }

        return self._make_request("POST", "/receipts/content", payload)

    def verify_content(self, receipt_id: str) -> VerificationResponse:
        """
        Verify a content receipt.

        Args:
            receipt_id: The receipt ID to verify

        Returns:
            VerificationResponse with validation status

        Raises:
            CertNodeError: If the API request fails
        """
        return self._make_request("GET", f"/verify/content/{receipt_id}")

    def certify_batch(
        self, requests_list: List[ContentCertificationRequest]
    ) -> List[CertificationResponse]:
        """
        Batch certify multiple content items.

        Args:
            requests_list: List of content certification requests (max 100)

        Returns:
            List of CertificationResponse objects

        Raises:
            CertNodeError: If the API request fails or batch size exceeds limit
        """
        if len(requests_list) > 100:
            raise CertNodeError(
                "Batch size cannot exceed 100 items",
                status_code=400,
                error_code="BATCH_SIZE_EXCEEDED",
            )

        items = []
        for req in requests_list:
            if isinstance(req.content, str):
                content_base64 = base64.b64encode(req.content.encode()).decode()
            else:
                content_base64 = base64.b64encode(req.content).decode()

            items.append({
                "contentBase64": content_base64,
                "contentType": req.content_type,
                "metadata": req.metadata,
                "provenance": req.provenance,
            })

        payload = {"items": items}
        response = self._make_request("POST", "/receipts/content/batch", payload)
        return response["results"]

    def get_usage_stats(self) -> UsageStats:
        """
        Get API usage statistics.

        Returns:
            UsageStats with current usage information

        Raises:
            CertNodeError: If the API request fails
        """
        return self._make_request("GET", "/usage")

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        attempt: int = 1,
    ) -> Dict:
        """Make an HTTP request with retry logic."""
        url = f"{self.base_url}{endpoint}"

        try:
            if method == "GET":
                response = self.session.get(url, timeout=self.timeout)
            elif method == "POST":
                response = self.session.post(url, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            # Extract rate limit info
            rate_limit_info = self._extract_rate_limit_info(response)

            # Handle rate limiting
            if response.status_code == 429 and attempt <= self.retries:
                wait_time = (
                    rate_limit_info.get("retry_after", 2**attempt)
                    if rate_limit_info
                    else 2**attempt
                )
                time.sleep(wait_time)
                return self._make_request(method, endpoint, data, attempt + 1)

            # Handle other errors
            if not response.ok:
                error_data = response.json() if response.content else {}
                raise CertNodeError(
                    error_data.get("error", "API request failed"),
                    status_code=response.status_code,
                    error_code=error_data.get("code", "UNKNOWN_ERROR"),
                    rate_limit_info=rate_limit_info,
                )

            return response.json()

        except requests.exceptions.RequestException as e:
            raise CertNodeError(f"Network error: {str(e)}", error_code="NETWORK_ERROR")

    def _extract_rate_limit_info(self, response: requests.Response) -> Optional[RateLimitInfo]:
        """Extract rate limit information from response headers."""
        headers = response.headers
        limit = headers.get("X-RateLimit-Limit")
        remaining = headers.get("X-RateLimit-Remaining")
        reset = headers.get("X-RateLimit-Reset")
        retry_after = headers.get("Retry-After")

        if limit and remaining and reset:
            return RateLimitInfo(
                limit=int(limit),
                remaining=int(remaining),
                reset=int(reset),
                retry_after=int(retry_after) if retry_after else None,
            )

        return None


def create_client(api_key: str, **kwargs) -> CertNodeClient:
    """
    Convenience function to create a CertNode client.

    Args:
        api_key: Your CertNode API key
        **kwargs: Additional client options

    Returns:
        Configured CertNodeClient instance
    """
    return CertNodeClient(api_key, **kwargs)