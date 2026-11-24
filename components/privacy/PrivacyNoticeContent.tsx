import { Mail, Lock, Database, Trash2, Server, UserCheck } from "lucide-react";
import { siteConfig } from "@/lib/config";

// The privacy notice text, kept in one component so the legal wording
// lives in one place wherever it is shown.
export function PrivacyNoticeContent() {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 space-y-8 text-sm leading-relaxed">
      {/* Core Principles */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600" />
          <span>Privacy by Design & Data Minimization</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You can explore, read, and complete lessons on {siteConfig.name} without signing up or giving any personal data. Lesson progress is stored on your device, in your browser&apos;s storage.
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
          <li>Your place within a lesson (current screen and screen order), so a reload resumes where you left off.</li>
          <li>Active recall retry queues (questions to review later).</li>
          <li>Lesson feedback ratings submitted upon completion.</li>
          <li>If you sign up for the pilot: your name, email, and the time you gave consent.</li>
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
          When you complete a tutorial, you may optionally provide your <strong>Name</strong> and <strong>Email Address</strong> to join the pilot, so Asejik can email you about new lessons and ask for your feedback.
        </p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>Lawful Basis:</strong> Explicit Consent (Section 25 of the NDPA 2023).</li>
          <li><strong>Never Pre-ticked:</strong> We always use an un-checked checkbox requiring positive action.</li>
          <li><strong>No Ads or Resale:</strong> We never sell, rent, or share your data with advertisers.</li>
        </ul>
      </section>

      {/* 3. Age */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-700" />
          <span>3. Who Can Sign Up</span>
        </h2>
        <p className="text-xs text-slate-600">
          Anyone can read and complete lessons without giving personal data. <strong>Pilot signup is for learners aged 18 and over.</strong> The signup form asks you to confirm you are 18 or older, and we do not accept a signup without that confirmation. If we learn that someone under 18 has signed up, we will delete their details from the pilot roster.
        </p>
      </section>

      {/* 4. Processors, transfers and retention */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-700" />
          <span>4. Who Processes Your Details, Where, and for How Long</span>
        </h2>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>Pilot roster:</strong> if you sign up, your name, email, consent time and age confirmation are sent over an encrypted connection to a private, access-restricted Google Sheet (provided by Google) that only {siteConfig.brandName} manages.</li>
          <li><strong>Website hosting:</strong> the site is hosted on Cloudflare, which handles the requests your browser makes to load pages and send the signup form, including your IP address and browser details in short-lived request logs.</li>
          <li><strong>Outside Nigeria:</strong> these providers may store or process your details on servers outside Nigeria.</li>
          <li><strong>How long we keep it:</strong> pilot roster details are kept until the pilot ends and then deleted within 30 days, or sooner if you ask us to delete them.</li>
        </ul>
      </section>

      {/* 5. Who is responsible */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-700" />
          <span>Who Is Responsible for Your Details</span>
        </h2>
        <p className="text-xs text-slate-600">
          {siteConfig.brandName}, an individual operating in Nigeria, decides how pilot details are used. Contact: <a href={`mailto:${siteConfig.contactEmail}`} className="text-brand-600 font-semibold underline">{siteConfig.contactEmail}</a>.
        </p>
        <p className="text-xs text-slate-500">Notice version 2, 24 November 2026.</p>
      </section>

      {/* 5. Your Rights */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-slate-700" />
          <span>5. Your Rights & Clearing Data</span>
        </h2>
        <p className="text-xs text-slate-600">
          Under the NDPA 2023, you have the right to ask for a copy of your details, to have them corrected or deleted, to ask us to limit how we use them, and to object to our use of them. You can also withdraw your consent at any time by emailing us; this does not affect anything we did with your details before you withdrew.
        </p>
        <p className="text-xs text-slate-600">
          If you believe your data has been mishandled, you have the right to complain to the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.
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
  );
}
