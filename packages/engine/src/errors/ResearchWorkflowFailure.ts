import { Data } from "effect";

export class MissingActiveNoteFailure extends Data.TaggedError("MissingActiveNoteFailure")<{
  readonly message: string;
}> {}

export class InvalidConfigurationFailure extends Data.TaggedError("InvalidConfigurationFailure")<{
  readonly message: string;
}> {}

export class GenerationFailure extends Data.TaggedError("GenerationFailure")<{
  readonly message: string;
}> {}

export class BlockedWriteFailure extends Data.TaggedError("BlockedWriteFailure")<{
  readonly message: string;
}> {}

export class ArtifactWriteFailure extends Data.TaggedError("ArtifactWriteFailure")<{
  readonly message: string;
}> {}

export type ResearchWorkflowFailure =
  | MissingActiveNoteFailure
  | InvalidConfigurationFailure
  | GenerationFailure
  | BlockedWriteFailure
  | ArtifactWriteFailure;

const researchWorkflowFailureTags = new Set<string>([
  "MissingActiveNoteFailure",
  "InvalidConfigurationFailure",
  "GenerationFailure",
  "BlockedWriteFailure",
  "ArtifactWriteFailure",
]);

export const isResearchWorkflowFailure = (value: unknown): value is ResearchWorkflowFailure => {
  if (typeof value !== "object" || value === null || !("_tag" in value)) {
    return false;
  }

  const { _tag } = value;
  return typeof _tag === "string" && researchWorkflowFailureTags.has(_tag);
};
