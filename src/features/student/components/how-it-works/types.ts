import type { LucideIcon } from 'lucide-react';

export interface RuleRow {
  label: string;
  value: string;
  sub?: string;
}

export interface RuleGroup {
  label?: string;
  rows: RuleRow[];
}

export interface NoteConfig {
  type: 'plain' | 'warn' | 'tip';
  text: string;
}

export type AccentKey = 'teal' | 'amber' | 'orange' | 'yellow' | 'indigo' | 'violet' | 'green';

export type OrbitNodeId = 'lexigrid' | 'drills' | 'ia' | 'mock';

export interface ChapterContent {
  id: string;
  number: string;
  icon: LucideIcon;
  label: string;
  tag: string;
  title: string;
  intro: string;
  ruleGroups: RuleGroup[];
  trailingNotes: NoteConfig[];
  accent: AccentKey;
  orbitNode?: OrbitNodeId;
  caption: string;
}
