"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Course, Lesson } from "@/lib/schema";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { saveLessonState, getLessonState, saveUserProfile, getUserProfile } from "@/lib/db";
import { PrivacyDrawer } from "./PrivacyDrawer";

const NOT_SENT_MESSAGE =
  "We couldn't send your details, so you haven't joined the pilot yet. They're saved on this device only. Tick both boxes and try again when you're online.";

interface LessonCompletionViewProps {
  course: Course;
  lesson: Lesson;
  /** The privacy notice, rendered on the server and shown in a drawer */
  privacyNotice: ReactNode;
}

export function LessonCompletionView({ course, lesson, privacyNotice }: LessonCompletionViewProps) {
  // Content Rating State
  const [rating, setRating] = useState<"thumbs-up" | "thumbs-down" | null>(null);
  const [ratingSaved, setRatingSaved] = useState(false);

  // Delayed Signup Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Load existing rating and profile from IndexedDB on mount
  useEffect(() => {
    async function loadStoredState() {
      const state = await getLessonState(course.slug, lesson.slug);
      if (state?.rating) {
        setRating(state.rating);
        setRatingSaved(true);
      }

      const profile = await getUserProfile();
      if (profile?.email) {
        setFullName(profile.fullName);
        setEmail(profile.email);
        if (profile.syncedToCloud) {
          setSignupSuccess(true);
        } else {
          // An earlier attempt never reached the roster: say so and let the learner retry.
          setSignupError(NOT_SENT_MESSAGE);
        }
      }
    }
    loadStoredState();
  }, [course.slug, lesson.slug]);

  // Handle rating click
  const handleRating = async (chosen: "thumbs-up" | "thumbs-down") => {
    setRating(chosen);
    setRatingSaved(true);
    await saveLessonState(course.slug, lesson.slug, { rating: chosen });
  };

  // Handle Value-First Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consented || !ageConfirmed || !fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setSignupError(null);

    const consentedAt = new Date().toISOString();
    const profile = {
      fullName: fullName.trim(),
      email: email.trim(),
      consentedAt,
    };

    let errorMessage: string | null = null;
    try {
      // Send to the API route; only a 2xx means the roster has the record.
      const res = await fetch("/api/pilot-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, consent: true, ageConfirmed: true }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const serverError =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : null;
        errorMessage = serverError || NOT_SENT_MESSAGE;
      }
    } catch {
      errorMessage = NOT_SENT_MESSAGE;
    }

    // Keep a local copy so the learner can retry; saveUserProfile handles storage failures itself.
    await saveUserProfile({ ...profile, syncedToCloud: errorMessage === null });

    if (errorMessage === null) {
      setSignupSuccess(true);
    } else {
      setSignupError(errorMessage);
      // Consent and the age confirmation must be given again for each attempt.
      setConsented(false);
      setAgeConfirmed(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6">
      <main className="max-w-xl w-full mx-auto space-y-6 text-center">
        {/* Celebration Header */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Tutorial Completed &bull; 100% Progress
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {lesson.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Excellent job! You successfully reinforced all concepts and active recall checkpoints without burning unnecessary mobile data.
          </p>
        </div>

        {/* Key Concepts Mastered */}
        {lesson.keyTerms.length > 0 && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-2.5 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Key Concepts Mastered
            </span>
            <div className="flex flex-wrap gap-1.5">
              {lesson.keyTerms.map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Feedback Rating */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 block">
            How was this interactive lesson?
          </span>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleRating("thumbs-up")}
              className={`min-h-tap px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 active:scale-98 ${
                rating === "thumbs-up"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Great lesson</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating("thumbs-down")}
              className={`min-h-tap px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 active:scale-98 ${
                rating === "thumbs-down"
                  ? "bg-amber-50 border-amber-400 text-amber-800 shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Needs work</span>
            </button>
          </div>
          {ratingSaved && (
            <p className="text-[11px] text-emerald-700 font-semibold animate-fadeIn">
              Thank you! Your feedback helps tune future lesson pacing.
            </p>
          )}
        </div>

        {/* Value-First Delayed Signup Form */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-brand-50/60 to-white rounded-3xl border border-brand-100 text-left space-y-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Value-First Onboarding
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Save Your Progress & Get New Lessons
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Link your device progress to an account to preserve completions and receive newly published chapters.
            </p>
            <p id="pilot-age-notice" className="text-xs font-semibold text-slate-700">
              Pilot signup is for learners aged 18 and over.
            </p>
          </div>

          {signupSuccess ? (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-emerald-900">
                <p className="font-bold">Progress successfully linked!</p>
                <p className="text-[11px] text-emerald-800">
                  Welcome to the pilot roster. Your credentials are protected under our NDPA policy.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {signupError && (
                <div
                  role="alert"
                  className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-900 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* Full Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full min-h-tap pl-10 pr-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-tap pl-10 pr-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              {/* Required, un-ticked 18+ confirmation */}
              <div className="flex items-center gap-2.5 min-h-tap">
                <input
                  type="checkbox"
                  id="pilot-age-confirm"
                  required
                  aria-describedby="pilot-age-notice"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                />
                <label
                  htmlFor="pilot-age-confirm"
                  className="flex-1 min-h-tap flex items-center text-xs font-semibold text-slate-700 cursor-pointer select-none"
                >
                  I am 18 or older.
                </label>
              </div>

              {/* Explicit Un-ticked NDPA Consent Checkbox */}
              <div className="flex items-start gap-2.5 min-h-tap">
                <input
                  type="checkbox"
                  id="pilot-ndpa-consent"
                  required
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-1.5 w-4 h-4 rounded-sm border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                />
                <label
                  htmlFor="pilot-ndpa-consent"
                  className="flex-1 min-h-tap py-1 text-[11px] text-slate-600 leading-snug cursor-pointer select-none"
                >
                  I consent to Asejik storing my name and email to save my progress and contact me for pilot feedback under the Nigeria Data Protection Act (NDPA 2023).
                </label>
              </div>

              {/* Opens the notice in a drawer, so typed details stay in place.
                  Kept outside the label so tapping the consent text only ticks the box. */}
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="min-h-tap px-1 text-[11px] font-semibold text-brand-700 underline hover:text-brand-900"
              >
                Read the privacy notice
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!consented || !ageConfirmed || !fullName.trim() || !email.trim() || isSubmitting}
                className={`w-full min-h-tap px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 active:scale-98 ${
                  consented && ageConfirmed && fullName.trim() && email.trim() && !isSubmitting
                    ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>
                  {isSubmitting ? "Linking Progress..." : signupError ? "Try Again" : "Save My Progress"}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Return to Catalog Action */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full min-h-tap px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Return to Course Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Privacy notice opens beside the form, never in a new tab */}
      <PrivacyDrawer
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        notice={privacyNotice}
      />
    </div>
  );
}
