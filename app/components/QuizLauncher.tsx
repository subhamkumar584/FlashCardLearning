"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface QuizPayload {
  topic: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
}

const QuizLauncher: React.FC = () => {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartQuiz = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setError("Please enter a topic for your quiz.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed, numQuestions }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Quiz API error", text);
        setError("Could not generate quiz. Please try again.");
        return;
      }

      const data = (await res.json()) as { quiz: QuizPayload };
      const quiz = data.quiz;

      // Persist quiz for the quiz page to consume.
      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentQuiz", JSON.stringify(quiz));
      }

      router.push("/quiz");
    } catch (err) {
      console.error("Error starting quiz", err);
      setError("Something went wrong while starting the quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/20 text-slate-100 flex flex-col justify-between">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">AI Quiz</h2>
        <p className="text-sm text-slate-300">
          Enter a topic and let Gemini create a short quiz for you.
        </p>

        <div className="space-y-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-slate-200">Quiz topic</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's laws, World War II, React hooks"
              className="px-2 py-1.5 rounded-md bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 text-xs sm:text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs sm:text-sm">
            <span className="text-slate-200">Number of questions</span>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 rounded-md bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-xs text-rose-300 mt-1">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleStartQuiz}
        disabled={loading}
        className="mt-4 w-full text-xs sm:text-sm px-3 py-2 rounded-md font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm transition-colors"
      >
        {loading ? "Generating quiz…" : "Start quiz"}
      </button>
    </div>
  );
};

export default QuizLauncher;
