import { useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function ScoreRing({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75
      ? "#2563eb"      // Blue
      : score >= 50
      ? "#f59e0b"      // Orange
      : "#ef4444"      // Red

  return (
    <svg width="170" height="170" viewBox="0 0 170 170">
      {/* Background Ring */}
      <circle
        cx="85"
        cy="85"
        r={radius}
        stroke="#e5e7eb"
        strokeWidth="14"
        fill="none"
      />

      {/* Progress Ring */}
      <circle
        cx="85"
        cy="85"
        r={radius}
        stroke={color}
        strokeWidth="14"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 85 85)"
        style={{
          transition: "stroke-dashoffset 0.8s ease"
        }}
      />

      {/* Score */}
      <text
        x="85"
        y="80"
        textAnchor="middle"
        fontSize="34"
        fontWeight="700"
        fill="#111827"
      >
        {score}
      </text>

      {/* Label */}
      <text
        x="85"
        y="103"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#6b7280"
      >
        ATS SCORE
      </text>
    </svg>
  )
}
function SkillPills({ skills, variant }) {
  if (!skills || skills.length === 0) return <p className="empty-note">None found</p>
  return (
    <div className="pill-row">
      {skills.map((s, i) => (
        <span key={i} className={`pill pill-${variant}`}>{s}</span>
      ))}
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [qLoading, setQLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setFileName(f.name)
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please upload a resume PDF.')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please paste the job description.')
      return
    }

    setLoading(true)
    setResult(null)
    setQuestions(null)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('job_description', jobDescription)
      const res = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong analyzing the resume.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!file || !jobDescription.trim()) return
    setQLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('job_description', jobDescription)
      const res = await axios.post(`${API_BASE}/interview-questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setQuestions(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong generating questions.')
    } finally {
      setQLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="header">
  <div className="logo-circle">🤖</div>

  <h1>AI Resume Analyzer</h1>

  <p>
    Instantly evaluate your resume against any job description using AI. Get ATS compatibility, skill gap analysis, improvement suggestions, and interview questions in seconds.
  </p>
</header>

      <form className="analyze-form" onSubmit={handleAnalyze}>
        <div className="form-grid">
          <div className="field">
            <label>Resume (PDF)</label>
            <label className="file-drop">
              <input type="file" accept="application/pdf" onChange={handleFileChange} hidden />
              {fileName ? <span className="file-name">📄 {fileName}</span> : <span>Click to choose a PDF file</span>}
            </label>
          </div>

          <div className="field">
            <label>Job Description</label>
            <textarea
              rows={6}
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="button-row">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze Resume'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGenerateQuestions}
            disabled={qLoading || !file || !jobDescription.trim()}
          >
            {qLoading ? 'Generating…' : 'Generate Interview Questions'}
          </button>
        </div>
      </form>

      {result && (
        <section className="results">
          <div className="card score-card">
            <ScoreRing score={result.ats_score} />
            <p className="summary">{result.summary}</p>
          </div>

          <div className="card">
            <h3>✅ Matched Skills</h3>
            <SkillPills skills={result.matched_skills} variant="good" />
          </div>

          <div className="card">
            <h3>⚠️ Missing Skills</h3>
            <SkillPills skills={result.missing_skills} variant="bad" />
          </div>

          <div className="card">
            <h3>💪 Strengths</h3>
            <ul>
              {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="card">
            <h3>🛠️ Suggestions</h3>
            <ul>
              {result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </section>
      )}

      {questions && (
        <section className="results">
          <div className="card">
            <h3>🧠 Technical Questions</h3>
            <ol>
              {questions.technical_questions?.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
          <div className="card">
            <h3>🗣️ Behavioral Questions</h3>
            <ol>
              {questions.behavioral_questions?.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
          <div className="card">
            <h3>📋 Resume-Specific Questions</h3>
            <ol>
              {questions.resume_specific_questions?.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
        </section>
      )}
      <footer className="footer">
    Priya's Resume Analyzer wishes you luck! 
</footer>
    </div>
    
  )
}
