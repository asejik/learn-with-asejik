"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";
import { BaseWidgetProps } from "./types";
import { z } from "zod";
import { ReadingWidgetDataSchema } from "@/lib/schema";
import { splitByGlossary } from "@/lib/glossaryMatch";

type ReadingData = z.infer<typeof ReadingWidgetDataSchema>;

export default function ReadingWidget({
  data,
  glossary = [],
  onOpenGlossary,
  isAnswered,
  onContinue,
}: BaseWidgetProps<ReadingData>) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    // Media gate: only toggle on deliberate user interaction
    setIsPlayingAudio((prev) => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Optional Inline SVG Illustration */}
      {data.svgIllustration && (
        <div
          className="p-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
          dangerouslySetInnerHTML={{
            __html: data.svgIllustration,
          }}
        />
      )}

      {/* Prose Paragraphs with Inline Dotted Glossary Terms */}
      <div className="space-y-4">
        {data.paragraphs.map((p, idx) => (
          <p
            key={idx}
            className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal"
          >
            {splitByGlossary(p, glossary.map((g) => g.term)).map((part, partIdx) =>
              part.term && onOpenGlossary ? (
                <button
                  key={partIdx}
                  type="button"
                  onClick={() => onOpenGlossary(part.term as string)}
                  className="relative after:absolute after:-inset-x-3 after:-inset-y-3 border-b-2 border-dotted border-slate-400 font-semibold text-brand-700 hover:text-brand-900 hover:border-brand-600 transition focus:outline-none focus:ring-1 focus:ring-brand-500 rounded-xs"
                  title={`Define: ${part.term}`}
                >
                  {part.text}
                </button>
              ) : (
                <React.Fragment key={partIdx}>{part.text}</React.Fragment>
              )
            )}
          </p>
        ))}
      </div>

      {/* Click-to-Play Optional Audio (Never autoplayed or preloaded) */}
      {data.audioClip && (
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 min-w-0">
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-brand-600 shrink-0 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="truncate">
              {data.audioClip.label || "Audio Explanation (Opus)"}
            </span>
            {data.audioClip.durationSeconds && (
              <span className="text-[10px] text-slate-500 font-normal shrink-0">
                ({data.audioClip.durationSeconds}s)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleAudio}
            className="min-h-tap px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 active:scale-98 transition shrink-0"
          >
            {isPlayingAudio ? "Pause" : "Play (48 KB)"}
          </button>
        </div>
      )}

      {/* Reading Continue Button (Unlocked by default for reading screens) */}
      {!isAnswered && onContinue && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-tap px-4 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>Continue to Checkpoint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
