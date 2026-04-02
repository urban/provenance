import {
  ActiveNoteReader,
  ArtifactWriter,
  generateResearchResponse,
  LLMGateway,
  makeResearchArtifactDraft,
  saveResearchArtifact,
} from "@urban/provenance-engine";
import type { ArtifactDraft } from "@urban/provenance-shared";
import { Layer, ManagedRuntime } from "effect";

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

export const makePanelWorkflowRuntime = (
  servicesLayer: Layer.Layer<ActiveNoteReader | LLMGateway | ArtifactWriter, never, never>,
): PluginRuntime => {
  const runtime = ManagedRuntime.make(servicesLayer);

  return {
    generatePanelResponse: async (prompt) => {
      const result = await runtime.runPromise(generateResearchResponse(prompt));

      return {
        content: result.response.content,
        artifactDraft: makeResearchArtifactDraft(result, prompt),
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
