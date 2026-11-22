"use client";

import React, { useState, useRef } from "react";
import { Check, X, Layers, HelpCircle } from "lucide-react";
import { BaseWidgetProps } from "./types";
import { z } from "zod";
import { SwipeDeckWidgetDataSchema } from "@/lib/schema";

type SwipeDeckData = z.infer<typeof SwipeDeckWidgetDataSchema>;

interface CardResult {
  cardId: string;
  userAnswer: boolean;
  isCorrect: boolean;
  explanation: string;
}

export default function SwipeDeckWidget({
  data,
  onSubmitAnswer,
  isAnswered,
}: BaseWidgetProps<SwipeDeckData>) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [answers, setAnswers] = useState<CardResult[]>([]);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalCards = data.cards.length;
  const currentCard = data.cards[currentCardIndex];
  // How many unanswered cards to show peeking out behind the active one
  const cardsBehind = Math.min(2, Math.max(0, totalCards - currentCardIndex - 1));

  const handleAnswer = (choice: boolean) => {
    if (isAnswered || !currentCard) return;

    const isMatch = choice === currentCard.isTrue;
    const newAnswers = [
      ...answers,
      {
        cardId: currentCard.id,
        userAnswer: choice,
        isCorrect: isMatch,
        explanation: currentCard.explanation,
      },
    ];
    setAnswers(newAnswers);

    if (currentCardIndex + 1 < totalCards) {
      setCurrentCardIndex((prev) => prev + 1);
      setDragOffset(0);
    } else {
      // Completed all cards in the deck!
      const allCorrect = newAnswers.every((a) => a.isCorrect);
      const incorrectStatements = newAnswers.filter((a) => !a.isCorrect);

      let summaryExplanation = "";
      if (allCorrect) {
        summaryExplanation = `Excellent! You correctly identified all ${totalCards} statements.`;
      } else {
        summaryExplanation = `You missed ${incorrectStatements.length} statement(s): ${incorrectStatements
          .map((a) => a.explanation)
          .join(" ")}`;
      }

      onSubmitAnswer({
        isCorrect: allCorrect,
        explanation: summaryExplanation,
        bonusFact:
          "Active recall flashcard decks improve long-term memory retention by over 40% compared to passive rereading.",
      });
    }
  };

  // Touch Swipe Handlers (for mobile phone ergonomics)
  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnswered) return;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If dragged right past 60px -> True
    if (dragOffset > 60) {
      handleAnswer(true);
    }
    // If dragged left past -60px -> False
    else if (dragOffset < -60) {
      handleAnswer(false);
    } else {
      setDragOffset(0);
    }
    touchStartX.current = null;
  };

  return (
    <div className="space-y-5 select-none">
      {/* Header & Instruction */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interactive Card Deck
            </span>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            Card {Math.min(currentCardIndex + 1, totalCards)} of {totalCards}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-700">
          {data.instruction}
        </p>
      </div>

      {/* Progress Mini Bar */}
      <div className="flex gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        {data.cards.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 transition-colors duration-200 ${
              idx < currentCardIndex
                ? "bg-brand-600"
                : idx === currentCardIndex
                ? "bg-brand-300 animate-pulse"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Active Card Deck Canvas */}
      {currentCard ? (
        <div className="py-2">
          {/* Card stack: up to two remaining cards peek out below the active
              one, so the deck reads as a pile of cards */}
          <div className={`relative ${cardsBehind > 0 ? "pb-5" : ""}`}>
          {Array.from({ length: cardsBehind }, (_, i) => cardsBehind - i).map((depth) => (
            <div
              key={currentCardIndex + depth}
              aria-hidden="true"
              style={{
                transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.05}) rotate(${
                  depth === 1 ? -1.5 : 2
                }deg)`,
                zIndex: 10 - depth,
              }}
              className={`absolute inset-x-0 top-0 bottom-5 rounded-2xl border-2 border-slate-300 shadow-sm origin-bottom transition-transform duration-200 motion-reduce:transition-none ${
                depth === 1 ? "bg-slate-50" : "bg-slate-100"
              }`}
            />
          ))}

          {/* Foreground Active Card */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
              transition: isDragging ? "none" : "transform 0.25s ease-out",
              zIndex: 20,
            }}
            className={`relative p-6 sm:p-8 bg-white rounded-2xl border-2 transition-shadow shadow-md flex flex-col justify-between min-h-[190px] sm:min-h-[210px] ${
              dragOffset > 30
                ? "border-emerald-500 ring-2 ring-emerald-200"
                : dragOffset < -30
                ? "border-amber-500 ring-2 ring-amber-200"
                : "border-slate-200"
            }`}
          >
            {/* Swipe Direction Hint Badges */}
            {dragOffset > 30 && (
              <span className="absolute top-3 right-3 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                TRUE
              </span>
            )}
            {dragOffset < -30 && (
              <span className="absolute top-3 left-3 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                FALSE
              </span>
            )}

            {/* Statement Text */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Statement
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                &ldquo;{currentCard.statement}&rdquo;
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium mt-4">
              Swipe right for True • Swipe left for False
            </p>
          </div>
          </div>

          {/* Explicit Large Tap Buttons (Thumb Ergonomics >= 44x44px) */}
          {!isAnswered && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="min-h-tap px-4 py-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>False / No</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="min-h-tap px-4 py-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>True / Yes</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">
            Card Deck Evaluated!
          </p>
          <p className="text-xs text-slate-500">
            Check the feedback panel below to review your answers.
          </p>
        </div>
      )}
    </div>
  );
}
