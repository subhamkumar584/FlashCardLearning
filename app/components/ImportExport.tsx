"use client";

import React, { useRef, useState } from "react";
import { Flashcard } from "@/app/utils/authUtils";
import { db } from "@/firebase/config";
import { addDoc, collection } from "firebase/firestore";

interface ImportExportProps {
  flashcards: Flashcard[];
  userId: string;
  onImportComplete?: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({
  flashcards,
  userId,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(flashcards, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      const text = await file.text();
      const parsed = JSON.parse(text) as Array<
        Partial<Flashcard> & { front: string; back: string }
      >;

      for (const card of parsed) {
        await addDoc(collection(db, "flashcards"), {
          front: card.front,
          back: card.back,
          category: card.category ?? null,
          userId,
          createdAt: new Date(),
          completed: card.completed ?? false,
          reviewCount: card.reviewCount ?? 0,
        });
      }

      onImportComplete?.();
    } catch (err) {
      console.error("Import failed", err);
      alert("Could not import flashcards. Make sure the file is valid JSON.");
    } finally {
      setBusy(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/20 text-slate-100 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold mb-2">Import / Export</h2>
        <p className="text-sm text-slate-300 mb-4">
          Export your flashcards to a JSON file or import them again later.
        </p>
      </div>

      <div className="flex gap-3 mt-auto">
        <button
          type="button"
          onClick={handleExport}
          className="flex-1 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={busy}
          className="flex-1 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {busy ? "Importing..." : "Import JSON"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </div>
  );
};

export default ImportExport;
