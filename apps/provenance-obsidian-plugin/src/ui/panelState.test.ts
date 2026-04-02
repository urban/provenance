import { describe, expect, test } from "bun:test";
import type { PanelGenerationResult } from "../services/runtime";
import { beginSave, completeSave, failSave, type GenerationState } from "./panelState";

const response: PanelGenerationResult = {
  content: "Generated research response.",
  artifactDraft: {
    title: "Example Research",
    body: "Generated research response.",
    sourceNotePath: "notes/example.md",
    generatedAt: "2026-04-02T02:15:00.000Z",
    generationContext: {
      prompt: "Summarize the current note.",
      model: "mock-research-v1",
    },
  },
};

const successState: GenerationState = {
  tag: "success",
  response,
  save: { tag: "idle" },
};

describe("panel save state", () => {
  test("marks a successful response as saving without dropping the generated response", () => {
    expect(beginSave(successState)).toEqual({
      tag: "success",
      response,
      save: { tag: "saving" },
    });
  });

  test("stores a save success message against the same generated response", () => {
    expect(
      completeSave(successState, "Saved artifact to .provenance/example-research.md."),
    ).toEqual({
      tag: "success",
      response,
      save: { tag: "info", message: "Saved artifact to .provenance/example-research.md." },
    });
  });

  test("keeps the generated response available when a save fails", () => {
    expect(
      failSave(successState, {
        title: "Save failed",
        message: "EACCES: permission denied",
      }),
    ).toEqual({
      tag: "success",
      response,
      save: {
        tag: "error",
        failure: {
          title: "Save failed",
          message: "EACCES: permission denied",
        },
      },
    });
  });
});
