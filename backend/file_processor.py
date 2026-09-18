"""
File processing module for extracting text from PDFs and images.

- PDF: Uses PyMuPDF (fitz) for text extraction.
- Images: Uses Groq Vision API (qwen/qwen3.8-27b) for OCR / content extraction.
"""

import os
import io
import base64
import re
from typing import Tuple, Dict, Any

import pymupdf as fitz  # PyMuPDF
from PIL import Image
from groq import Groq
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"}
ALLOWED_PDF_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_DIMENSION = 2048  # max width/height before resize


def validate_file(filename: str, file_size: int) -> Tuple[str, str]:
    """
    Validate filename and size.
    Returns (file_type, extension) or raises ValueError.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext in ALLOWED_IMAGE_EXTENSIONS:
        file_type = "image"
    elif ext in ALLOWED_PDF_EXTENSIONS:
        file_type = "pdf"
    else:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS | ALLOWED_PDF_EXTENSIONS))
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed: {allowed}"
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
        raise ValueError(
            f"File too large ({file_size / (1024 * 1024):.1f} MB). "
            f"Maximum allowed: {max_mb:.0f} MB."
        )

    return file_type, ext


def _compress_image(image_bytes: bytes, ext: str) -> str:
    """
    Resize image if too large and return a base64-encoded JPEG string
    suitable for the vision API.
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Convert palette / RGBA to RGB for JPEG encoding
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")

    # Resize if either dimension exceeds limit
    w, h = img.size
    if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
        ratio = min(MAX_IMAGE_DIMENSION / w, MAX_IMAGE_DIMENSION / h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def extract_from_image(image_bytes: bytes, ext: str) -> str:
    """
    Send an image to Groq Vision API and extract all readable text / data.
    """
    b64 = _compress_image(image_bytes, ext)

    response = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract ALL text, data, tables, and information "
                            "visible in this image. Preserve the original "
                            "structure as closely as possible. If there are "
                            "tables, format them clearly. If there are charts "
                            "or graphs, describe the data they represent. "
                            "Return only the extracted content, no commentary."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}",
                        },
                    },
                ],
            }
        ],
        temperature=0.1,
        max_tokens=4096,
    )

    return response.choices[0].message.content.strip()


def extract_from_pdf(pdf_bytes: bytes) -> Tuple[str, int]:
    """
    Extract text from every page of a PDF using PyMuPDF.
    Falls back to image-based extraction for pages with no selectable text.
    Returns (extracted_text, page_count).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = len(doc)
    pages_text = []

    for page_num in range(page_count):
        page = doc[page_num]
        text = page.get_text("text").strip()

        if text:
            pages_text.append(f"--- Page {page_num + 1} ---\n{text}")
        else:
            # Scanned / image-only page – render to image and use vision API
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            try:
                extracted = extract_from_image(img_bytes, ".png")
                pages_text.append(
                    f"--- Page {page_num + 1} (scanned) ---\n{extracted}"
                )
            except Exception:
                pages_text.append(
                    f"--- Page {page_num + 1} ---\n[Could not extract text from this page]"
                )

    doc.close()
    return "\n\n".join(pages_text), page_count


def process_file(filename: str, file_bytes: bytes) -> dict:
    """
    Main entry point.  Validates, detects type, extracts content.
    Returns dict with file_type, page_count, extracted_text.
    """
    file_type, ext = validate_file(filename, len(file_bytes))

    if file_type == "pdf":
        extracted_text, page_count = extract_from_pdf(file_bytes)
    else:
        extracted_text = extract_from_image(file_bytes, ext)
        page_count = 1

    return {
        "file_type": file_type,
        "filename": filename,
        "file_size": len(file_bytes),
        "page_count": page_count,
        "extracted_text": extracted_text,
    }


def sanitize_sensitive_data(text: str) -> Dict[str, Any]:
    """
    Sanitize sensitive operational data, credentials, and PII from input text:
    - Internal network IPs (10.x.x.x, 192.168.x.x, 172.16-31.x.x, 127.x.x.x)
    - Passwords, secrets, and auth tokens (Bearer tokens, API keys, password fields)
    - Personal email addresses
    - Phone numbers
    
    Returns a dict with:
      - sanitized_text: text with sensitive tokens replaced
      - redactions_count: total number of redacted items
      - redacted_types: list of categories that had redactions
      - details: summary list of redactions performed
    """
    if not text:
        return {
            "sanitized_text": text,
            "redactions_count": 0,
            "redacted_types": [],
            "details": [],
        }

    sanitized = text
    redactions_count = 0
    redacted_types = set()
    details = []

    # 1. Bearer tokens & Authorization headers
    bearer_pattern = r"(?i)(Authorization\s*:\s*Bearer\s+|Bearer\s+)([A-Za-z0-9\-\._~\+\/]+=*)"
    def redact_bearer(m):
        nonlocal redactions_count
        redactions_count += 1
        redacted_types.add("Auth Token")
        details.append({"type": "Auth Token", "label": "Bearer Token Redacted"})
        return f"{m.group(1)}[REDACTED_AUTH_TOKEN]"
    sanitized = re.sub(bearer_pattern, redact_bearer, sanitized)

    # 2. Key/Value credentials (password=xyz, api_key="xyz", secret: xyz)
    cred_pattern = r"(?i)\b(password|passwd|pwd|secret|api_key|apikey|private_key|token|access_key)\b(\s*[:=]\s*['\"]?)([^\s,'\"\r\n]{4,})(['\"]?)"
    def redact_cred(m):
        nonlocal redactions_count
        redactions_count += 1
        redacted_types.add("Credentials/Keys")
        details.append({"type": "Credentials/Keys", "label": f"{m.group(1)}=[REDACTED]"})
        return f"{m.group(1)}{m.group(2)}[REDACTED_CREDENTIAL]{m.group(4)}"
    sanitized = re.sub(cred_pattern, redact_cred, sanitized)

    # 3. Known API token formats (e.g. ghp_..., AKIA..., JWT)
    token_patterns = [
        (r"\bghp_[A-Za-z0-9]{20,}\b", "GitHub Token", "[REDACTED_GITHUB_TOKEN]"),
        (r"\bAKIA[0-9A-Z]{16}\b", "AWS Access Key", "[REDACTED_AWS_KEY]"),
        (r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b", "JWT Token", "[REDACTED_JWT_TOKEN]")
    ]
    for pattern, name, replacement in token_patterns:
        matches = list(re.finditer(pattern, sanitized))
        if matches:
            redactions_count += len(matches)
            redacted_types.add("Credentials/Keys")
            details.append({"type": "Credentials/Keys", "label": f"{name} Redacted ({len(matches)})"})
            sanitized = re.sub(pattern, replacement, sanitized)

    # 4. Internal IPv4 addresses (RFC 1918 & loopback)
    internal_ip_pattern = r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3})\b"
    ip_matches = list(re.finditer(internal_ip_pattern, sanitized))
    if ip_matches:
        redactions_count += len(ip_matches)
        redacted_types.add("Internal Network IP")
        details.append({"type": "Internal Network IP", "label": f"Internal IPs Redacted ({len(ip_matches)})"})
        sanitized = re.sub(internal_ip_pattern, "[REDACTED_INTERNAL_IP]", sanitized)

    # 5. Personal Email addresses
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    email_matches = list(re.finditer(email_pattern, sanitized))
    if email_matches:
        redactions_count += len(email_matches)
        redacted_types.add("Personal PII (Email)")
        details.append({"type": "Personal PII (Email)", "label": f"Email Addresses Redacted ({len(email_matches)})"})
        sanitized = re.sub(email_pattern, "[REDACTED_EMAIL]", sanitized)

    # 6. Phone numbers
    phone_pattern = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    phone_matches = list(re.finditer(phone_pattern, sanitized))
    actual_phone_matches = [m for m in phone_matches if len(re.sub(r"\D", "", m.group(0))) >= 10]
    if actual_phone_matches:
        for m in actual_phone_matches:
            redactions_count += 1
            sanitized = sanitized.replace(m.group(0), "[REDACTED_PHONE]")
        redacted_types.add("Personal PII (Phone)")
        details.append({"type": "Personal PII (Phone)", "label": f"Phone Numbers Redacted ({len(actual_phone_matches)})"})

    return {
        "sanitized_text": sanitized,
        "redactions_count": redactions_count,
        "redacted_types": sorted(list(redacted_types)),
        "details": details,
    }

