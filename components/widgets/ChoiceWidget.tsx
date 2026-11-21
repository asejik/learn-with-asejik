"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, HelpCircle } from "lucide-react";
import { BaseWidgetProps } from "./types";
import { z } from "zod";
import { ChoiceWidgetDataSchema } from "@/lib/schema";

type ChoiceData = z.infer<typeof ChoiceWidgetDataSchema>;

export default function ChoiceWidget({
  data,
  onSubmitAnswer,
  isAnswered,
}: BaseWidgetProps<ChoiceData>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    if (isAnswered) return;

    if (data.isMultiSelect) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0 || isAnswered) return;

    let isCorrect = false;

    if (data.isMultiSelect) {
      isCorrect =
        data.correctOptionIds.length === selectedIds.length &&
        data.correctOptionIds.every((id) => selectedIds.includes(id));
    } else {
      isCorrect = selectedIds[0] === data.correctOptionIds[0];
    }

    onSubmitAnswer({
      isCorrect,
      explanation: data.explanation,
      bonusFact: data.bonusFact,
    });
  };

  return (
    <div className="space-y-5">
      {/* Question Header */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {data.question}
          </h2>
        </div>
        {data.isMultiSelect && (
          <p className="text-xs text-brand-700 font-semibold pl-6">
            Select all options that apply:
          </p>
        )}
      </div>

      {/* Choice Options List */}
      <div className="space-y-2.5">
        {data.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isAnswered}
              onClick={() => handleToggle(opt.id)}
              className={`w-full min-h-tap p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-3 active:scale-99 ${
                isSelected
                  ? "bg-brand-50 border-brand-600 text-brand-950 ring-1 ring-brand-600 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
              } ${isAnswered ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="leading-relaxed flex-1">{opt.text}</span>

              {/* Indicator (Checkbox or Radio) */}
              <span
                className={`w-5 h-5 flex items-center justify-center shrink-0 border transition ${
                  data.isMultiSelect
                    ? "rounded-md"
                    : "rounded-full"
                } ${
                  isSelected
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isSelected &&
                  (data.isMultiSelect ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Check Answer Button */}
      {!isAnswered && (
        <div className="pt-2">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleSubmit}
            className={`w-full min-h-tap px-4 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
              selectedIds.length > 0
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Check Answer</span>
          </button>
        </div>
      )}
    </div>
  );
}
