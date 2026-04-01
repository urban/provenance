import type ProvenancePlugin from "../main";

export interface RuntimeOptions {
  plugin: ProvenancePlugin;
  settings: {
    llmOutputPath: string;
    llmMode: "disabled" | "mock" | "pi";
  };
}

export const makePluginRuntime = (_options: RuntimeOptions) => {
  return {
    dispose: () => {
      // reserved for subscriptions, file watchers, and Effect runtime cleanup
    },
  };
};
