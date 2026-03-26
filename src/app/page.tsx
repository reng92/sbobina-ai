"use client";
import { useState } from "react";
import { splitAudio } from "@/hooks/useAudioChunker";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("it");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dark, setDark] = useState(false);

  const t = {
    bg: dark ? "#08080f" : "#f5f4ff",
    surface: dark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.8)",
    surfaceHover: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.95)",
    border: dark ? "rgba(255,255,255,0.07)" : "rgba(124,58,237,0.12)",
    borderDrag: dark ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.5)",
    surfaceDrag: dark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)",
    text: dark ? "rgba(255,255,255,0.85)" : "#1a1035",
    textMuted: dark ? "rgba(255,255,255,0.35)" : "rgba(30,10,80,0.45)",
    textFaint: dark ? "rgba(255,255,255,0.2)" : "rgba(30,10,80,0.25)",
    textUltraFaint: dark ? "rgba(255,255,255,0.1)" : "rgba(30,10,80,0.15)",
    pillBg: dark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.08)",
    pillBorder: dark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.2)",
    pillText: dark ? "#a78bfa" : "#7c3aed",
    selectBg: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
    scrollbar: dark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.2)",
    progressTrack: dark ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.08)",
    transcriptText: dark ? "rgba(255,255,255,0.55)" : "rgba(30,10,80,0.65)",
    copyBtn: dark ? "rgba(255,255,255,0.05)" : "rgba(30,10,80,0.05)",
    copyBtnBorder: dark ? "rgba(255,255,255,0.07)" : "rgba(30,10,80,0.08)",
    copyBtnText: dark ? "rgba(255,255,255,0.5)" : "rgba(30,10,80,0.45)",
    toggleBg: dark ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.08)",
    toggleBorder: dark ? "rgba(255,255,255,0.1)" : "rgba(124,58,237,0.15)",
  };

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleTranscribe() {
    if (!file) return;
    setLoading(true);
    setTranscript("");
    setProgress(0);
    setWordCount(0);
    try {
      setStatus("Fase 1/2: Compressione e preparazione audio...");
      const chunks = await splitAudio(file, 300);
      let fullText = "";
      for (let i = 0; i < chunks.length; i++) {
        setStatus(`Segmento ${i + 1} di ${chunks.length}`);
        const form = new FormData();
        form.append("chunk", new File([chunks[i]], `chunk_${i}.mp3`, { type: "audio/mpeg" }));
        form.append("language", language);

        let data: { text?: string; error?: string } = {};
        let attempts = 0;

        while (attempts < 3) {
          try {
            const res = await fetch("/api/transcribe", { method: "POST", body: form });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            if (!data.error) break;
            throw new Error(data.error);
          } catch (err) {
            attempts++;
            if (attempts >= 3) throw err;
            setStatus(`Segmento ${i + 1} — retry ${attempts}...`);
            await new Promise(r => setTimeout(r, 2000 * attempts));
          }
        }

        if (data.error) throw new Error(data.error);
        fullText += (fullText ? " " : "") + data.text;
        setTranscript(fullText);
        setWordCount(fullText.trim().split(/\s+/).length);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));

        // Pausa tra chunk per evitare rate limit Groq
        if (i < chunks.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      setStatus("done");
    } catch (e: unknown) {
      setStatus("error:" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    const blob = new Blob([transcript], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name ?? "trascrizione") + ".txt";
    a.click();
  }

  const isError = status.startsWith("error:");
  const errorMsg = isError ? status.replace("error:", "") : "";

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "system-ui, sans-serif", transition: "background 0.4s ease, color 0.4s ease" }}>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "600px", height: "600px", background: dark ? "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", borderRadius: "50%", transition: "background 0.4s ease" }} />
        <div style={{ position: "absolute", top: "40%", right: "-15%", width: "500px", height: "500px", background: dark ? "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)" : "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", borderRadius: "50%", transition: "background 0.4s ease" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "30%", width: "400px", height: "400px", background: dark ? "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" : "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", borderRadius: "50%", transition: "background 0.4s ease" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Top bar: pill + toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: t.pillBg, border: `1px solid ${t.pillBorder}`, borderRadius: "100px", padding: "6px 16px" }}>
            <div style={{ width: "6px", height: "6px", background: t.pillText, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "12px", color: t.pillText, letterSpacing: "0.05em" }}>Whisper large-v3 · Groq</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setDark(!dark)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, borderRadius: "100px", padding: "8px 14px", cursor: "pointer", transition: "all 0.3s ease" }}
          >
            <span style={{ fontSize: "14px" }}>{dark ? "☀️" : "🌙"}</span>
            <span style={{ fontSize: "12px", color: t.pillText, fontWeight: "500" }}>{dark ? "Light" : "Dark"}</span>
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "52px", fontWeight: "800", letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 12px" }}>
            <span style={{ background: dark ? "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)" : "linear-gradient(135deg, #1a1035 0%, rgba(30,10,80,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sbobina</span>
            <span style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </h1>
          <p style={{ fontSize: "15px", color: t.textMuted, margin: 0 }}>
            Carica una lezione, ottieni la trascrizione
          </p>
        </div>

        {/* Upload card */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          style={{ position: "relative", marginBottom: "16px", borderRadius: "24px", border: `1px solid ${isDragging ? t.borderDrag : t.border}`, background: isDragging ? t.surfaceDrag : t.surface, backdropFilter: "blur(20px)", transition: "all 0.3s ease", overflow: "hidden", boxShadow: dark ? "none" : "0 4px 24px rgba(124,58,237,0.06)" }}
        >
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", cursor: "pointer", padding: "24px" }}>
            <input type="file" accept="audio/*,video/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎵</div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: t.text, margin: "0 0 4px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                <p style={{ fontSize: "12px", color: t.textFaint, margin: "0 0 12px" }}>
                  {file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : (file.size / 1024).toFixed(0) + " KB"}
                </p>
                <span style={{ fontSize: "11px", color: t.pillText, background: t.pillBg, padding: "4px 12px", borderRadius: "100px" }}>Cambia file</span>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "14px", opacity: 0.25 }}>↑</div>
                <p style={{ fontSize: "14px", color: t.textMuted, margin: "0 0 6px" }}>Trascina il file qui</p>
                <p style={{ fontSize: "12px", color: t.textFaint, margin: "0 0 14px" }}>oppure clicca per selezionare</p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {["MP3","MP4","WAV","M4A","OGG"].map(f => (
                    <span key={f} style={{ fontSize: "10px", color: t.textFaint, background: dark ? "rgba(255,255,255,0.04)" : "rgba(124,58,237,0.05)", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "3px 8px" }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Language */}
        <div style={{ marginBottom: "16px" }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: "100%", background: t.selectBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "14px 18px", fontSize: "14px", color: t.text, outline: "none", cursor: "pointer", backdropFilter: "blur(10px)", boxShadow: dark ? "none" : "0 2px 12px rgba(124,58,237,0.05)", transition: "all 0.3s ease" }}>
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇬🇧 English</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>

        {/* CTA */}
        <button
          onClick={handleTranscribe}
          disabled={!file || loading}
          style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: !file || loading ? (dark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.15)") : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)", color: !file || loading ? t.pillText : "white", fontSize: "15px", fontWeight: "600", cursor: !file || loading ? "not-allowed" : "pointer", transition: "all 0.3s ease", boxShadow: !file || loading ? "none" : "0 8px 32px rgba(124,58,237,0.35)", marginBottom: "32px" }}
        >
          {loading ? `Trascrizione · ${progress}%` : "Avvia Sbobinatura →"}
        </button>

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: "24px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "20px", backdropFilter: "blur(20px)", boxShadow: dark ? "none" : "0 4px 24px rgba(124,58,237,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: t.textMuted }}>{status}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: t.pillText }}>{progress}%</span>
            </div>
            <div style={{ background: t.progressTrack, borderRadius: "100px", height: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #6366f1)", borderRadius: "100px", transition: "width 0.7s ease" }} />
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ marginBottom: "24px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "16px", padding: "16px 20px" }}>
            <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>❌ {errorMsg}</p>
          </div>
        )}

        {/* Result */}
        {transcript && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", overflow: "hidden", backdropFilter: "blur(20px)", boxShadow: dark ? "none" : "0 8px 40px rgba(124,58,237,0.08)" }}>
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>Trascrizione</span>
                <span style={{ fontSize: "11px", color: t.textMuted, background: dark ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.06)", border: `1px solid ${t.border}`, borderRadius: "100px", padding: "3px 10px" }}>{wordCount.toLocaleString("it-IT")} parole</span>
                {status === "done" && <span style={{ fontSize: "11px", color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "100px", padding: "3px 10px" }}>✓ Completato</span>}
              </div>
            </div>
            <textarea value={transcript} readOnly rows={12} style={{ width: "100%", background: "transparent", border: "none", padding: "20px", fontSize: "14px", lineHeight: "1.8", color: t.transcriptText, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "10px" }}>
              <button onClick={() => navigator.clipboard.writeText(transcript)} style={{ flex: 1, padding: "12px", background: t.copyBtn, border: `1px solid ${t.copyBtnBorder}`, borderRadius: "12px", color: t.copyBtnText, fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>📋 Copia</button>
              <button onClick={downloadTxt} style={{ flex: 1, padding: "12px", background: t.pillBg, border: `1px solid ${t.pillBorder}`, borderRadius: "12px", color: t.pillText, fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>💾 Scarica .txt</button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "12px", color: t.textUltraFaint, marginTop: "40px" }}>Gratis · Nessun dato salvato · Elaborazione in cloud</p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        select option { background: ${dark ? "#1a1a2e" : "#ffffff"}; color: ${dark ? "white" : "#1a1035"}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
      `}</style>
    </div>
  );
}
