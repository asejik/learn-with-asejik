import { AlertTriangle } from "lucide-react";

/** Shown when the phone's storage refuses a save; progress then lives only until the page closes. */
export function StorageWarning() {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-950"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
      <p>Your progress could not be saved on this phone. It will be lost if you close this page.</p>
    </div>
  );
}
