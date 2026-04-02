import { describe, expect, test } from "bun:test";
import {
  ArtifactWriteFailure,
  BlockedWriteFailure,
  GenerationFailure,
  InvalidConfigurationFailure,
  MissingActiveNoteFailure,
} from "@urban/provenance-engine";
import { describePanelGenerationError } from "./panelFailure";

describe("panel failure copy", () => {
  test("renders missing-note failures with a note-specific title", () => {
    expect(
      describePanelGenerationError(
        new MissingActiveNoteFailure({
          message: "Open a markdown note before generating a response.",
        }),
      ),
    ).toEqual({
      title: "No active note",
      message: "Open a markdown note before generating a response.",
    });
  });

  test("renders invalid-configuration failures with a settings-specific title", () => {
    expect(
      describePanelGenerationError(
        new InvalidConfigurationFailure({
          message: "Pi mode requires a Pi API key in plugin settings.",
        }),
      ),
    ).toEqual({
      title: "Invalid settings",
      message: "Pi mode requires a Pi API key in plugin settings.",
    });
  });

  test("renders generation failures with a generation-specific title", () => {
    expect(
      describePanelGenerationError(
        new GenerationFailure({
          message: "Pi API request failed with status 502.",
        }),
      ),
    ).toEqual({
      title: "Generation failed",
      message: "Pi API request failed with status 502.",
    });
  });

  test("renders blocked writes with a write-boundary title", () => {
    expect(
      describePanelGenerationError(
        new BlockedWriteFailure({
          message: "Blocked artifact save outside the configured output path: /tmp/outside.md",
        }),
      ),
    ).toEqual({
      title: "Blocked write",
      message: "Blocked artifact save outside the configured output path: /tmp/outside.md",
    });
  });

  test("renders artifact write failures with a save-specific title", () => {
    expect(
      describePanelGenerationError(
        new ArtifactWriteFailure({
          message: "EACCES: permission denied",
        }),
      ),
    ).toEqual({
      title: "Save failed",
      message: "EACCES: permission denied",
    });
  });
});
