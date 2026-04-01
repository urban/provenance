import type ProvenancePlugin from "../main";

export interface RuntimeOptions {
  plugin: ProvenancePlugin;
  settings: {
    llmOutputPath: string;
    llmMode: "disabled" | "mock" | "pi";
  };
}

export interface PanelGenerationResult {
  readonly content: string;
}

export interface PanelSaveResult {
  readonly message: string;
}

export interface PluginRuntime {
  readonly generatePanelResponse: (prompt: string) => Promise<PanelGenerationResult>;
  readonly saveGeneratedResponse: (response: string) => Promise<PanelSaveResult>;
  readonly dispose: () => void;
}

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const makePluginRuntime = (options: RuntimeOptions): PluginRuntime => {
  return {
    generatePanelResponse: async (prompt) => {
      await delay(250);

      const trimmedPrompt = prompt.trim();
      const modeLabel = options.settings.llmMode.toUpperCase();

      return {
        content: [
          `Prompt received in ${modeLabel} mode.`,
          "",
          `Question: ${trimmedPrompt}`,
          "",
          "This placeholder response proves the panel can submit work and render output.",
          "Active-note context, engine workflows, and persisted artifact writes land in later MVP tasks.",
        ].join("\n"),
      };
    },
    saveGeneratedResponse: async (_response) => {
      await delay(150);

      return {
        message: `Save requested. Artifact persistence is not wired yet for ${options.settings.llmOutputPath}.`,
      };
    },
    dispose: () => {
      // reserved for subscriptions, file watchers, and Effect runtime cleanup
    },
  };
};
