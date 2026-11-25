export interface GlossaryPart {
  text: string;
  /** The glossary term this piece opens, when it is a match */
  term?: string;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits a paragraph into plain pieces and glossary matches. A term matches
 * as a whole word or phrase, in any case, with an optional plural "s". Longer
 * terms win over shorter ones that sit inside them.
 */
export function splitByGlossary(text: string, terms: string[]): GlossaryPart[] {
  const sorted = Array.from(new Set(terms.filter((t) => t.trim()))).sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return [{ text }];
  // A leading group stands in for a look-behind, which older phones do not support
  const pattern = new RegExp(
    String.raw`(^|[^\p{L}\p{N}])(${sorted.map(escape).join("|")})s?(?![\p{L}\p{N}])`,
    "giu"
  );

  const parts: GlossaryPart[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(pattern))) {
    const start = (m.index ?? 0) + m[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    const matched = m[0].slice(m[1].length);
    const found = sorted.find((t) => t.toLowerCase() === m[2].toLowerCase()) ?? m[2];
    parts.push({ text: matched, term: found });
    last = start + matched.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
