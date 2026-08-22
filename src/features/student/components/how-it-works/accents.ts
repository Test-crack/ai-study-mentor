import type { AccentKey } from './types';

interface AccentClasses {
  border: string;
  iconBg: string;
  iconText: string;
  tagBg: string;
  tagText: string;
  dot: string;
  orbitActiveBg: string;
  orbitActiveBorder: string;
  orbitActiveText: string;
}

export const ACCENTS: Record<AccentKey, AccentClasses> = {
  teal: {
    border: 'border-l-brand-teal-500',
    iconBg: 'bg-brand-teal-50 dark:bg-brand-teal-500/10',
    iconText: 'text-brand-teal-600 dark:text-brand-teal-400',
    tagBg: 'bg-brand-teal-50 dark:bg-brand-teal-500/10',
    tagText: 'text-brand-teal-600 dark:text-brand-teal-400',
    dot: 'bg-brand-teal-500',
    orbitActiveBg: 'bg-brand-teal-500',
    orbitActiveBorder: 'border-brand-teal-400',
    orbitActiveText: 'text-brand-teal-300',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    tagBg: 'bg-amber-50 dark:bg-amber-500/10',
    tagText: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    orbitActiveBg: 'bg-amber-500',
    orbitActiveBorder: 'border-amber-400',
    orbitActiveText: 'text-amber-300',
  },
  orange: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    iconText: 'text-orange-600 dark:text-orange-400',
    tagBg: 'bg-orange-50 dark:bg-orange-500/10',
    tagText: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    orbitActiveBg: 'bg-orange-500',
    orbitActiveBorder: 'border-orange-400',
    orbitActiveText: 'text-orange-300',
  },
  yellow: {
    border: 'border-l-yellow-500',
    iconBg: 'bg-yellow-50 dark:bg-yellow-500/10',
    iconText: 'text-yellow-600 dark:text-yellow-400',
    tagBg: 'bg-yellow-50 dark:bg-yellow-500/10',
    tagText: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    orbitActiveBg: 'bg-yellow-500',
    orbitActiveBorder: 'border-yellow-400',
    orbitActiveText: 'text-yellow-300',
  },
  indigo: {
    border: 'border-l-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    tagBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    tagText: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    orbitActiveBg: 'bg-indigo-500',
    orbitActiveBorder: 'border-indigo-400',
    orbitActiveText: 'text-indigo-300',
  },
  violet: {
    border: 'border-l-violet-500',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconText: 'text-violet-600 dark:text-violet-400',
    tagBg: 'bg-violet-50 dark:bg-violet-500/10',
    tagText: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    orbitActiveBg: 'bg-violet-500',
    orbitActiveBorder: 'border-violet-400',
    orbitActiveText: 'text-violet-300',
  },
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconText: 'text-green-600 dark:text-green-400',
    tagBg: 'bg-green-50 dark:bg-green-500/10',
    tagText: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    orbitActiveBg: 'bg-green-500',
    orbitActiveBorder: 'border-green-400',
    orbitActiveText: 'text-green-300',
  },
};
