import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEYが設定されていません。");
  }

  const file = await OpenAI.toFile(audioBuffer, filename, { type: mimeType });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ja",
    response_format: "text",
  });

  return transcription as unknown as string;
}
