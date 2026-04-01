export interface PersistedSettings {
  llmOutputPath: string;
  llmMode: "disabled" | "mock" | "pi";
  piApiKey: string;
  piModel: string;
}

export const DEFAULT_SETTINGS: PersistedSettings = {
  llmOutputPath: ".provenance/knowledge/research",
  llmMode: "mock",
  piApiKey: "",
  piModel: "gpt-4.1-mini",
};
