import { IconName, ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import type ProvenancePlugin from "../main";

export const VIEW_TYPE = "provenance-view";

export class PanelView extends ItemView {
  icon: IconName = "bot-message-square";
  root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: ProvenancePlugin,
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
    this.root = createRoot(this.contentEl);
    this.root.render(
      <StrictMode>
        <h3>Provenance</h3>
        <p>This panel will host note-aware chat and artifact generation in a later iteration.</p>
        <p>{`Mode: ${this.plugin.settings.llmMode}, Output path: ${this.plugin.settings.llmOutputPath}`}</p>
      </StrictMode>,
    );
  }

  async onClose() {
    this.root?.unmount();
  }
}
