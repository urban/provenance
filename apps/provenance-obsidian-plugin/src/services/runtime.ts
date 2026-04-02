import {
  InvalidConfigurationFailure,
  LLMGateway,
  makePiLLMGatewayLayer,
  mockLLMGatewayLayer,
} from "@urban/provenance-engine";
import { Effect, Layer } from "effect";
import type ProvenancePlugin from "../main";
import { makeObsidianActiveNoteReaderLayer } from "./activeNoteReader";
import { makeObsidianArtifactWriterLayer } from "./artifactWriter";
import { makePanelWorkflowRuntime, type PluginRuntime } from "./panelWorkflowRuntime";

export interface RuntimeOptions {
  plugin: ProvenancePlugin;
  settings: {
    llmOutputPath: string;
    llmMode: "disabled" | "mock" | "pi";
    piApiKey: string;
    piModel: string;
  };
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
  const servicesLayer = Layer.merge(
    Layer.merge(
      makeObsidianActiveNoteReaderLayer(options.plugin),
      makeLLMGatewayLayer(options.settings),
    ),
    makeObsidianArtifactWriterLayer(options.plugin, options.settings.llmOutputPath),
  );

  return makePanelWorkflowRuntime(servicesLayer);
};

export type { PanelGenerationResult, PanelSaveResult, PluginRuntime } from "./panelWorkflowRuntime";
export { makePanelWorkflowRuntime } from "./panelWorkflowRuntime";
