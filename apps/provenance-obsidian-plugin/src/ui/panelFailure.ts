import { isResearchWorkflowFailure, type ResearchWorkflowFailure } from "@urban/provenance-engine";

export interface PanelFailureCopy {
  readonly title: string;
  readonly message: string;
}

export const describeResearchWorkflowFailure = (
  failure: ResearchWorkflowFailure,
): PanelFailureCopy => {
  switch (failure._tag) {
    case "MissingActiveNoteFailure":
      return {
        title: "No active note",
        message: failure.message,
      };
    case "InvalidConfigurationFailure":
      return {
        title: "Invalid settings",
        message: failure.message,
      };
    case "GenerationFailure":
      return {
        title: "Generation failed",
        message: failure.message,
      };
  }
};

export const describePanelGenerationError = (error: unknown): PanelFailureCopy => {
  if (isResearchWorkflowFailure(error)) {
    return describeResearchWorkflowFailure(error);
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      title: "Generation failed",
      message: error.message,
    };
  }

  return {
    title: "Generation failed",
    message: "An unexpected error interrupted generation.",
  };
};
