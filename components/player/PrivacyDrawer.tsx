"use client";

import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { SlideOverDrawer } from "./SlideOverDrawer";

interface PrivacyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** The privacy notice, rendered on the server and passed in */
  notice: ReactNode;
}

// Shows the privacy notice beside the sign-up form, so learners can read it
// without leaving the page and losing what they typed.
export function PrivacyDrawer({ isOpen, onClose, notice }: PrivacyDrawerProps) {
  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      titleId="privacy-drawer-title"
      closeLabel="Close Privacy Notice"
      footerLabel="Back to sign-up"
      bodyClassName="space-y-4"
      header={
        <>
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              NDPA 2023
            </h2>
            <span id="privacy-drawer-title" className="text-base font-extrabold text-slate-900">
              Privacy Notice
            </span>
          </div>
        </>
      }
    >
      {notice}
    </SlideOverDrawer>
  );
}
