"""
AI Resume Analyzer — FastAPI backend

Endpoints:
  POST /api/analyze
  POST /api/interview-questions
  GET  /api/health
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pdf_extractor import extract_text_from_pdf
from gemini_service import analyze_resume, generate_interview_questions

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    if resume.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    if not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty."
        )

    file_bytes = await resume.read()
    resume_text = extract_text_from_pdf(file_bytes)

    result = analyze_resume(
        resume_text,
        job_description
    )

    return result


@app.post("/api/interview-questions")
async def interview_questions(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    if resume.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    file_bytes = await resume.read()
    resume_text = extract_text_from_pdf(file_bytes)

    result = generate_interview_questions(
        resume_text,
        job_description
    )

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )