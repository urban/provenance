import { describe, expect, test } from "bun:test";
import {
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
});
