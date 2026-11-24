import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PrivacyNoticeContent } from "@/components/privacy/PrivacyNoticeContent";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Privacy Notice & NDPA Rights",
  description: "Learn how we protect your data, minimize collection, and uphold your privacy rights under the Nigeria Data Protection Act (NDPA 2023).",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition min-h-tap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 pb-6 mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>NDPA 2023 &bull; GAID 2025</span>
        </div>
        <h1 className="font-display text-4xl text-slate-900 tracking-tight sm:text-5xl">
          Privacy Notice & Learner Rights
        </h1>
        <p className="text-xs text-slate-500">
          Last updated: November 2026 &bull; Data Controller: {siteConfig.brandName} ({siteConfig.contactEmail})
        </p>
      </header>

      <PrivacyNoticeContent />
    </main>
  );
}
