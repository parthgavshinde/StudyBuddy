import React, { useState } from "react";

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

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  };

  const choosePreset = (p) => {
    setActivePreset(p);
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
        // try to read json error message
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
    <div style={styles.container}>
      <h2 style={styles.h2}>Upload Notes (PDF) & Ask</h2>

      <div style={styles.section}>
        <label style={styles.label}>Select file</label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file && <div style={styles.selected}>Selected: {file.name}</div>}
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Quick questions (tap to select)</label>
        <div style={styles.presetWrap}>
          {PRESET_QUERIES.map((p) => {
            const active = p === activePreset && customQuery.trim() === "";
            return (
              <button
                key={p}
                onClick={() => choosePreset(p)}
                disabled={uploading}
                style={{
                  ...styles.presetBtn,
                  ...(active ? styles.presetBtnActive : {}),
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Or type a custom question</label>
        <input
          value={customQuery}
          onChange={(e) => {
            setCustomQuery(e.target.value);
            // Do not clear preset; but selected query will be custom when typed
            setResult(null);
            setError(null);
          }}
          placeholder="e.g. Create 5 short revision questions from this text"
          disabled={uploading}
          style={styles.input}
        />
        <div style={styles.hint}>
          Using a custom query overrides the preset selection.
        </div>
      </div>

      <div style={styles.section}>
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            ...styles.uploadBtn,
            ...(uploading ? styles.uploadingBtn : {}),
          }}
        >
          {uploading ? "Processing..." : "Upload & Run Query"}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={styles.resultBox}>
          <div style={styles.resultHeader}>
            <h3 style={{ margin: 0 }}>Result</h3>
            <div style={styles.meta}>
              <span style={styles.metaItem}>
                Chunks: {result.num_chunks ?? "—"}
              </span>
              <span style={styles.metaItem}>Top-K: {result.top_k ?? "—"}</span>
            </div>
          </div>

          <div style={styles.answerSection}>
            <h4 style={styles.sub}>Answer</h4>
            <div style={styles.answer}>{result.answer ?? "No answer."}</div>
          </div>

          <div style={styles.chunksSection}>
            <div style={styles.chunksHeader}>
              <h4 style={styles.sub}>Selected chunks (top {result.top_k})</h4>
              <button
                onClick={() => setShowChunks((s) => !s)}
                style={styles.smallBtn}
              >
                {showChunks ? "Hide" : "Show"}
              </button>
            </div>

            {showChunks && (
              <>
                {Array.isArray(result.selected_chunks) &&
                  result.selected_chunks.length > 0 ? (
                  result.selected_chunks.map((c, idx) => (
                    <div key={idx} style={styles.chunkCard}>
                      <div style={styles.chunkHeader}>
                        <strong>Chunk #{idx + 1}</strong>
                        <span style={styles.score}>
                          Score:{" "}
                          {Array.isArray(result.top_scores)
                            ? Number(result.top_scores[idx]).toFixed(3)
                            : "—"}
                        </span>
                      </div>
                      <div style={styles.chunkText}>{c}</div>
                    </div>
                  ))
                ) : (
                  <div style={styles.muted}>No chunks available.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- simple inline styles (adjust to taste) ---------- */
const styles = {
  container: {
    padding: 20,
    maxWidth: 900,
    margin: "20px auto",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
  },
  h2: { marginBottom: 12 },
  section: { marginBottom: 16 },
  label: { display: "block", fontWeight: 600, marginBottom: 8 },
  selected: { marginTop: 8, color: "#333" },
  presetWrap: { display: "flex", gap: 8, flexWrap: "wrap" },
  presetBtn: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  presetBtnActive: {
    background: "#007bff",
    color: "white",
    borderColor: "#007bff",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  hint: { marginTop: 6, color: "#666", fontSize: 13 },
  uploadBtn: {
    padding: "12px 18px",
    borderRadius: 8,
    background: "#0b74f6",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  uploadingBtn: { background: "#999", cursor: "not-allowed" },
  errorBox: {
    marginTop: 14,
    padding: 12,
    background: "#f8d7da",
    color: "#721c24",
    borderRadius: 6,
  },
  resultBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 8,
    background: "#f7f9fc",
    border: "1px solid #e6eefb",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  meta: { display: "flex", gap: 12, alignItems: "center" },
  metaItem: { fontSize: 13, color: "#555" },
  answerSection: { marginBottom: 12 },
  sub: { margin: "6px 0" },
  answer: {
    padding: 12,
    background: "white",
    borderRadius: 6,
    border: "1px solid #eee",
    minHeight: 40,
  },
  chunksSection: {},
  chunksHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  smallBtn: {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  chunkCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 6,
    background: "white",
    border: "1px solid #eee",
  },
  chunkHeader: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  score: { color: "#666", fontSize: 13 },
  chunkText: { color: "#222" },
  muted: { color: "#666", fontStyle: "italic" },
};

export default UploadPDFWithQuery;
