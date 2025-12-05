"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

type Props = {
  mode: "login" | "signup";
  onAuthSuccess: () => void;
};

export default function AuthForm({ mode, onAuthSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Authentication failed. Please try again.");
      }
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    try {
      setIsResetting(true);
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not send password reset email. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl backdrop-blur-xl shadow-2xl bg-white/10 dark:bg-white/5 ring-1 ring-white/20"
      >
        <h2 className="text-4xl font-extrabold text-center mb-2 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow">
          {mode === "login" ? "🔐 Welcome Back" : "🚀 Create an Account"}
        </h2>
        <p className="text-center text-slate-300 mb-6 text-sm">
          {mode === "login" ? "Sign in to continue your learning journey" : "Join and start building powerful flashcards"}
        </p>

        {error && <p className="text-rose-400 text-sm mb-3 text-center" role="alert" aria-live="polite">{error}</p>}
        {success && <p className="text-emerald-400 text-sm mb-3 text-center" role="status" aria-live="polite">{success}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-md bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 pr-10 rounded-md bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-sm text-slate-200"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {mode === "login" && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="text-sm underline text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
            >
              {isResetting ? "Sending..." : "Forgot password?"}
            </button>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-md text-white font-medium transition-all bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 shadow-lg"
        >
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}