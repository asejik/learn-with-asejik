import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Lock, Database, Trash2 } from "lucide-react";
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
          <span>NDPA 2023 &bull; GAID 2025 Compliant</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Privacy Notice & Learner Rights
        </h1>
        <p className="text-xs text-slate-500">
          Last updated: November 2026 &bull; Data Controller: {siteConfig.brandName} ({siteConfig.contactEmail})
        </p>
      </header>

      {/* Content */}
      <article className="prose prose-slate max-w-none text-slate-700 space-y-8 text-sm leading-relaxed">
        {/* Core Principles */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Privacy by Design & Data Minimization</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You can explore, read, and complete lessons on {siteConfig.name} without creating an account or providing any personal data. All lesson progress is stored strictly on your device inside your browser&apos;s local storage.
          </p>
        </section>

        {/* 1. Information Stored Locally */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-700" />
            <span>1. Information Stored Locally on Your Device</span>
          </h2>
          <p className="text-xs text-slate-600">
            To provide offline capability and active-recall learning without burning mobile data, we store:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li>Completed lesson IDs and progress percentages.</li>
            <li>Active recall retry queues (questions to review later).</li>
            <li>Lesson feedback ratings submitted upon completion.</li>
          </ul>
          <p className="text-xs text-slate-500 italic">
            This data never leaves your browser unless you explicitly choose to submit it.
          </p>
        </section>

        {/* 2. Optional Pilot Signup */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-700" />
            <span>2. Optional Information You May Provide</span>
          </h2>
          <p className="text-xs text-slate-600">
            When you complete a tutorial, you may optionally provide your <strong>Name</strong> and <strong>Email Address</strong> to receive a completion certificate or join our pilot learner updates.
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li><strong>Lawful Basis:</strong> Explicit Consent (Section 25 of the NDPA 2023).</li>
            <li><strong>Never Pre-ticked:</strong> We always use an un-checked checkbox requiring positive action.</li>
            <li><strong>No Ads or Resale:</strong> We never sell, rent, or share your data with advertisers.</li>
          </ul>
        </section>

        {/* 3. Your Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-700" />
            <span>3. Your Rights & Clearing Data</span>
          </h2>
          <p className="text-xs text-slate-600">
            Under the NDPA 2023, you have the right to access, rectify, or request deletion of your information at any time.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="font-semibold text-slate-800">Instant Local Wipe:</p>
            <p className="text-slate-600">
              You can wipe all locally stored progress, checkmarks, and active recall records anytime by tapping the <strong>&ldquo;Clear Local Data&rdquo;</strong> button in the catalog footer.
            </p>
            <p className="text-slate-600">
              For pilot roster inquiries or data deletion requests, contact us at <a href={`mailto:${siteConfig.contactEmail}`} className="text-brand-600 font-semibold underline">{siteConfig.contactEmail}</a>.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
