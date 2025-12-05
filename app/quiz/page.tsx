"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudyPresence from "../components/StudyPresence";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizPayload {
  topic: string;
  questions: QuizQuestion[];
}

const QuizPage: React.FC = () => {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("currentQuiz");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as QuizPayload;
      setQuiz(parsed);
      setAnswers(new Array(parsed.questions.length).fill(-1));
    } catch (e) {
      console.error("Failed to parse stored quiz", e);
    }
  }, []);

  const allAnswered =
    quiz && answers.length === quiz.questions.length && answers.every((a) => a >= 0);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (!quiz || submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!quiz || !allAnswered) return;

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    if (typeof window !== "undefined") {
      const payload = {
        topic: quiz.topic,
        score: correct,
        total: quiz.questions.length,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem("lastQuizScore", JSON.stringify(payload));
    }
  };

  const handleGoToDashboard = () => {
    router.push("/");
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-2">
          <p className="text-sm">No quiz is currently loaded.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-2 px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-sm text-white"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 px-4 py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 ring-1 ring-white/20">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">Quiz on {quiz.topic}</h1>
          <p className="text-sm text-slate-300 mb-4">
            Answer all questions. You must select an option for every question before you can
            submit. After you submit, you&apos;ll see your score and can return to the dashboard.
          </p>

          <div className="space-y-4">
            {quiz.questions.map((q, qi) => (
              <div key={q.id} className="rounded-lg bg-slate-950/40 border border-slate-700/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">
                    Q{qi + 1}. {q.question}
                  </p>
                  {submitted && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/80">
                      {answers[qi] === q.correctIndex ? "✔" : "✖"}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-xs sm:text-sm">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    const isCorrect = q.correctIndex === oi;
                    const showCorrectState = submitted;

                    let optionClasses = "border-slate-700 bg-slate-900/60";
                    if (showCorrectState) {
                      if (isCorrect) optionClasses = "border-emerald-500 bg-emerald-900/30";
                      else if (selected && !isCorrect)
                        optionClasses = "border-rose-500 bg-rose-900/30";
                    } else if (selected) {
                      optionClasses = "border-indigo-500 bg-indigo-900/40";
                    }

                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => handleSelect(qi, oi)}
                        disabled={submitted}
                        className={`w-full text-left px-2 py-1.5 rounded-md border ${optionClasses} transition-colors`}
                      >
                        <span className="font-mono mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submitted && q.explanation && (
                  <p className="mt-2 text-xs text-slate-300">
                    <span className="font-semibold">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitted || !allAnswered}
              className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-white"
            >
              {submitted ? "Quiz submitted" : "Submit quiz"}
            </button>

            {submitted && score !== null && (
              <div className="text-sm text-slate-200">
                Score: <span className="font-semibold">{score}</span> / {quiz.questions.length}
              </div>
            )}
          </div>

          {submitted && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white"
              >
                Go to dashboard
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <StudyPresence userId="quiz" />
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
