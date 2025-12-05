"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { PieChart } from "react-minimal-pie-chart";
import { Flashcard as FlashcardType } from "@/app/utils/authUtils";
import Flashcard from "./Flashcard";
import ThemeToggle from "./ThemeToggle";
import StudyStats from "./StudyStats";
import StudyPresence from "./StudyPresence";
import { fetchBestYoutubeUrl } from "@/app/utils/fetchYoutube";
import StudyPlanner from "./StudyPlanner";
import QuizLauncher from "./QuizLauncher";
import { SkeletonGrid, LoadingSpinner } from "./Loading";
import StudySageAssistant from "./StudySageAssistant";
import confetti from "canvas-confetti";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

interface User {
  uid: string;
  email: string | null;
}

interface LastQuizScore {
  topic: string;
  score: number;
  total: number;
  completedAt: string;
}

export default function Dashboard({ user }: { user: User }) {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<FlashcardType[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [videoLinks, setVideoLinks] = useState<Record<string, string>>({});
  const [bookLinks, setBookLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [lastQuizScore, setLastQuizScore] = useState<LastQuizScore | null>(null);

  // Fetch flashcards
  useEffect(() => {
    const q = query(
      collection(db, "flashcards"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as FlashcardType[];
      setFlashcards(cards);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  // Load last quiz score (if any) from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("lastQuizScore");
      if (!raw) return;
      const parsed = JSON.parse(raw) as LastQuizScore;
      setLastQuizScore(parsed);
    } catch (e) {
      console.warn("Failed to read last quiz score", e);
    }
  }, []);

  // Filter flashcards based on search and category
  useEffect(() => {
    let filtered = flashcards;
    
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.category && card.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(card => card.category === selectedCategory);
    }
    
    setFilteredFlashcards(filtered);
  }, [flashcards, searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchLinksForCards = async () => {
      for (const card of flashcards) {
        // Fetch YouTube link (improved accuracy)
        if (!videoLinks[card.id]) {
          try {
            console.log(`Fetching YouTube for: "${card.front}"`);
            const bestUrl = await fetchBestYoutubeUrl(card.front);
            if (bestUrl) {
              console.log(`Found YouTube video: ${bestUrl}`);
              setVideoLinks((prev) => ({ ...prev, [card.id]: bestUrl }));
            } else {
              console.log('No accurate YouTube match for:', card.front);
            }
          } catch (error) {
            console.warn('Error fetching YouTube data:', error);
          }
        }

        // Fetch Book link
        if (!bookLinks[card.id]) {
          try {
            console.log(`Fetching Books for: "${card.front}"`);
            const query = encodeURIComponent(card.front);
            const withKey = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&key=${BOOKS_API_KEY}`;
            const withoutKey = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;

            let bkRes = await fetch(withKey);

            // Fallback: some keys are restricted or API not enabled -> try without key
            if (!bkRes.ok && bkRes.status === 403) {
              bkRes = await fetch(withoutKey);
            }

            if (!bkRes.ok) {
              console.warn(`Books API warning: ${bkRes.status} ${bkRes.statusText}`);
              continue;
            }

            const bkData = await bkRes.json();
            console.log('Books response:', bkData);

            const bkLink = bkData.items?.[0]?.volumeInfo?.infoLink;
            if (bkLink) {
              console.log(`Found Book link: ${bkLink}`);
              setBookLinks((prev) => ({ ...prev, [card.id]: bkLink }));
            } else {
              console.log('No book found for:', card.front);
            }
          } catch (error) {
            console.warn('Error fetching Books data:', error);
          }
        }
      }
    };
    
    if (flashcards.length > 0) {
      fetchLinksForCards();
    }
  }, [flashcards, YOUTUBE_API_KEY, BOOKS_API_KEY, videoLinks, bookLinks]);

  const handleAddFlashcard = async () => {
    if (!front.trim() || !back.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "flashcards"), {
        front: front.trim(),
        back: back.trim(),
        category: category.trim() || null,
        userId: user.uid,
        createdAt: new Date(),
        completed: false,
        reviewCount: 0
      });
      setFront("");
      setBack("");
      setCategory("");
      
      // Celebrate adding a new flashcard
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (error) {
      console.error('Error adding flashcard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "flashcards", id));
  };  

  const handleMarkCompleted = async (id: string) => {
    const ref = doc(db, "flashcards", id);
    await updateDoc(ref, { 
      completed: true,
      lastReviewed: new Date()
    });
    
    // Celebrate completion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Check if all cards are completed for mega celebration
    const newCompletedCount = flashcards.filter(c => c.completed || c.id === id).length;
    const totalCards = flashcards.length;
    
    if (newCompletedCount === totalCards && totalCards > 0) {
      // Mega celebration for 100% completion
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']
        });
      }, 500);
    }
  };

  const toggleFlip = (id: string) => {
    setFlippedCardId((prev) => (prev === id ? null : id));
  };

  // Commit the current search term (useful for button/Enter actions)
  const handleSearchSubmit = () => {
    setSearchTerm((s) => s.trim());
  };

  const completedCount = flashcards.filter((c) => c.completed).length;
  const totalCount = flashcards.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Get unique categories
  const categories = Array.from(new Set(flashcards.map(card => card.category).filter(Boolean)));
  
  // Progress by category
  const categoryProgress = categories.map(cat => {
    const catCards = flashcards.filter(card => card.category === cat);
    const catCompleted = catCards.filter(card => card.completed).length;
    return {
      category: cat,
      completed: catCompleted,
      total: catCards.length,
      percentage: Math.round((catCompleted / catCards.length) * 100)
    };
  });

  // Category distribution for side plot (top 5 + Other)
  const categoryCounts = categories
    .map(cat => ({ category: cat, count: flashcards.filter(card => card.category === cat).length }))
    .sort((a, b) => b.count - a.count);
  const topCats = categoryCounts.slice(0, 5);
  const otherCount = categoryCounts.slice(5).reduce((sum, c) => sum + c.count, 0);
  const catColors = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#f59e0b', '#94a3b8'];
  const categoryPieData = [
    ...topCats.map((c, i) => ({ title: c.category, value: c.count, color: catColors[i % catColors.length] })),
    ...(otherCount > 0 ? [{ title: 'Other', value: otherCount, color: catColors[5] }] : [])
  ];

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          Welcome, {user.email?.split('@')[0]}!
        </h1>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={() => signOut(auth)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md transition-colors shadow-lg"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search flashcards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pr-28 rounded-lg bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow"
              aria-label="Search"
            >
              Search
            </button>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 rounded-lg bg-white/10 backdrop-blur-md ring-1 ring-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          >
            <option value="" className="bg-gray-800">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
            ))}
          </select>
        </div>
        
        {/* Category Progress Bars */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-3">📊 Progress by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryProgress.map(({ category, completed, total, percentage }) => (
                <div key={category} className="bg-white/10 backdrop-blur-md rounded-lg p-3 ring-1 ring-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm text-slate-100">{category}</span>
                    <span className="text-sm text-slate-300">{completed}/{total}</span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">{percentage}% complete</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Camera Presence & Study Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-1">
          <StudyPresence userId={user.uid} onSecondsTick={() => setStatsRefreshKey((k) => k + 1)} />
        </div>
        <div className="lg:col-span-2">
          <StudyStats flashcards={flashcards} userId={user.uid} refreshKey={statsRefreshKey} />
        </div>
      </div>

      {/* Progress Chart + Side Plots */}
      <div className="my-8">
        <h2 className="text-center text-xl mb-4 font-semibold">Progress</h2>
        {totalCount === 0 ? (
          <div className="text-center text-gray-300 mt-6">
            <p className="text-sm">📭 No task is there</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Main Pie */}
            <div className="w-64 mx-auto">
              <PieChart
                data={[
                  { title: "Completed", value: completedCount, color: "#4ade80" },
                  { title: "Remaining", value: totalCount - completedCount, color: "#f87171" },
                ]}
                animate
                label={({ dataEntry }) => `${dataEntry.title} ${dataEntry.value}`}
                labelStyle={{ fontSize: "5px", fill: "#fff" }}
                radius={35}
              />
              <p className="text-center mt-2 text-white">{progressPercent}% Complete</p>
            </div>

            {/* Side panel with extra plots */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 ring-1 ring-white/20">
              {/* Completion bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Completed</span>
                  <span>{completedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Counts */}
              <div className="flex flex-col gap-1 text-sm text-slate-200 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300">✅ {completedCount} Completed</span>
                  <span className="text-rose-300">⏳ {totalCount - completedCount} Remaining</span>
                </div>
                {lastQuizScore && (
                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span>Last quiz:</span>
                    <span>
                      {lastQuizScore.score}/{lastQuizScore.total} on {lastQuizScore.topic}
                    </span>
                  </div>
                )}
              </div>

              {/* Category distribution mini pie */}
              {categoryPieData.length > 0 && (
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <PieChart
                      data={categoryPieData}
                      lineWidth={20}
                      radius={30}
                      animate
                      label={() => ""}
                    />
                  </div>
                  <div className="space-y-1">
                    {categoryPieData.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                        <span className="truncate">{d.title}</span>
                        <span className="text-slate-400">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Flashcard */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">📝 Create New Flashcard</h2>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 ring-1 ring-white/20">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Topic/Question</label>
              <input
                type="text"
                placeholder="Enter your question or topic..."
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Answer/Explanation</label>
              <textarea
                placeholder="Enter your answer or explanation..."
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 resize-none"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Math, Science, History..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleAddFlashcard}
              disabled={loading || !front.trim() || !back.trim()}
              className="w-full disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 disabled:opacity-50 shadow-lg"
            >
              {loading ? '🔄 Adding...' : '✨ Add Flashcard'}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz launcher + Daily Timetable */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="max-w-md h-full">
          <QuizLauncher />
        </div>
        <div className="max-w-md h-full">
          <StudyPlanner flashcards={flashcards} />
        </div>
      </div>

      {/* Flashcards */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            📋 Your Flashcards {filteredFlashcards.length > 0 && `(${filteredFlashcards.length})`}
          </h2>
          {searchTerm || selectedCategory ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
        
        {initialLoading ? (
          <SkeletonGrid />
        ) : filteredFlashcards.length === 0 ? (
          <div className="text-center text-gray-300 mt-10">
            {searchTerm || selectedCategory ? (
              <div>
                <p className="text-lg mb-2">🔍 No flashcards match your search</p>
                <p className="text-sm">Try adjusting your search terms or category filter</p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">📦 No flashcards yet</p>
                <p className="text-sm">Create your first flashcard to get started!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlashcards.map((card) => (
              <Flashcard
                key={card.id}
                card={card}
                isFlipped={flippedCardId === card.id}
                onFlip={() => toggleFlip(card.id)}
                onDelete={() => handleDelete(card.id)}
                onMarkCompleted={() => handleMarkCompleted(card.id)}
                videoLink={videoLinks[card.id]}
                bookLink={bookLinks[card.id]}
              />
            ))}
          </div>
        )}
      </div>
      {/* Floating AI assistant */}
      <StudySageAssistant />
    </div>
  );
}
