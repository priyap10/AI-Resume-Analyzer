"""
Wraps all calls to the AI model:
1. ATS-style scoring + missing-skill detection + improvement suggestions
2. Interview question generation
"""

import json
import os
import re
from groq import Groq
from fastapi import HTTPException


def _get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not found in .env",
        )
    return Groq(api_key=api_key)


def _extract_json(raw_text: str) -> dict:
    """Extract JSON even if it's wrapped in markdown code fences."""
    cleaned = re.sub(
        r"^```(json)?|```$",
        "",
        raw_text.strip(),
        flags=re.MULTILINE,
    ).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned invalid JSON: {exc}",
        )


def analyze_resume(resume_text: str, job_description: str) -> dict:
    client = _get_client()

    prompt = f"""You are an expert ATS (Applicant Tracking System) and technical recruiter.

Compare the RESUME against the JOB DESCRIPTION.

Respond ONLY with valid JSON.

{{
  "ats_score": 85,
  "matched_skills": [],
  "missing_skills": [],
  "strengths": [],
  "suggestions": [],
  "summary": ""
}}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
        )

        return _extract_json(response.choices[0].message.content)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {exc}",
        )


def generate_interview_questions(resume_text: str, job_description: str) -> dict:
    client = _get_client()

    prompt = f"""You are a senior technical interviewer.

Based on the resume and job description, generate interview questions.

Respond ONLY with valid JSON.

{{
  "technical_questions": [],
  "behavioral_questions": [],
  "resume_specific_questions": []
}}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
        )

        return _extract_json(response.choices[0].message.content)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {exc}",
        )