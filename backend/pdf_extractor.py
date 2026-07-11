"""
PDF text extraction using PyMuPDF (fitz).
Pulls plain text out of an uploaded resume PDF so it can be sent to the LLM.
"""
import fitz  # PyMuPDF
from fastapi import HTTPException


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract and return plain text from a PDF file's raw bytes.
    Raises HTTPException if the PDF can't be read or has no extractable text.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not open PDF: {exc}")

    text_parts = []
    for page in doc:
        text_parts.append(page.get_text("text"))
    doc.close()

    full_text = "\n".join(text_parts).strip()

    if not full_text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF. It may be a scanned "
                   "image — try a text-based PDF export of the resume instead.",
        )

    return full_text
