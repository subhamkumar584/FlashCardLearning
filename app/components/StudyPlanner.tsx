"use client";

import React, { useMemo, useState } from "react";
import { Flashcard } from "@/app/utils/authUtils";

interface StudyPlannerProps {
  flashcards: Flashcard[];
}

interface TimeSlot {
  start: string;
  end: string;
  cards: number;
}

const toTimeLabel = (minutesFromMidnight: number): string => {
  const m = ((minutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
};

const StudyPlanner: React.FC<StudyPlannerProps> = ({ flashcards }) => {
  const total = flashcards.length;
  const completed = flashcards.filter((c) => c.completed).length;
  const remaining = total - completed;

  const [totalMinutesInput, setTotalMinutesInput] = useState("60");
  const [startTimeInput, setStartTimeInput] = useState("09:00");

  const totalMinutes = useMemo(() => {
    const n = parseInt(totalMinutesInput, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [totalMinutesInput]);

  const startMinutes = useMemo(() => {
    const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(startTimeInput.trim());
    if (!match) return 9 * 60; // 09:00 fallback
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  }, [startTimeInput]);

  const slots: TimeSlot[] = useMemo(() => {
    if (remaining <= 0 || totalMinutes <= 0) return [];

    const slotMinutes = 30; // 30‑minute blocks
    const slotCount = Math.max(1, Math.floor(totalMinutes / slotMinutes));
    const cardsPerSlot = Math.max(1, Math.ceil(remaining / slotCount));

    const result: TimeSlot[] = [];
    let cursor = startMinutes;

    for (let i = 0; i < slotCount; i++) {
      const start = cursor;
      const end = cursor + slotMinutes;
      cursor = end;
      result.push({
        start: toTimeLabel(start),
        end: toTimeLabel(end),
        cards: cardsPerSlot,
      });
    }

    return result;
  }, [remaining, totalMinutes, startMinutes]);

  const handleDownload = () => {
    if (!slots.length) return;

    const lines: string[] = [];
    lines.push("Daily Study Timetable");
    lines.push("======================");
    lines.push("");
    lines.push(`Total cards: ${total}`);
    lines.push(`Completed: ${completed}`);
    lines.push(`Remaining: ${remaining}`);
    lines.push(`Planned study time: ${totalMinutes} minutes`);
    lines.push("");

    slots.forEach((slot, index) => {
      lines.push(
        `Slot ${index + 1}: ${slot.start} - ${slot.end}  |  Review ~${slot.cards} cards`
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-study-timetable.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/20 text-slate-100">
      <h2 className="text-lg font-semibold mb-2">Daily study timetable</h2>
      {total === 0 ? (
        <p className="text-sm text-slate-300">
          Once you add flashcards, you can generate a personalised timetable for today.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-slate-200">
            You have <span className="font-semibold">{remaining}</span> cards left to review.
          </p>

          <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-slate-200">Total study time today (minutes)</span>
              <input
                type="number"
                min={10}
                step={5}
                value={totalMinutesInput}
                onChange={(e) => setTotalMinutesInput(e.target.value)}
                className="px-2 py-1.5 rounded-md bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-slate-200">Start time for study day</span>
              <input
                type="time"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="px-2 py-1.5 rounded-md bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
              />
            </label>
          </div>

          {slots.length === 0 ? (
            <p className="text-xs text-amber-300">
              Enter a positive number of minutes to generate a timetable.
            </p>
          ) : (
            <>
              <div className="mt-2 text-xs text-slate-300">
                Your day will be split into 30‑minute blocks. Try to complete the
                suggested number of cards in each block.
              </div>

              <ul className="mt-2 space-y-1 text-xs">
                {slots.map((slot, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-slate-900/50 px-2 py-1 border border-slate-700/70"
                  >
                    <span className="font-mono text-slate-100">
                      {slot.start} - {slot.end}
                    </span>
                    <span className="text-indigo-300">
                      ~{slot.cards} cards
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!slots.length}
                className="mt-3 w-full text-xs sm:text-sm px-3 py-2 rounded-md font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm transition-colors"
              >
                Download today&apos;s timetable
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
