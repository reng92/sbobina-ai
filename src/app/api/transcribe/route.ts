import Groq from "groq";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const chunk = formData.get("chunk") as File;
    const language = (formData.get("language") as string) || "it";

    if (!chunk) {
      return NextResponse.json(
        { error: "Nessun file ricevuto" },
        { status: 400 }
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file: chunk,
      model: "whisper-large-v3",
      language,
      response_format: "verbose_json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
