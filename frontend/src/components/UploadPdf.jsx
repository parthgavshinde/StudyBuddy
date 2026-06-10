import React, { useState } from "react";
import "./UploadPdf.css";
const PRESET_QUERIES = [
  "Summarize the following provided text",
  "List the most important points from the text",
  "Create 5 short MCQs (with answers) from the text",
  "Explain the topic in simple terms for exam preparation",
  "Give me key formulas / definitions from the text",
];

const UploadPDFWithQuery = () => {
  const [file, setFile] = useState(null);
  const [activePreset, setActivePreset] = useState(PRESET_QUERIES[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showChunks, setShowChunks] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  };

  const choosePreset = (preset) => {
    setActivePreset(preset);
    setCustomQuery("");
    setResult(null);
    setError(null);
  };

  const getQueryToSend = () => {
    return customQuery.trim() !== "" ? customQuery.trim() : activePreset;
  };

  const handleUpload = async () => {
    setError(null);

    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    const query = getQueryToSend();
    if (!query) {
      setError("Please choose a preset or type a custom query.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);

    setUploading(true);
    setResult(null);

    try {
      const resp = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => null);
        throw new Error(
          errBody?.detail || errBody?.message || `HTTP ${resp.status}`
        );
      }

      const data = await resp.json();
      setResult(data);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Workspace</span>
          <h2>Upload Notes and Ask Better Study Questions</h2>
          <p>
            The backend flow stays the same. This frontend now follows the style
            of your provided reference with a clearer study dashboard layout.
          </p>
        </div>
        <div className="status-pills">
          <span className="status-pill">
            File: {file ? "Selected" : "Waiting"}
          </span>
          <span className="status-pill">
            Query: {customQuery.trim() ? "Custom" : "Preset"}
          </span>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="panel upload-panel">
          <div className="upload-area">
            <div className="upload-icon">📘</div>
            <h3>Choose your PDF</h3>
            <p>
              Select a study document and pair it with a preset prompt or your
              own custom revision request.
            </p>

            <label className="file-input-label" htmlFor="pdf-upload">
              Select PDF
            </label>
            <input
              id="pdf-upload"
              className="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {file && (
              <div className="file-info">
                <strong>{file.name}</strong>
              </div>
            )}
          </div>

          <div className="query-block">
            <label className="field-label">Quick questions</label>
            <div className="preset-grid">
              {PRESET_QUERIES.map((preset) => {
                const active =
                  preset === activePreset && customQuery.trim() === "";

                return (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-chip${active ? " active" : ""}`}
                    onClick={() => choosePreset(preset)}
                    disabled={uploading}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="query-block">
            <label className="field-label" htmlFor="custom-query">
              Or type a custom question
            </label>
            <input
              id="custom-query"
              className="query-input"
              value={customQuery}
              onChange={(event) => {
                setCustomQuery(event.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder="e.g. Create 5 short revision questions from this text"
              disabled={uploading}
            />
            <p className="field-hint">
              A custom query overrides the preset selection for this run.
            </p>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="primary-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Processing..." : "Upload & Run Query"}
            </button>
          </div>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        <section className="panel result-panel">
          <div className="result-header">
            <div>
              <span className="section-kicker">Output</span>
              <h3>Generated Answer</h3>
            </div>
            <div className="result-meta">
              <span className="meta-item">
                Chunks: {result?.num_chunks ?? "—"}
              </span>
              <span className="meta-item">Top-K: {result?.top_k ?? "—"}</span>
            </div>
          </div>

          {result ? (
            <>
              <div className="summary-box">
                <h4>Answer</h4>
                <div className="summary-text">{result.answer ?? "No answer."}</div>
              </div>

              <div className="chunks-section">
                <div className="chunks-header">
                  <h4>Selected chunks</h4>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowChunks((shown) => !shown)}
                  >
                    {showChunks ? "Hide Chunks" : "Show Chunks"}
                  </button>
                </div>

                {showChunks && (
                  <div className="chunks-list">
                    {Array.isArray(result.selected_chunks) &&
                    result.selected_chunks.length > 0 ? (
                      result.selected_chunks.map((chunk, index) => (
                        <article key={index} className="chunk-card">
                          <div className="chunk-header">
                            <strong>Chunk #{index + 1}</strong>
                            <span className="meta-item">
                              Score:{" "}
                              {Array.isArray(result.top_scores)
                                ? Number(result.top_scores[index]).toFixed(3)
                                : "—"}
                            </span>
                          </div>
                          <p>{chunk}</p>
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">No chunks available.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-result">
              <div className="empty-illustration">🧠</div>
              <h4>Your answer will appear here</h4>
              <p>
                Upload a PDF and run a query to see the response and the most
                relevant extracted chunks.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UploadPDFWithQuery;
