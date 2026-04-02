import {
  InvalidConfigurationFailure,
  generateResearchResponse,
  LLMGateway,
  makeResearchArtifactDraft,
  makePiLLMGatewayLayer,
  mockLLMGatewayLayer,
  saveResearchArtifact,
} from "@urban/provenance-engine";
import type { ArtifactDraft } from "@urban/provenance-shared";
import { Effect, Layer, ManagedRuntime } from "effect";
import type ProvenancePlugin from "../main";
import { makeObsidianActiveNoteReaderLayer } from "./activeNoteReader";
import { makeObsidianArtifactWriterLayer } from "./artifactWriter";

export interface RuntimeOptions {
  plugin: ProvenancePlugin;
  settings: {
    llmOutputPath: string;
    llmMode: "disabled" | "mock" | "pi";
    piApiKey: string;
    piModel: string;
  };
}

export interface PanelGenerationResult {
  readonly content: string;
  readonly artifactDraft: ArtifactDraft;
}

export interface PanelSaveResult {
  readonly message: string;
}

export interface PluginRuntime {
  readonly generatePanelResponse: (prompt: string) => Promise<PanelGenerationResult>;
  readonly saveGeneratedResponse: (draft: ArtifactDraft) => Promise<PanelSaveResult>;
  readonly dispose: () => void;
}

const disabledLLMGatewayLayer = Layer.succeed(
  LLMGateway,
  LLMGateway.of({
    generateResearch: () =>
      Effect.fail(
        new InvalidConfigurationFailure({
          message: "LLM mode is disabled in plugin settings.",
        }),
      ),
  }),
);

const makeLLMGatewayLayer = (
  settings: RuntimeOptions["settings"],
): Layer.Layer<LLMGateway, never, never> => {
  switch (settings.llmMode) {
    case "disabled":
      return disabledLLMGatewayLayer;
    case "mock":
      return mockLLMGatewayLayer;
    case "pi":
      return makePiLLMGatewayLayer({
        apiKey: settings.piApiKey,
        model: settings.piModel,
      });
  }
};

export const makePluginRuntime = (options: RuntimeOptions): PluginRuntime => {
  const runtime = ManagedRuntime.make(
    Layer.merge(
      Layer.merge(
        makeObsidianActiveNoteReaderLayer(options.plugin),
        makeLLMGatewayLayer(options.settings),
      ),
      makeObsidianArtifactWriterLayer(options.plugin, options.settings.llmOutputPath),
    ),
  );

  return {
    generatePanelResponse: async (prompt) => {
      const result = await runtime.runPromise(generateResearchResponse(prompt));

      return {
        content: result.response.content,
        artifactDraft: makeResearchArtifactDraft(result),
      };
    },
    saveGeneratedResponse: async (draft) => {
      const result = await runtime.runPromise(saveResearchArtifact(draft));

      return {
        message: `Saved artifact to ${result.path}.`,
      };
    },
    dispose: () => {
      void runtime.dispose();
      // reserved for subscriptions, file watchers, and Effect runtime cleanup
    },
  };
};
