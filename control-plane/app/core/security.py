import hmac
import hashlib
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def verify_github_hmac_signature(
    raw_body: bytes,
    secret: str,
    signature_header: Optional[str]
) -> bool:
    """
    Verifies GitHub Webhook HMAC SHA-256 Signature (X-Hub-Signature-256).
    Header format: sha256=<hex_digest>
    """
    if not secret:
        # If secret is not configured, skip verification with warning
        logger.warning("WEBHOOK_SECRET is not set. Skipping HMAC signature verification.")
        return True

    if not signature_header:
        logger.error("Missing X-Hub-Signature-256 header in webhook request.")
        return False

    if not signature_header.startswith("sha256="):
        logger.error("Invalid X-Hub-Signature-256 header format. Expected 'sha256=' prefix.")
        return False

    provided_signature = signature_header.split("sha256=", 1)[1]

    # Calculate expected HMAC-SHA256 signature
    mac = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    )
    expected_signature = mac.hexdigest()

    # Constant-time comparison to prevent timing attacks
    is_valid = hmac.compare_digest(expected_signature, provided_signature)
    if not is_valid:
        logger.error("HMAC signature verification failed. Possible webhook spoofing attempt!")

    return is_valid
