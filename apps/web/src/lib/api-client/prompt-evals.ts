const BASE = "/api/prompt-evals/runs";

export interface EvalRunListItem {
  id: string;
  type: string;
  status: string;
  model: string;
  macroF1: number | null;
  threshold: number;
  startedAt: number;
  finishedAt: number | null;
  error: string | null;
  progressPct?: number;
}

export interface EvalRunDetail extends EvalRunListItem {
  steps: EvalRunStepItem[];
  categories?: Array<{
    category: string;
    precision: number | null;
    recall: number | null;
    f1: number | null;
    totalCases: number;
    matchedCases: number;
  }>;
  cases?: Array<{
    id: string;
    input: string;
    expectedCategories: string[];
    predictedCategories: string[];
    passed: boolean;
  }>;
}

export interface EvalRunStepItem {
  id: number;
  runId: string;
  step: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  message: string | null;
  progressPct: number;
}

export interface EvalRunArtifactItem {
  id: number;
  runId: string;
  kind: string;
  path: string;
  summaryJson: string | null;
}

export async function startEval(
  model: string,
  cases: Array<{ id: string; input: string; expectedCategories: string[] }>,
  threshold?: number,
): Promise<{ id: string }> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, threshold, cases }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listEvals(
  page = 1,
  pageSize = 20,
): Promise<{ runs: EvalRunListItem[]; total: number }> {
  const res = await fetch(`${BASE}?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getEval(id: string): Promise<EvalRunDetail> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getEvalArtifacts(
  id: string,
): Promise<EvalRunArtifactItem[]> {
  const res = await fetch(`${BASE}/${id}/artifacts`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelEval(id: string): Promise<{ cancelled: boolean }> {
  const res = await fetch(`${BASE}/${id}/cancel`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
