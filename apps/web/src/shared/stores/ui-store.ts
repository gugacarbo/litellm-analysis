import { Store } from "@tanstack/react-store";

const UI_STORAGE_KEY = "lite-llm-analytics:ui-state";

export interface UiState {
  sidebarOpen: boolean;
}

const defaultUiState: UiState = {
  sidebarOpen: true,
};

function readInitialState(): UiState {
  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return defaultUiState;
    const parsed = JSON.parse(raw) as Partial<UiState>;
    return {
      sidebarOpen:
        typeof parsed.sidebarOpen === "boolean"
          ? parsed.sidebarOpen
          : defaultUiState.sidebarOpen,
    };
  } catch {
    return defaultUiState;
  }
}

function persistState(state: UiState): void {
  try {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (e.g. private mode).
  }
}

export const uiStore = new Store<UiState>(readInitialState());

export function setSidebarOpen(open: boolean): void {
  uiStore.setState((state) => {
    const next = { ...state, sidebarOpen: open };
    persistState(next);
    return next;
  });
}

export function toggleSidebar(): void {
  uiStore.setState((state) => {
    const next = { ...state, sidebarOpen: !state.sidebarOpen };
    persistState(next);
    return next;
  });
}
