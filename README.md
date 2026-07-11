# AI Resume Analyzer

React + FastAPI + MongoDB + Gemini API + PyMuPDF

Analyzes a resume (PDF) against a job description to produce:
- An ATS-style match score (0–100)
- Matched skills vs. missing skills
- Strengths and concrete improvement suggestions
- AI-generated interview questions (technical, behavioral, resume-specific)

Every analysis is saved to MongoDB so you have a history.

---

## Project structure

```
ai-resume-analyzer/
├── backend/          FastAPI app
│   ├── main.py            API routes
│   ├── pdf_extractor.py   PyMuPDF text extraction
│   ├── gemini_service.py  Gemini API calls (scoring + questions)
│   ├── database.py        MongoDB access
│   ├── requirements.txt
│   └── .env.example
└── frontend/         React (Vite) app
    ├── src/App.jsx        Main UI
    ├── src/index.css      Styling
    └── package.json
```

---

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally OR a free MongoDB Atlas cluster
- A free Gemini API key: https://aistudio.google.com/apikey

---

## 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now edit .env and paste in your GEMINI_API_KEY and MONGO_URI

uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

### No MongoDB installed?
Easiest option: create a free cluster at https://www.mongodb.com/cloud/atlas,
grab the connection string, and paste it into `MONGO_URI` in `.env`.
Or run MongoDB locally with Docker:
```bash
docker run -d -p 27017:27017 --name resume-mongo mongo:7
```

---

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to
the backend on port 8000 (see `vite.config.js`), so no CORS headaches.

---

## 4. Using the app

1. Upload a resume as a PDF.
2. Paste the target job description.
3. Click **Analyze Resume** → see ATS score, matched/missing skills, strengths, suggestions.
4. Click **Generate Interview Questions** → technical, behavioral, and resume-specific questions tailored to that resume + job description.

---

## 5. How it works (for your report / viva)

1. **PyMuPDF (`pdf_extractor.py`)** opens the uploaded PDF in memory and pulls
   raw text from every page — no temp files written to disk.
2. **Gemini (`gemini_service.py`)** receives the resume text + job description
   in a structured prompt and is instructed to return strict JSON, which the
   backend parses directly into the API response — no manual keyword matching.
3. **MongoDB (`database.py`)** stores every analysis (filename, job description,
   result, timestamp) via PyMongo so you can build a history/dashboard view later.
4. **FastAPI (`main.py`)** exposes `/api/analyze`, `/api/interview-questions`,
   and `/api/history` endpoints, wiring the above together with CORS enabled
   for the React frontend.
5. **React (Vite)** provides the upload form, an animated SVG ATS-score ring,
   and skill/suggestion cards, calling the backend via `axios`.

---

## 6. Common issues

| Problem | Fix |
|---|---|
| `GEMINI_API_KEY is not set` | Make sure you renamed `.env.example` to `.env` and restarted uvicorn |
| `ServerSelectionTimeoutError` from MongoDB | MongoDB isn't running / URI is wrong — check `MONGO_URI` |
| "No extractable text found in this PDF" | The PDF is a scanned image, not real text — export the resume as text-based PDF |
| CORS errors in browser console | Make sure you're hitting the frontend via `localhost:5173`, not opening `index.html` directly |
