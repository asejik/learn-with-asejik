"use client";

import { useState, useMemo } from "react";
import { Check, Link2, AlertCircle } from "lucide-react";
import { BaseWidgetProps } from "./types";
import { z } from "zod";
import { MatchPairsWidgetDataSchema } from "@/lib/schema";

type MatchPairsData = z.infer<typeof MatchPairsWidgetDataSchema>;

export default function MatchPairsWidget({
  data,
  onSubmitAnswer,
  isAnswered,
}: BaseWidgetProps<MatchPairsData>) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [isMismatch, setIsMismatch] = useState<boolean>(false);

  // Deterministically shuffle the right column so the items aren't directly opposite each other
  const shuffledRightItems = useMemo(() => {
    const items = [...data.pairs];
    // Reverse and rotate items deterministically
    return items.reverse().map((p, i) => ({
      ...p,
      displayIndex: (i + 2) % items.length,
    }));
  }, [data.pairs]);

  const handleSelectLeft = (id: string) => {
    if (isAnswered || matchedPairIds.includes(id)) return;
    setIsMismatch(false);
    setSelectedLeftId(id);

    // If a right item was already selected, check match
    if (selectedRightId) {
      evaluateMatch(id, selectedRightId);
    }
  };

  const handleSelectRight = (id: string) => {
    if (isAnswered || matchedPairIds.includes(id)) return;
    setIsMismatch(false);
    setSelectedRightId(id);

    // If a left item was already selected, check match
    if (selectedLeftId) {
      evaluateMatch(selectedLeftId, id);
    }
  };

  const evaluateMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      // Match succeeded!
      const updated = [...matchedPairIds, leftId];
      setMatchedPairIds(updated);
      setSelectedLeftId(null);
      setSelectedRightId(null);

      // Check if all pairs are matched
      if (updated.length === data.pairs.length) {
        onSubmitAnswer({
          isCorrect: true,
          explanation: data.explanation,
          bonusFact:
            "HTTP response codes are globally standardized by the IETF, ensuring every browser and smartphone in the world interprets server responses identically.",
        });
      }
    } else {
      // Mismatch!
      setIsMismatch(true);
      setTimeout(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setIsMismatch(false);
      }, 700);
    }
  };

  const totalPairs = data.pairs.length;
  const isComplete = matchedPairIds.length === totalPairs;

  return (
    <div className="space-y-5">
      {/* Header & Instruction */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Concept Pairing
            </span>
          </div>
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-full transition-colors ${
              isComplete
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {matchedPairIds.length} of {totalPairs} Paired
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-700">
          {data.instruction}
        </p>
      </div>

      {/* Mismatch Alert Banner */}
      {isMismatch && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Not quite a match. Try pairing another combination.</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block px-1">
            Status Code / Concept:
          </span>
          <div className="space-y-2">
            {data.pairs.map((pair) => {
              const isMatched = matchedPairIds.includes(pair.id);
              const isSelected = selectedLeftId === pair.id;

              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched || isAnswered}
                  onClick={() => handleSelectLeft(pair.id)}
                  className={`w-full min-h-tap p-3 sm:p-3.5 rounded-full border text-left text-xs sm:text-sm font-bold transition flex items-center justify-between gap-2 active:scale-98 ${
                    isMatched
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 opacity-90 cursor-default"
                      : isSelected
                      ? isMismatch
                        ? "bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-300"
                        : "bg-brand-600 text-white border-brand-600 ring-2 ring-brand-200 shadow-sm"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate">{pair.left}</span>
                  {isMatched && (
                    <Check className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block px-1">
            Outcome / Meaning:
          </span>
          <div className="space-y-2">
            {shuffledRightItems.map((pair) => {
              const isMatched = matchedPairIds.includes(pair.id);
              const isSelected = selectedRightId === pair.id;

              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched || isAnswered}
                  onClick={() => handleSelectRight(pair.id)}
                  className={`w-full min-h-tap p-3 sm:p-3.5 rounded-full border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-2 active:scale-98 ${
                    isMatched
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 opacity-90 cursor-default"
                      : isSelected
                      ? isMismatch
                        ? "bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-300"
                        : "bg-brand-600 text-white border-brand-600 ring-2 ring-brand-200 shadow-sm"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="leading-snug flex-1">{pair.right}</span>
                  {isMatched && (
                    <Check className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Completion Pill */}
      {isComplete && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
          <span>All pairs successfully matched! Continue below.</span>
        </div>
      )}
    </div>
  );
}
