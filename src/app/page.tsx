"use client";
import { useState, useRef } from "react";
import { splitAudio } from "@/hooks/useAudioChunker";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("it");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
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
        setStatus(`Trascrizione segmento ${i + 1} di ${chunks.length}`);
        const form = new FormData();
        form.append("chunk", new File([chunks[i]], `chunk_${i}.mp3`, { type: "audio/mpeg" }));
        form.append("language", language);

        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        fullText += (fullText ? " " : "") + data.text;
        setTranscript(fullText);
        setWordCount(fullText.split(" ").length);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      setStatus("Completato");
    } catch (e: unknown) {
      setStatus("Errore: " + (e instanceof Error ? e.message : String(e)));
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

  function formatSize(bytes: number) {
    return bytes > 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
      : (bytes / 1024).toFixed(0) + " KB";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-6 backdrop-blur">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            Powered by Whisper large-v3
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent mb-3">
            SbobinaAI
          </h1>
          <p className="text-white/40 text-sm">
            Carica una lezione, ottieni la trascrizione completa
          </p>
        </div>

        {/* Upload zone */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group relative mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <label className="relative flex flex-col items-center justify-center w-full h-44 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur cursor-pointer transition-all duration-300 hover:border-violet-500/40">
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="text-center px-6">
                <div className="text-3xl mb-2">🎵</div>
                <p className="font-medium text-white/90 text-sm truncate max-w-xs">{file.name}</p>
                <p className="text-white/30 text-xs mt-1">{formatSize(file.size)}</p>
                <p className="text-violet-400 text-xs mt-3">Clicca per cambiare file</p>
              </div>
            ) : (
              <div className="text-center px-6">
                <div className="text-3xl mb-3 opacity-40">⬆</div>
                <p className="text-white/50 text-sm">Trascina qui il file audio</p>
                <p className="text-white/25 text-xs mt-1">oppure clicca per selezionare</p>
                <p className="text-white/20 text-xs mt-3">MP3 · MP4 · WAV · M4A · OGG · FLAC</p>
              </div>
            )}
          </label>
        </div>

        {/* Language + Button */}
        <div className="flex gap-3 mb-8">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 backdrop-blur focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            <option value="it">🇮🇹 Italiano</option>
            <option value="en">🇬🇧 English</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>

          <button
            onClick={handleTranscribe}
            disabled={!file || loading}
            className="flex-1 relative group overflow-hidden rounded-xl py-3 px-6 font-semibold text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Elaborazione...
              </span>
            ) : (
              "Avvia Sbobinatura →"
            )}
          </button>
        </div>

        {/* Progress */}
        {loading && (
          <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-white/40">{status}</span>
              <span className="text-xs font-mono text-violet-400">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {transcript && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/80">Trascrizione</span>
                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-white/30">
                  {wordCount.toLocaleString()} parole
                </span>
                {status === "Completato" && (
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-2.5 py-0.5">
                    ✓ {status}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(transcript)}
                  className="text-xs text-white/30 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg transition-all"
                >
                  Copia
                </button>
                <button
                  onClick={downloadTxt}
                  className="text-xs text-violet-300 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  Scarica .txt
                </button>
              </div>
            </div>
            <textarea
              value={transcript}
              readOnly
              rows={14}
              className="w-full bg-transparent px-5 py-4 text-sm leading-7 text-white/60 resize-none focus:outline-none font-mono"
            />
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/15 text-xs mt-10">
          Gratis · Nessun dato salvato · Elaborazione in cloud
        </p>

      </div>
    </div>
  );
}
