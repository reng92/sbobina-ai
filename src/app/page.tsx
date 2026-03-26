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

  async function handleTranscribe() {
    if (!file) return;
    setLoading(true);
    setTranscript("");
    setProgress(0);

    try {
      setStatus("⚙️ Caricamento ffmpeg e suddivisione audio...");
      const chunks = await splitAudio(file, 600);
      let fullText = "";

      for (let i = 0; i < chunks.length; i++) {
        setStatus(`🎙️ Trascrizione chunk ${i + 1} di ${chunks.length}...`);
        const form = new FormData();
        form.append(
          "chunk",
          new File([chunks[i]], `chunk_${i}.mp3`, { type: "audio/mpeg" })
        );
        form.append("language", language);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        fullText += (fullText ? " " : "") + data.text;
        setTranscript(fullText);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      setStatus("✅ Trascrizione completata!");
    } catch (e: unknown) {
      setStatus(
        "❌ Errore: " + (e instanceof Error ? e.message : String(e))
      );
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">🎓 SbobinaAI</h1>
        <p className="text-center text-slate-400 mb-10">
          Trascrivi lezioni universitarie lunghe — gratis, con Whisper
        </p>

        {/* Upload Card */}
        <div className="bg-slate-800/60 rounded-2xl p-6 mb-6 border border-slate-700">
          <label className="block text-sm font-medium mb-2">
            📁 File Audio (MP3, MP4, WAV, M4A, OGG...)
          </label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-400
                       file:mr-4 file:py-2 file:px-4 file:rounded-full
                       file:border-0 file:bg-indigo-600 file:text-white
                       hover:file:bg-indigo-500 cursor-pointer"
          />

          {file && (
            <p className="mt-2 text-xs text-slate-500">
              📎 {file.name} —{" "}
              {file.size > 1024 * 1024
                ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
                : (file.size / 1024).toFixed(0) + " KB"}
            </p>
          )}

          <label className="block text-sm font-medium mt-5 mb-2">
            🌍 Lingua della lezione
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-700 rounded-lg px-3 py-2 text-sm border border-slate-600"
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
            className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       disabled:opacity-40 disabled:cursor-not-allowed
                       font-semibold text-lg transition-all duration-200"
          >
            {loading ? "⏳ Elaborazione in corso..." : "🚀 Avvia Sbobinatura"}
          </button>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mb-6 bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
            <p className="text-sm text-slate-300 mb-3">{status}</p>
            <div className="w-full bg-slate-700 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-xs text-slate-500 mt-2">
              {progress}%
            </p>
          </div>
        )}

        {/* Result */}
        {transcript && (
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-xl">📝 Trascrizione</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(transcript)}
                  className="text-xs bg-slate-700 hover:bg-slate-600
                             px-4 py-2 rounded-lg transition-colors"
                >
                  📋 Copia tutto
                </button>
                <button
                  onClick={downloadTxt}
                  className="text-xs bg-indigo-700 hover:bg-indigo-600
                             px-4 py-2 rounded-lg transition-colors"
                >
                  💾 Scarica .txt
                </button>
              </div>
            </div>
            <textarea
              value={transcript}
              readOnly
              rows={16}
              className="w-full bg-slate-900/70 rounded-xl p-4
                         text-sm leading-relaxed text-slate-200
                         resize-y focus:outline-none border border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-2 text-right">
              {transcript.split(" ").length} parole
            </p>
          </div>
        )}

        {/* Status message */}
        {!loading && status && (
          <p className="text-center text-sm mt-4 text-slate-400">{status}</p>
        )}

      </div>
    </main>
  );
}
