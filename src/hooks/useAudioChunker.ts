import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}

async function getDuration(ff: FFmpeg, filename: string): Promise<number> {
  let duration = 0;
  const handler = ({ message }: { message: string }) => {
    const match = message.match(/Duration: (\d+):(\d+):(\d+)/);
    if (match) {
      duration =
        parseInt(match[1]) * 3600 +
        parseInt(match[2]) * 60 +
        parseInt(match[3]);
    }
  };
  ff.on("log", handler);
  await ff.exec(["-i", filename, "-f", "null", "-"]).catch(() => {});
  ff.off("log", handler);
  return duration;
}

export async function splitAudio(
  file: File,
  chunkSeconds = 300
): Promise<Blob[]> {
  const ff = await getFFmpeg();
  const ext = file.name.split(".").pop() ?? "mp3";
  const inputName = `input.${ext}`;
  const compressedName = "compressed.mp3";

  // Fase 1: carica il file originale
  await ff.writeFile(inputName, await fetchFile(file));

  // Fase 2: pre-compressione — converte tutto in MP3 mono 16kHz 24kbps
  // Un file da 44MB diventa ~3MB prima di essere splittato
  await ff.exec([
    "-i", inputName,
    "-ar", "16000",
    "-ac", "1",
    "-b:a", "24k",
    "-map_metadata", "-1",  // rimuove metadata inutili
    compressedName,
  ]);
  await ff.deleteFile(inputName);

  // Fase 3: rileva la durata del file compresso
  const duration = await getDuration(ff, compressedName);
  const totalChunks = Math.max(1, Math.ceil(duration / chunkSeconds));
  const chunks: Blob[] = [];

  // Fase 4: split in chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSeconds;
    const outputName = `chunk_${i}.mp3`;

    await ff.exec([
      "-i", compressedName,
      "-ss", String(start),
      "-t", String(chunkSeconds),
      "-c", "copy",  // copia senza ricodificare (già compresso)
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    chunks.push(new Blob([data as Uint8Array], { type: "audio/mpeg" }));
    await ff.deleteFile(outputName);
  }

  await ff.deleteFile(compressedName);
  return chunks;
}
