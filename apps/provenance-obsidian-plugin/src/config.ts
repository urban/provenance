export interface PersistedSettings {
  llmOutputPath: string;
  llmMode: "disabled" | "mock" | "pi";
}

export const DEFAULT_SETTINGS: PersistedSettings = {
  llmOutputPath: ".provenance/knowledge/research",
  llmMode: "mock",
};
