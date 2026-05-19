// src/shared/utils/formatSkillLabel.ts
//
// Converts raw API skill/sub_skill strings into proper display labels.
// "GRAMMAR"   → "Grammar"
// "main_idea" → "Main Idea"
// "READING"   → "Reading"
// "PRONUNCIATION" → "Pronunciation"

export function formatSkillLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}