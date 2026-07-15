import { Store } from "@tanstack/react-store";

const UI_STORAGE_KEY = "llm-toolbox:ui-state";
const LEGACY_UI_STORAGE_KEY = "lite-llm-analytics:ui-state";

export interface UiState {
  sidebarOpen: boolean;
}

const defaultUiState: UiState = {
  sidebarOpen: true,
};

function readInitialState(): UiState {
  try {
    const raw =
      window.localStorage.getItem(UI_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_UI_STORAGE_KEY);
    if (!raw) return defaultUiState;
    const parsed = JSON.parse(raw) as Partial<UiState>;
    const state = {
      sidebarOpen:
        typeof parsed.sidebarOpen === "boolean"
          ? parsed.sidebarOpen
          : defaultUiState.sidebarOpen,
    };
    if (!window.localStorage.getItem(UI_STORAGE_KEY)) {
      window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
      window.localStorage.removeItem(LEGACY_UI_STORAGE_KEY);
    }
    return state;
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
