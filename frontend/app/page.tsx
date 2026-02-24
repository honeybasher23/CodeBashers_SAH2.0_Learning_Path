"use client";

import { useState } from "react";

// Define the interface for the path nodes so TypeScript is happy
interface PathNode {
  node_id: string;
  title: string;
  description: string;
  difficulty_level: number;
  prerequisites: string[];
}

export default function Home() {
  const [youtube, setYoutube] = useState("");
  const [github, setGithub] = useState("");
  const [blog, setBlog] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [activeNav, setActiveNav] = useState("new");

  // New states for the backend integration
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [learningPath, setLearningPath] = useState<PathNode[] | null>(null);

  // --- FUNCTION 1: The Main Generator ---
  const handleGeneratePath = async () => {
    // Basic validation to ensure at least one source is provided
    if (!youtube && !github && !blog && !pdf) {
      setError("Please provide at least one source to generate a path.");
      return;
    }

    setIsLoading(true);
    setError("");
    setLearningPath(null);

    const formData = new FormData();
    if (youtube) formData.append("youtubeUrl", youtube);
    if (github) formData.append("githubUrl", github);
    if (blog) formData.append("blogUrl", blog);
    if (pdf) formData.append("pdfFile", pdf);

    try {
      const response = await fetch("http://127.0.0.1:5001/api/generate-path", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate learning path.");
      }

      setLearningPath(data.optimized_path);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCTION 2: The Test Connection ---
  const testConnection = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5001/health");
      const data = await response.json();
      alert("✅ CONNECTION SUCCESSFUL!\nBackend says: " + data.status);
    } catch (err: any) {
      alert("❌ CONNECTION FAILED!\nError: " + err.message);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0c0c0e;
          color: #e8e8ea;
          min-height: 100vh;
        }

        .layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          background: #111114;
          border-right: 1px solid #1e1e24;
          gap: 40px;
        }

        .logo {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: #e8e8ea;
          text-transform: uppercase;
        }

        .logo span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #6c63ff;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
          position: relative;
          top: -1px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: none;
          background: transparent;
          color: #6b6b78;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          letter-spacing: 0.01em;
        }

        .nav-btn:hover {
          background: #1a1a20;
          color: #c8c8d0;
        }

        .nav-btn.active {
          background: #1a1a20;
          color: #e8e8ea;
          font-weight: 500;
        }

        .nav-icon {
          width: 16px;
          height: 16px;
          opacity: 0.6;
          flex-shrink: 0;
        }

        .nav-btn.active .nav-icon { opacity: 1; }

        .sidebar-footer {
          margin-top: auto;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #3a3a44;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── Main ── */
        .main {
          flex: 1;
          padding: 48px 56px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .header h2 {
          font-size: 22px;
          font-weight: 400;
          color: #e8e8ea;
          letter-spacing: -0.01em;
        }

        .header p {
          margin-top: 6px;
          font-size: 13px;
          color: #4a4a56;
          letter-spacing: 0.01em;
        }

        /* ── Cards ── */
        .cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          max-width: 760px;
        }

        .card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 24px;
          transition: border-color 0.2s ease;
        }

        .card:hover {
          border-color: #2e2e38;
        }

        .card-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #4a4a58;
          margin-bottom: 16px;
        }

        .card-label-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6c63ff;
          flex-shrink: 0;
        }

        .card input[type="url"],
        .card input[type="text"] {
          width: 100%;
          padding: 10px 14px;
          background: #0c0c0e;
          border: 1px solid #1e1e24;
          border-radius: 8px;
          color: #c8c8d0;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .card input[type="url"]:focus,
        .card input[type="text"]:focus {
          border-color: #6c63ff;
        }

        .card input::placeholder {
          color: #2e2e3a;
        }

        .card input[type="file"] {
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #4a4a58;
          cursor: pointer;
        }

        .card input[type="file"]::file-selector-button {
          padding: 7px 14px;
          background: #1a1a20;
          border: 1px solid #2e2e38;
          border-radius: 6px;
          color: #9898a8;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          margin-right: 12px;
          transition: all 0.15s ease;
        }

        .card input[type="file"]::file-selector-button:hover {
          background: #222228;
          color: #c8c8d0;
        }

        /* ── Generate Button ── */
        .generate-row {
          max-width: 760px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-generate {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 24px;
          background: #6c63ff;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .btn-generate:hover:not(:disabled) {
          background: #7b73ff;
        }

        .btn-generate:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-generate:disabled {
          background: #4a4a58;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-arrow {
          font-size: 15px;
          transition: transform 0.15s ease;
        }

        .btn-generate:hover:not(:disabled) .btn-arrow {
          transform: translateX(3px);
        }

        /* ── Results Section ── */
        .results-container {
          max-width: 760px;
          margin-top: 10px;
          animation: fadeIn 0.4s ease;
        }

        .error-message {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          padding: 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 24px;
        }

        .path-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .path-node {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 20px;
        }

        .node-number {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          color: #6c63ff;
          font-weight: 500;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .node-content h3 {
          font-size: 16px;
          font-weight: 500;
          color: #e8e8ea;
          margin-bottom: 6px;
        }

        .node-content p {
          font-size: 13px;
          color: #9898a8;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .node-meta {
          display: flex;
          gap: 12px;
        }

        .badge {
          background: #1a1a20;
          border: 1px solid #2e2e38;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #c8c8d0;
        }

        .badge.difficulty {
          color: #6c63ff;
          border-color: rgba(108, 99, 255, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <span></span>Cyclopath
          </div>

          <nav className="nav">
            <button
              className={`nav-btn ${activeNav === "new" ? "active" : ""}`}
              onClick={() => setActiveNav("new")}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
              </svg>
              New Path
            </button>
            <button
              className={`nav-btn ${activeNav === "history" ? "active" : ""}`}
              onClick={() => setActiveNav("history")}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="5.5"/>
                <path d="M8 5.5V8l2 1.5" strokeLinecap="round"/>
              </svg>
              History
            </button>
            <button
              className={`nav-btn ${activeNav === "settings" ? "active" : ""}`}
              onClick={() => setActiveNav("settings")}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
              </svg>
              Settings
            </button>
          </nav>

          <div className="sidebar-footer">v0.1.0</div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="header">
            <h2>Create a learning path</h2>
            <p>Add your sources below and generate a structured path.</p>
          </div>

          <div className="cards">
            <div className="card">
              <div className="card-label">
                <div className="card-label-dot"></div>
                YouTube
              </div>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
              />
            </div>

            <div className="card">
              <div className="card-label">
                <div className="card-label-dot"></div>
                GitHub Repo
              </div>
              <input
                type="url"
                placeholder="https://github.com/user/repo"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>

            <div className="card">
              <div className="card-label">
                <div className="card-label-dot"></div>
                PDF Document
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdf(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <div className="card">
              <div className="card-label">
                <div className="card-label-dot"></div>
                Blog Article
              </div>
              <input
                type="url"
                placeholder="https://medium.com/..."
                value={blog}
                onChange={(e) => setBlog(e.target.value)}
              />
            </div>
          </div>

          <div className="generate-row" style={{ gap: "16px" }}>
            {/* NEW TEST BUTTON to check backend connection */}
            <button 
              className="btn-generate" 
              onClick={testConnection}
              style={{ background: "#2e2e38", color: "#e8e8ea" }}
              type="button"
            >
              Test Connection
            </button>

            {/* YOUR EXISTING GENERATE BUTTON */}
            <button 
              className="btn-generate" 
              onClick={handleGeneratePath}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? "Analyzing Sources..." : "Generate path"}
              {!isLoading && <span className="btn-arrow">→</span>}
            </button>
          </div>

          {/* --- NEW: Results and Error Rendering --- */}
          <div className="results-container">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {learningPath && (
              <div className="path-timeline">
                <h3 className="card-label mb-4" style={{ marginBottom: "16px" }}>
                  <div className="card-label-dot"></div>
                  Your Optimized Timeline
                </h3>
                
                {learningPath.map((node, index) => (
                  <div key={node.node_id} className="path-node">
                    <div className="node-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="node-content">
                      <h3>{node.title}</h3>
                      <p>{node.description}</p>
                      <div className="node-meta">
                        <span className="badge difficulty">
                          Lvl {node.difficulty_level}/10
                        </span>
                        {node.prerequisites.length > 0 && (
                          <span className="badge">
                            {node.prerequisites.length} Prerequisite(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}