"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/config";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";

export default function HomePage() {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Block rendering until hydration is ready
  if (!hasMounted) return null;

  // If NOT logged in → show AuthForm
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100">
        <AuthForm mode={mode} onAuthSuccess={() => {}} />

        <p className="mt-4 text-slate-300">
          {mode === "login"
            ? "Don\u2019t have an account?"
            : "Already have an account?"}

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="ml-2 underline text-indigo-300 hover:text-indigo-200"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    );
  }

  return <Dashboard user={user} />;
}
