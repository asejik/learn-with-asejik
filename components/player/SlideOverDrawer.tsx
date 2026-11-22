"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** id of the element in `header` that names the dialog */
  titleId: string;
  /** Icon and title shown at the top left */
  header: ReactNode;
  closeLabel: string;
  footerLabel: string;
  /** Spacing classes for the scrolling body */
  bodyClassName: string;
  children: ReactNode;
}

// Shared slide-over shell, so reference content opens beside the lesson
// instead of in a new tab.
export function SlideOverDrawer({
  isOpen,
  onClose,
  titleId,
  header,
  closeLabel,
  footerLabel,
  bodyClassName,
  children,
}: SlideOverDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">{header}</div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label={closeLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-5 overflow-y-auto flex-1 ${bodyClassName}`}>{children}</div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-tap px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            {footerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
