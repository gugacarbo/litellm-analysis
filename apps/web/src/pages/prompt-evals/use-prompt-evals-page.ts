import { usePromptEvalsActions } from "./use-prompt-evals-actions.js";
import { usePromptEvalsDerived } from "./use-prompt-evals-derived.js";
import { usePromptEvalsState } from "./use-prompt-evals-state.js";

export function usePromptEvalsPage() {
  const state = usePromptEvalsState();
  const actions = usePromptEvalsActions();
  const derived = usePromptEvalsDerived(
    state.runs,
    state.sortField,
    state.sortDirection,
  );

  return {
    ...state,
    ...derived,
    ...actions,
  };
}
