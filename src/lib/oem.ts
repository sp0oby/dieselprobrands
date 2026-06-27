// Canonical key for fuzzy OEM part-number matching.
// Drops whitespace, punctuation, lowercases — so "0445-010516" and "0445010516" match.
export function canonicalizePartNumber(s: string): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Extract replacement part numbers from a free-text description.
// Pulls from common patterns: "Replacement Part Number: X, Y, Z" / "Replaces: X" / "Cross-reference: X"
export function extractOemNumbersFromText(text: string): string[] {
  if (!text) return [];
  const out = new Set<string>();
  const patterns = [
    /Replacement Part Number[s]?:\s*([^\n.]+)/gi,
    /Replaces?:\s*([^\n.]+)/gi,
    /Cross[- ]?Reference[s]?:\s*([^\n.]+)/gi,
    /OEM (?:Part )?Number[s]?:\s*([^\n.]+)/gi,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const list = m[1].split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      for (const n of list) {
        // Filter out things that don't look like part numbers (too short, no digit, full sentence).
        if (n.length < 4 || n.length > 40 || !/\d/.test(n) || n.includes(" ")) continue;
        out.add(n);
      }
    }
  }
  return [...out];
}
