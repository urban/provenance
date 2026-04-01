import { ActiveNoteReader } from "@urban/provenance-engine";
import { Effect, ManagedRuntime } from "effect";
import type ProvenancePlugin from "../main";
import { makeObsidianActiveNoteReaderLayer } from "./activeNoteReader";

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
  const runtime = ManagedRuntime.make(makeObsidianActiveNoteReaderLayer(options.plugin));
  const getActiveNoteContext = Effect.gen(function* () {
    const noteReader = yield* ActiveNoteReader;
    return yield* noteReader.getActiveNote;
  });

  return {
    generatePanelResponse: async (prompt) => {
      const note = await runtime.runPromise(getActiveNoteContext);
      await delay(250);

      const trimmedPrompt = prompt.trim();
      const modeLabel = options.settings.llmMode.toUpperCase();
      const trimmedMarkdown = note.markdown.trim();
      const notePreview =
        trimmedMarkdown.length === 0
          ? "The active note is empty."
          : trimmedMarkdown.slice(0, 280);

      return {
        content: [
          `Prompt received in ${modeLabel} mode for ${note.title}.`,
          "",
          `Active note path: ${note.path}`,
          "",
          `Question: ${trimmedPrompt}`,
          "",
          "Active note preview:",
          notePreview,
          "",
          "This placeholder response now proves the panel can read real active-note context through the Obsidian adapter.",
          "Engine generation and persisted artifact writes land in later MVP tasks.",
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
      void runtime.dispose();
      // reserved for subscriptions, file watchers, and Effect runtime cleanup
    },
  };
};
