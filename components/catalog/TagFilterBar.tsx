"use client";

import React from "react";
import { Filter, ArrowDownAZ, LayoutGrid, Layers } from "lucide-react";

interface TagFilterBarProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  viewMode: "all" | "grouped" | "alpha";
  onChangeViewMode: (mode: "all" | "grouped" | "alpha") => void;
}

export function TagFilterBar({
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  viewMode,
  onChangeViewMode,
}: TagFilterBarProps) {
  const isAllSelected = selectedTags.length === 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Top row: Filter title & View mode switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Topics ({selectedTags.length > 0 ? selectedTags.length : "All"})</span>
        </div>

        {/* View / Sort controls */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => onChangeViewMode("all")}
            className={`min-h-[36px] px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              viewMode === "all"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-label="View all courses in grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Default</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode("alpha")}
            className={`min-h-[36px] px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              viewMode === "alpha"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-label="Sort courses alphabetically"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">A to Z</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode("grouped")}
            className={`min-h-[36px] px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              viewMode === "grouped"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-label="Group courses by topic"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grouped</span>
          </button>
        </div>
      </div>

      {/* Pill buttons: Guaranteed >=44px tap target height */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClearTags}
          className={`min-h-tap px-4 py-2 rounded-full text-xs font-semibold transition flex items-center justify-center border ${
            isAllSelected
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
          aria-pressed={isAllSelected}
        >
          All Topics
        </button>

        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={`min-h-tap px-3.5 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 border capitalize ${
                isSelected
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-pressed={isSelected}
            >
              <span>{tag}</span>
              {isSelected && <span className="text-[10px]">&times;</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
