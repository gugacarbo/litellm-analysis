import { usePromptEvalsActions } from "./use-prompt-evals-actions";
import { usePromptEvalsDerived } from "./use-prompt-evals-derived";
import { usePromptEvalsState } from "./use-prompt-evals-state";

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
