import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type GeminiJsonResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { data?: string };
      }>;
    };
  }>;
};

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { topic?: string; numQuestions?: number };
  try {
    body = (await req.json()) as { topic?: string; numQuestions?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const topic = body.topic?.trim();
  const numQuestions = body.numQuestions && body.numQuestions > 0 ? body.numQuestions : 5;

  if (!topic) {
    return NextResponse.json({ error: "Missing 'topic' field." }, { status: 400 });
  }

  const systemPrompt = `You are StudySage, a friendly AI quiz generator.
Create a multiple-choice quiz for a student.
- Topic: ${topic}
- Number of questions: ${numQuestions}
- Each question must have 4 options (A-D) that are short.
- Exactly one option is correct.
- Include a brief explanation for each answer.

Respond with JSON matching this TypeScript type:
{
  "topic": string;
  "questions": {
    "id": string;
    "question": string;
    "options": string[];
    "correctIndex": number;
    "explanation": string;
  }[];
}`;

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
              parts: [{ text: systemPrompt }],
            },
          ],
          // Ask Gemini to return strict JSON.
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini quiz API error", res.status, text);
      return NextResponse.json(
        { error: "Upstream Gemini request failed." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as GeminiJsonResponse;
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    let raw = "";

    if (typeof part?.text === "string") {
      raw = part.text as string;
    } else if (part?.inlineData?.data) {
      // Some responses may come back as inlineData when using JSON mime type.
      const base64 = part.inlineData.data as string;
      raw = Buffer.from(base64, "base64").toString("utf8");
    }

    let quiz;
    try {
      // Try direct parse first.
      quiz = JSON.parse(raw);
    } catch (e) {
      // Fallback: strip markdown fences or surrounding text and parse the first JSON block.
      try {
        const cleaned = raw
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
          quiz = JSON.parse(jsonSlice);
        } else {
          throw e;
        }
      } catch (e2) {
        console.error("Failed to parse Gemini quiz JSON", e2, raw);
        return NextResponse.json(
          { error: "Gemini did not return valid quiz JSON." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error("Unexpected error while creating quiz", err);
    return NextResponse.json(
      { error: "Unexpected error while calling Gemini." },
      { status: 500 }
    );
  }
}
