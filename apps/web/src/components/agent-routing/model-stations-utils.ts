// Shared utilities for model station cards
// Color utilities for consistent model visualization

export const MODEL_COLORS = [
  {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-600",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-600",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-600",
    dot: "bg-cyan-500",
  },
  {
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-600",
    dot: "bg-fuchsia-500",
  },
  {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600",
    dot: "bg-teal-500",
  },
] as const;

export type ModelColor = (typeof MODEL_COLORS)[number];

export function getModelColor(modelName: string): ModelColor {
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    hash = modelName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MODEL_COLORS[Math.abs(hash) % MODEL_COLORS.length];
}
