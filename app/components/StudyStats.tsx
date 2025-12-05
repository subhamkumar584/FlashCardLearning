"use client";

import React from "react";
import { Flashcard } from "@/app/utils/authUtils";

interface StudyStatsProps {
  flashcards: Flashcard[];
  userId: string;
  refreshKey: number;
}

const StudyStats: React.FC<StudyStatsProps> = ({ flashcards }) => {
  const total = flashcards.length;
  const completed = flashcards.filter((c) => c.completed).length;
  const inProgress = total - completed;

  const lastReviewed = flashcards
    .map((c) => c.lastReviewed)
    .filter(Boolean)
    .sort((a, b) => (b!.getTime() - a!.getTime()))[0] as Date | undefined;

  const hardestCards = flashcards
    .filter((c) => c.difficulty === "hard")
    .slice(0, 5);

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/20 text-slate-100">
      <h2 className="text-lg font-semibold mb-3">Study statistics</h2>
      {total === 0 ? (
        <p className="text-sm text-slate-300">
          You don&apos;t have any flashcards yet. Create some to see your stats here.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-slate-900/40 rounded-lg p-3">
              <div className="text-xs text-slate-300">Total cards</div>
              <div className="text-xl font-bold">{total}</div>
            </div>
            <div className="bg-emerald-900/40 rounded-lg p-3">
              <div className="text-xs text-slate-300">Completed</div>
              <div className="text-xl font-bold text-emerald-300">{completed}</div>
            </div>
            <div className="bg-amber-900/40 rounded-lg p-3">
              <div className="text-xs text-slate-300">In progress</div>
              <div className="text-xl font-bold text-amber-300">{inProgress}</div>
            </div>
          </div>

          {lastReviewed && (
            <div className="text-sm text-slate-200">
              <span className="font-medium">Last reviewed:</span>{" "}
              {lastReviewed.toLocaleString()}
            </div>
          )}

          {hardestCards.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Challenging cards</h3>
              <ul className="space-y-1 text-xs text-slate-200 max-h-32 overflow-auto pr-1">
                {hardestCards.map((card) => (
                  <li
                    key={card.id}
                    className="bg-slate-900/40 rounded-md px-2 py-1 truncate"
                  >
                    {card.front}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyStats;
