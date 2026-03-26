import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    ),
    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
  });
  return ffmpeg;
}

export async function splitAudio(
  file: File,
  chunkSeconds = 600
): Promise<Blob[]> {
  const ff = await getFFmpeg();
  const ext = file.name.split(".").pop() ?? "mp3";
  const inputName = `input.${ext}`;

  await ff.writeFile(inputName, await fetchFile(file));

  let duration = 0;
  ff.on("log", ({ message }) => {
    const match = message.match(/Duration: (\d+):(\d+):(\d+)/);
    if (match) {
      duration =
        parseInt(match[1]) * 3600 +
        parseInt(match[2]) * 60 +
        parseInt(match[3]);
    }
  });

  await ff.exec(["-i", inputName, "-f", "null", "-"]).catch(() => {});

  const totalChunks = Math.max(1, Math.ceil(duration / chunkSeconds));
  const chunks: Blob[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSeconds;
    const outputName = `chunk_${i}.mp3`;

    await ff.exec([
      "-i", inputName,
      "-ss", String(start),
      "-t", String(chunkSeconds),
      "-ar", "16000",
      "-ac", "1",
      "-b:a", "64k",
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    chunks.push(new Blob([data instanceof Uint8Array ? data.buffer as ArrayBuffer : data], { type: "audio/mpeg" }));
    await ff.deleteFile(outputName);
  }

  await ff.deleteFile(inputName);
  return chunks;
}
