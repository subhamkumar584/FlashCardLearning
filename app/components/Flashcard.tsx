"use client";

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Flashcard as FlashcardType } from '@/app/utils/authUtils';

interface Props {
  card: FlashcardType;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
  videoLink?: string;
  bookLink?: string;
}

export default function Flashcard({
  card,
  isFlipped,
  onFlip,
  onDelete,
  onMarkCompleted,
  videoLink,
  bookLink
}: Props) {
  // Debug logging
  console.log(`Flashcard ${card.id}:`, {
    front: card.front,
    isFlipped,
    videoLink,
    bookLink
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(card.front);
  const [editBack, setEditBack] = useState(card.back);
  const [editCategory, setEditCategory] = useState(card.category || '');
  const [loading, setLoading] = useState(false);

  const handleSaveEdit = async () => {
    if (!editFront.trim() || !editBack.trim()) return;
    
    setLoading(true);
    try {
      const cardRef = doc(db, 'flashcards', card.id);
      await updateDoc(cardRef, {
        front: editFront.trim(),
        back: editBack.trim(),
        category: editCategory.trim() || null,
        updatedAt: new Date()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating flashcard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditFront(card.front);
    setEditBack(card.back);
    setEditCategory(card.category || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="w-full h-64 p-4 rounded-xl shadow-md bg-white/10 dark:bg-white/5 ring-1 ring-white/20 text-slate-100">
        <div className="h-full flex flex-col space-y-2">
          <input
            type="text"
            value={editFront}
            onChange={(e) => setEditFront(e.target.value)}
            placeholder="Topic/Question"
            className="w-full p-2 rounded text-sm bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            disabled={loading}
          />
          <textarea
            value={editBack}
            onChange={(e) => setEditBack(e.target.value)}
            placeholder="Answer/Explanation"
            className="flex-1 w-full p-2 rounded text-sm resize-none bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            disabled={loading}
          />
          <input
            type="text"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-full p-2 rounded text-sm bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            disabled={loading}
          />
          <div className="flex justify-between pt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-slate-500 text-white rounded text-sm hover:bg-slate-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 rounded text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50"
              disabled={loading || !editFront.trim() || !editBack.trim()}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 perspective">
      <div
        className={`relative w-full h-full duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Side */}
        <div 
          className="absolute w-full h-full backface-hidden p-4 rounded-xl shadow-md bg-white/10 dark:bg-white/5 ring-1 ring-white/20 text-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onFlip}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-lg">Topic</p>
                {card.category && (
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
                    {card.category}
                  </span>
                )}
              </div>
              <p className="mb-4 text-slate-100">{card.front}</p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-sm text-white px-2 py-1 rounded bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow"
              >
                ✏️ Edit
              </button>
              <p className="text-xs text-gray-500">Click to flip</p>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute w-full h-full rotate-y-180 backface-hidden p-4 rounded-xl shadow-md bg-white/10 dark:bg-white/5 ring-1 ring-white/20 text-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onFlip}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-lg">Explanation</p>
              <p className="text-slate-200 text-sm">{card.back}</p>
              
              <div className="space-y-1 mt-3">
                {videoLink && (
                  <a
                    href={videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block text-sm hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📺 Watch on YouTube
                  </a>
                )}
                {bookLink && (
                  <a
                    href={bookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block text-sm hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📖 Learn from Book
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              {!card.completed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkCompleted();
                  }}
                  className="text-sm text-white px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-600"
                >
                  ✓ Mark Complete
                </button>
              ) : (
                <p className="text-green-600 font-semibold text-sm">✅ Completed</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-sm text-white px-3 py-1 rounded bg-rose-500 hover:bg-rose-600"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}