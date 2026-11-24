"use client";

import React, { useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { BaseWidgetProps } from "./types";
import { z } from "zod";
import { ClozeWidgetDataSchema } from "@/lib/schema";

type ClozeData = z.infer<typeof ClozeWidgetDataSchema>;

export default function ClozeWidget({
  data,
  onSubmitAnswer,
  isAnswered,
}: BaseWidgetProps<ClozeData>) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedWord || isAnswered) return;

    const isCorrect =
      selectedWord.trim().toLowerCase() === data.correctAnswer.trim().toLowerCase();

    onSubmitAnswer({
      isCorrect,
      explanation: data.explanation,
      bonusFact: data.bonusFact,
    });
  };

  return (
    <div className="space-y-5">
      {/* Prompt Instruction */}
      <div className="flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm font-semibold text-slate-700">
          {data.prompt}
        </p>
      </div>

      {/* Sentence Template with Interactive Blank Slot */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 text-sm sm:text-base font-medium text-slate-800 leading-relaxed shadow-2xs">
        {data.template.split("{blank}").map((chunk, idx, arr) => (
          <React.Fragment key={idx}>
            <span>{chunk}</span>
            {idx < arr.length - 1 && (
              <span
                className={`inline-block px-3 py-1 mx-1.5 rounded-lg font-bold border-2 transition-all ${
                  selectedWord
                    ? "border-brand-500 bg-brand-50 text-brand-900 shadow-2xs"
                    : "border-dashed border-slate-400 bg-slate-50 text-slate-600"
                }`}
              >
                {selectedWord || "_______"}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Tapable Word Option Bank (min-h-tap >= 44px) */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Select the missing term:
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {data.options.map((opt) => {
            const isSelected = selectedWord === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={isAnswered}
                onClick={() => setSelectedWord(opt)}
                className={`min-h-tap p-3 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-center text-center select-none active:scale-98 ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-200"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                } ${isAnswered ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit / Check Answer Button */}
      {!isAnswered && (
        <div className="pt-2">
          <button
            type="button"
            disabled={!selectedWord}
            onClick={handleSubmit}
            className={`w-full min-h-tap px-4 py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
              selectedWord
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Check Blank Answer</span>
          </button>
        </div>
      )}
    </div>
  );
}
