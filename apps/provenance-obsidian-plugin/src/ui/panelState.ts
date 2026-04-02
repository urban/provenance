import type { PanelGenerationResult } from "../services/runtime";
import type { PanelFailureCopy } from "./panelFailure";

export type SaveState =
  | { readonly tag: "idle" }
  | { readonly tag: "saving" }
  | { readonly tag: "info"; readonly message: string }
  | { readonly tag: "error"; readonly failure: PanelFailureCopy };

export type GenerationState =
  | { readonly tag: "idle" }
  | { readonly tag: "loading" }
  | { readonly tag: "error"; readonly failure: PanelFailureCopy }
  | {
      readonly tag: "success";
      readonly response: PanelGenerationResult;
      readonly save: SaveState;
    };

export const beginSave = (state: GenerationState): GenerationState => {
  if (state.tag !== "success") {
    return state;
  }

  return {
    tag: "success",
    response: state.response,
    save: { tag: "saving" },
  };
};

export const completeSave = (state: GenerationState, message: string): GenerationState => {
  if (state.tag !== "success") {
    return state;
  }

  return {
    tag: "success",
    response: state.response,
    save: { tag: "info", message },
  };
};

export const failSave = (state: GenerationState, failure: PanelFailureCopy): GenerationState => {
  if (state.tag !== "success") {
    return state;
  }

  return {
    tag: "success",
    response: state.response,
    save: { tag: "error", failure },
  };
};
