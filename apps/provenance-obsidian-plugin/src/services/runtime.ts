import {
  generateResearchResponse,
  LLMGateway,
  makePiLLMGatewayLayer,
  mockLLMGatewayLayer,
} from "@urban/provenance-engine";
import { Effect, Layer, ManagedRuntime } from "effect";
import type ProvenancePlugin from "../main";
import { makeObsidianActiveNoteReaderLayer } from "./activeNoteReader";

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
}

export interface PanelSaveResult {
  readonly message: string;
}

export interface PluginRuntime {
  readonly generatePanelResponse: (prompt: string) => Promise<PanelGenerationResult>;
  readonly saveGeneratedResponse: (response: string) => Promise<PanelSaveResult>;
  readonly dispose: () => void;
}

const disabledLLMGatewayLayer = Layer.succeed(
  LLMGateway,
  LLMGateway.of({
    generateResearch: () => Effect.die(new Error("LLM mode is disabled in plugin settings.")),
  }),
);

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const resolvePiApiKey = (settings: RuntimeOptions["settings"]): string => {
  const configuredApiKey = settings.piApiKey.trim();

  if (configuredApiKey.length === 0) {
    throw new Error("Pi mode requires a Pi API key in plugin settings.");
  }

  return configuredApiKey;
};

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
        apiKey: resolvePiApiKey(settings),
        model: settings.piModel,
      });
  }
};

export const makePluginRuntime = (options: RuntimeOptions): PluginRuntime => {
  const runtime = ManagedRuntime.make(
    Layer.merge(
      makeObsidianActiveNoteReaderLayer(options.plugin),
      makeLLMGatewayLayer(options.settings),
    ),
  );

  return {
    generatePanelResponse: async (prompt) => {
      const result = await runtime.runPromise(generateResearchResponse(prompt));

      return {
        content: result.response.content,
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
