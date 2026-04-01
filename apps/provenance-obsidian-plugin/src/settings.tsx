import { App, PluginSettingTab } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import type ProvenancePlugin from "./main";
import { SettingsView } from "./ui/SettingsView";

export class SettingTab extends PluginSettingTab {
  root: Root | null = null;

  constructor(
    app: App,
    private readonly plugin: ProvenancePlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl, plugin } = this;
    containerEl.empty();

    this.root = createRoot(containerEl.createDiv());
    this.root.render(
      <StrictMode>
        <SettingsView plugin={plugin} />
      </StrictMode>,
    );
  }
}
