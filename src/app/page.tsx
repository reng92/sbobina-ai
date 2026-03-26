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
      setStatus("Caricamento motore audio...");
      const chunks = await splitAudio(file, 300);
      let fullText = "";
      for (let i = 0; i < chunks.length; i++) {
        setStatus(`Segmento ${i + 1} di ${chunks.length}`);
        const form = new FormData();
        form.append("chunk", new File([chunks[i]], `chunk_${i}.mp3`, { type: "audio/mpeg" }));
        form.append("language", language);
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fullText += (fullText ? " " : "") + data.text;
        setTranscript(fullText);
        setWordCount(fullText.trim().split(/\s+/).length);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
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
    <div style={{ minHeight: "100vh", background: "#08080f", color: "white", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "40%", right: "-15%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "30%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto", padding: "48px 20px 80px" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: "100px", padding: "6px 16px" }}>
            <div style={{ width: "6px", height: "6px", background: "#a78bfa", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "12px", color: "#a78bfa", letterSpacing: "0.05em" }}>Whisper large-v3 · Groq</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "52px", fontWeight: "800", letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 12px", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Sbobina<span style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Carica una lezione, ottieni la trascrizione
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          style={{ position: "relative", marginBottom: "16px", borderRadius: "24px", border: `1px solid ${isDragging ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.07)"}`, background: isDragging ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.025)", backdropFilter: "blur(20px)", transition: "all 0.3s ease", overflow: "hidden" }}
        >
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", cursor: "pointer", padding: "24px" }}>
            <input type="file" accept="audio/*,video/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎵</div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.85)", margin: "0 0 4px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", margin: "0 0 12px" }}>
                  {file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : (file.size / 1024).toFixed(0) + " KB"}
                </p>
                <span style={{ fontSize: "11px", color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "4px 12px", borderRadius: "100px" }}>Cambia file</span>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "14px", opacity: 0.3 }}>↑</div>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Trascina il file qui</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", margin: "0 0 14px" }}>oppure clicca per selezionare</p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {["MP3","MP4","WAV","M4A","OGG"].map(f => (
                    <span key={f} style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "3px 8px" }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </label>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "14px 18px", fontSize: "14px", color: "rgba(255,255,255,0.6)", outline: "none", cursor: "pointer" }}>
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇬🇧 English</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>

        <button
          onClick={handleTranscribe}
          disabled={!file || loading}
          style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: !file || loading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)", color: !file || loading ? "rgba(255,255,255,0.3)" : "white", fontSize: "15px", fontWeight: "600", cursor: !file || loading ? "not-allowed" : "pointer", transition: "all 0.3s ease", boxShadow: !file || loading ? "none" : "0 8px 32px rgba(124,58,237,0.35)", marginBottom: "32px" }}
        >
          {loading ? `Trascrizione · ${progress}%` : "Avvia Sbobinatura →"}
        </button>

        {loading && (
          <div style={{ marginBottom: "24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>{status}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#a78bfa" }}>{progress}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "100px", height: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #6366f1)", borderRadius: "100px", transition: "width 0.7s ease" }} />
            </div>
          </div>
        )}

        {isError && (
          <div style={{ marginBottom: "24px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "16px", padding: "16px 20px" }}>
            <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>❌ {errorMsg}</p>
          </div>
        )}

        {transcript && (
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "24px", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>Trascrizione</span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "100px", padding: "3px 10px" }}>{wordCount.toLocaleString("it-IT")} parole</span>
                {status === "done" && <span style={{ fontSize: "11px", color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "100px", padding: "3px 10px" }}>✓ Completato</span>}
              </div>
            </div>
            <textarea value={transcript} readOnly rows={12} style={{ width: "100%", background: "transparent", border: "none", padding: "20px", fontSize: "14px", lineHeight: "1.8", color: "rgba(255,255,255,0.55)", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "10px" }}>
              <button onClick={() => navigator.clipboard.writeText(transcript)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>📋 Copia</button>
              <button onClick={downloadTxt} style={{ flex: 1, padding: "12px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: "12px", color: "#a78bfa", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>💾 Scarica .txt</button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.1)", marginTop: "40px" }}>Gratis · Nessun dato salvato · Elaborazione in cloud</p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        select option { background: #1a1a2e; color: white; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
      `}</style>
    </div>
  );
}
