import { Plugin } from "obsidian";
import { registerOpenPanelCommand } from "./commands/openPanel";
import {
  makePluginRuntime,
  type PanelGenerationResult,
  type PanelSaveResult,
  type PluginRuntime,
} from "./services/runtime";
import { SettingTab } from "./settings";
import { DEFAULT_SETTINGS, type PersistedSettings } from "./config";
import { VIEW_TYPE, PanelView } from "./ui/PanelView";

export default class ProvenancePlugin extends Plugin {
  settings: PersistedSettings = DEFAULT_SETTINGS;
  runtime: PluginRuntime | null = null;

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };

    this.registerView(VIEW_TYPE, (leaf) => new PanelView(leaf, this));
    this.addSettingTab(new SettingTab(this.app, this));

    registerOpenPanelCommand(this);
    this.addRibbonIcon("bot-message-square", "Open Provenance", async () => {
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
      if (leaves.length > 0) {
        await this.app.workspace.revealLeaf(leaves[0]);
        return;
      }

      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf === null) {
        return;
      }

      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      await this.app.workspace.revealLeaf(leaf);
    });

    this.runtime = makePluginRuntime({ plugin: this, settings: this.settings });
    this.register(() => this.runtime?.dispose());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async generatePanelResponse(prompt: string): Promise<PanelGenerationResult> {
    if (this.runtime === null) {
      throw new Error("Plugin runtime is not available.");
    }

    return this.runtime.generatePanelResponse(prompt);
  }

  async saveGeneratedResponse(response: string): Promise<PanelSaveResult> {
    if (this.runtime === null) {
      throw new Error("Plugin runtime is not available.");
    }

    return this.runtime.saveGeneratedResponse(response);
  }
}
