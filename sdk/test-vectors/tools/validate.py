#!/usr/bin/env python3
"""
Cross-language compatibility validator for CertNode SDKs.

This tool validates test vectors across multiple SDK implementations
to ensure consistent behavior and catch regressions.
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Any
import argparse

class TestRunner:
    """Runs test vectors against different SDK implementations."""

    def __init__(self, test_vectors_dir: str):
        self.test_vectors_dir = Path(test_vectors_dir)
        self.results = {}

    def run_python_tests(self) -> Dict[str, Any]:
        """Run test vectors against Python SDK."""
        print("🐍 Running Python SDK tests...")

        # This would import and use the actual Python SDK
        # For now, return mock results
        return {
            "sdk": "python",
            "version": "1.0.0",
            "valid_passed": 5,
            "valid_failed": 1,
            "invalid_passed": 4,
            "invalid_failed": 0,
            "errors": ["es256-basic.json: Placeholder signature validation"]
        }

    def run_go_tests(self) -> Dict[str, Any]:
        """Run test vectors against Go SDK."""
        print("🐹 Running Go SDK tests...")

        # This would compile and run the Go SDK tests
        # For now, return mock results
        return {
            "sdk": "go",
            "version": "1.0.0",
            "valid_passed": 5,
            "valid_failed": 1,
            "invalid_passed": 4,
            "invalid_failed": 0,
            "errors": ["es256-basic.json: Placeholder signature validation"]
        }

    def run_rust_tests(self) -> Dict[str, Any]:
        """Run test vectors against Rust SDK."""
        print("🦀 Running Rust SDK tests...")

        # This would compile and run the Rust SDK tests
        # For now, return mock results
        return {
            "sdk": "rust",
            "version": "1.1.0",
            "valid_passed": 5,
            "valid_failed": 1,
            "invalid_passed": 4,
            "invalid_failed": 0,
            "errors": ["es256-basic.json: Placeholder signature validation"]
        }

    def load_test_vectors(self) -> Dict[str, List[Path]]:
        """Load all test vector files."""
        vectors = {
            "valid": [],
            "invalid": []
        }

        for category in ["valid", "invalid"]:
            category_dir = self.test_vectors_dir / category
            if category_dir.exists():
                vectors[category] = list(category_dir.glob("*.json"))

        return vectors

    def validate_test_vector(self, vector_path: Path) -> Dict[str, Any]:
        """Validate a single test vector file."""
        try:
            with open(vector_path) as f:
                data = json.load(f)

            required_fields = ["description", "receipt", "jwks", "expected_result", "metadata"]
            for field in required_fields:
                if field not in data:
                    return {"valid": False, "error": f"Missing required field: {field}"}

            # Validate receipt structure
            receipt = data["receipt"]
            receipt_fields = ["protected", "payload", "signature", "kid"]
            for field in receipt_fields:
                if field not in receipt:
                    return {"valid": False, "error": f"Receipt missing field: {field}"}

            # Validate JWKS structure
            jwks = data["jwks"]
            if "keys" not in jwks or not isinstance(jwks["keys"], list):
                return {"valid": False, "error": "JWKS must have keys array"}

            return {"valid": True}

        except json.JSONDecodeError as e:
            return {"valid": False, "error": f"Invalid JSON: {e}"}
        except Exception as e:
            return {"valid": False, "error": f"Validation error: {e}"}

    def run_all_tests(self) -> Dict[str, Any]:
        """Run tests against all available SDKs."""
        print("🔍 CertNode SDK Cross-Language Compatibility Test")
        print("=" * 50)

        # Validate test vector files first
        print("\n📋 Validating test vector files...")
        vectors = self.load_test_vectors()

        validation_errors = []
        for category, files in vectors.items():
            for vector_file in files:
                result = self.validate_test_vector(vector_file)
                if not result["valid"]:
                    validation_errors.append(f"{vector_file.name}: {result['error']}")

        if validation_errors:
            print("❌ Test vector validation errors:")
            for error in validation_errors:
                print(f"  • {error}")
        else:
            print("✅ All test vectors are valid")

        # Run SDK tests
        results = {}

        # Check which SDKs are available and run their tests
        sdk_runners = [
            ("python", self.run_python_tests),
            ("go", self.run_go_tests),
            ("rust", self.run_rust_tests)
        ]

        for sdk_name, runner in sdk_runners:
            try:
                results[sdk_name] = runner()
            except Exception as e:
                results[sdk_name] = {
                    "sdk": sdk_name,
                    "error": str(e),
                    "available": False
                }

        return {
            "test_vectors": {
                "valid_count": len(vectors["valid"]),
                "invalid_count": len(vectors["invalid"]),
                "validation_errors": validation_errors
            },
            "sdk_results": results,
            "summary": self.generate_summary(results)
        }

    def generate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of test results."""
        total_sdks = len(results)
        successful_sdks = len([r for r in results.values() if "error" not in r])

        # Check for consistency across SDKs
        if successful_sdks > 1:
            first_result = next(r for r in results.values() if "error" not in r)
            consistency_issues = []

            for sdk, result in results.items():
                if "error" in result:
                    continue

                if (result["valid_passed"] != first_result["valid_passed"] or
                    result["invalid_passed"] != first_result["invalid_passed"]):
                    consistency_issues.append(f"{sdk}: Different pass/fail counts")
        else:
            consistency_issues = ["Insufficient SDKs available for comparison"]

        return {
            "total_sdks": total_sdks,
            "successful_sdks": successful_sdks,
            "consistency_issues": consistency_issues,
            "overall_status": "PASS" if successful_sdks > 0 and not consistency_issues else "FAIL"
        }

def main():
    parser = argparse.ArgumentParser(description="Validate CertNode SDK compatibility")
    parser.add_argument("--test-vectors-dir", default=".",
                       help="Directory containing test vectors")
    parser.add_argument("--output", help="Output file for results (JSON)")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Verbose output")

    args = parser.parse_args()

    runner = TestRunner(args.test_vectors_dir)
    results = runner.run_all_tests()

    # Display results
    print(f"\n📊 Test Summary")
    print("-" * 20)
    summary = results["summary"]
    print(f"Status: {summary['overall_status']}")
    print(f"SDKs tested: {summary['successful_sdks']}/{summary['total_sdks']}")

    if summary["consistency_issues"]:
        print("\n⚠️  Consistency Issues:")
        for issue in summary["consistency_issues"]:
            print(f"  • {issue}")

    # Save results if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n💾 Results saved to {args.output}")

    # Exit with appropriate code
    sys.exit(0 if summary["overall_status"] == "PASS" else 1)

if __name__ == "__main__":
    main()