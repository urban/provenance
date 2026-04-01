import { IconName, ItemView, WorkspaceLeaf } from "obsidian";
import { type FormEvent, StrictMode, useState, useSyncExternalStore } from "react";
import { Root, createRoot } from "react-dom/client";
import type { PluginAppAccess } from "../main";
import type { PanelGenerationResult } from "../services/runtime";

export const VIEW_TYPE = "provenance-view";

type SaveState =
  | { readonly tag: "idle" }
  | { readonly tag: "saving" }
  | { readonly tag: "info"; readonly message: string }
  | { readonly tag: "error"; readonly message: string };

type GenerationState =
  | { readonly tag: "idle" }
  | { readonly tag: "loading" }
  | { readonly tag: "error"; readonly message: string }
  | {
      readonly tag: "success";
      readonly response: PanelGenerationResult;
      readonly save: SaveState;
    };

const PanelScreen = ({ appAccess }: { readonly appAccess: PluginAppAccess }) => {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GenerationState>({ tag: "idle" });
  const settings = useSyncExternalStore(
    appAccess.subscribeSettings,
    appAccess.getSettings,
    appAccess.getSettings,
  );

  const submitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      setState({ tag: "error", message: "Enter a prompt before generating a response." });
      return;
    }

    setState({ tag: "loading" });

    try {
      const response = await appAccess.generatePanelResponse(trimmedPrompt);
      setState({
        tag: "success",
        response,
        save: { tag: "idle" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      setState({ tag: "error", message });
    }
  };

  const saveResponse = async () => {
    if (state.tag !== "success") {
      return;
    }

    setState({
      tag: "success",
      response: state.response,
      save: { tag: "saving" },
    });

    try {
      const result = await appAccess.saveGeneratedResponse(state.response.content);
      setState({
        tag: "success",
        response: state.response,
        save: { tag: "info", message: result.message },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      setState({
        tag: "success",
        response: state.response,
        save: { tag: "error", message },
      });
    }
  };

  const response = state.tag === "success" ? state.response.content : null;
  const saveDisabled = state.tag !== "success" || state.save.tag === "saving";

  return (
    <div className="provenance-panel">
      <div className="provenance-panel__header">
        <h3>Provenance</h3>
        <p>Ask a question about the active note and review the generated response before saving.</p>
      </div>

      <form className="provenance-panel__form" onSubmit={submitPrompt}>
        <label className="provenance-panel__field">
          <span>Prompt</span>
          <textarea
            className="provenance-panel__textarea"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Summarize the current note and suggest next research questions."
            rows={6}
            value={prompt}
          />
        </label>

        <div className="provenance-panel__actions">
          <button disabled={state.tag === "loading"} type="submit">
            {state.tag === "loading" ? "Generating..." : "Generate response"}
          </button>
          <button disabled={saveDisabled} onClick={saveResponse} type="button">
            {state.tag === "success" && state.save.tag === "saving" ? "Saving..." : "Save artifact"}
          </button>
        </div>
      </form>

      <div className="provenance-panel__meta">
        <span>{`Mode: ${settings.llmMode}`}</span>
        <span>{`Output path: ${settings.llmOutputPath}`}</span>
      </div>

      {state.tag === "loading" ? (
        <div className="provenance-panel__status" data-state="loading">
          Submitting prompt to the generation flow...
        </div>
      ) : null}

      {state.tag === "error" ? (
        <div className="provenance-panel__status" data-state="error">
          {state.message}
        </div>
      ) : null}

      <div className="provenance-panel__response">
        <div className="provenance-panel__response-header">Response</div>
        {response === null ? (
          <p className="provenance-panel__placeholder">
            No response yet. Submit a prompt to start the workflow.
          </p>
        ) : (
          <pre className="provenance-panel__response-body">{response}</pre>
        )}
      </div>

      {state.tag === "success" && state.save.tag === "info" ? (
        <div className="provenance-panel__status" data-state="info">
          {state.save.message}
        </div>
      ) : null}

      {state.tag === "success" && state.save.tag === "error" ? (
        <div className="provenance-panel__status" data-state="error">
          {state.save.message}
        </div>
      ) : null}
    </div>
  );
};

export class PanelView extends ItemView {
  icon: IconName = "bot-message-square";
  root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly appAccess: PluginAppAccess,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Provenance";
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.root = createRoot(this.contentEl);
    this.root.render(
      <StrictMode>
        <PanelScreen appAccess={this.appAccess} />
      </StrictMode>,
    );
  }

  async onClose() {
    this.root?.unmount();
  }
}
