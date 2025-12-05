import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Default to a currently supported Gemini text model for v1beta.
// You can override this with GEMINI_MODEL in your environment.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { prompt?: string };
  try {
    body = (await req.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt' field." }, { status: 400 });
  }

  // System instruction keeps answers focused on helpful, study-oriented guidance.
  const fullPrompt = `You are StudySage, a friendly AI study buddy.
- Help the user understand concepts, explain ideas simply, and give examples.
- Stay focused on learning, education, and general knowledge about the world.
- If the user asks for anything clearly unrelated to studying or constructive learning (for example, harmful, unsafe, or non-educational topics), reply exactly: "I can't assist you in that. Please ask me about studying or learning.".

User question: ${prompt}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL
      )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini API error", res.status, text);
      return NextResponse.json(
        { error: "Upstream Gemini request failed." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as any;
    const answer: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? undefined;

    return NextResponse.json({ answer: answer ?? null });
  } catch (err) {
    console.error("Error talking to Gemini", err);
    return NextResponse.json(
      { error: "Unexpected error while calling Gemini." },
      { status: 500 }
    );
  }
}
