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

export interface PluginAppAccess {
  readonly openPanel: () => Promise<void>;
  readonly getSettings: () => PersistedSettings;
  readonly generatePanelResponse: (prompt: string) => Promise<PanelGenerationResult>;
  readonly saveGeneratedResponse: (response: string) => Promise<PanelSaveResult>;
}

export default class ProvenancePlugin extends Plugin {
  settings: PersistedSettings = DEFAULT_SETTINGS;
  runtime: PluginRuntime | null = null;
  readonly appAccess: PluginAppAccess = {
    openPanel: () => this.openPanel(),
    getSettings: () => this.settings,
    generatePanelResponse: (prompt) => this.runGeneratePanelResponse(prompt),
    saveGeneratedResponse: (response) => this.runSaveGeneratedResponse(response),
  };

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
    this.runtime = this.createRuntime();

    this.registerView(VIEW_TYPE, (leaf) => new PanelView(leaf, this.appAccess));
    this.addSettingTab(new SettingTab(this.app, this));

    registerOpenPanelCommand(this, this.appAccess);
    this.addRibbonIcon("bot-message-square", "Open Provenance", () => this.appAccess.openPanel());
    this.register(() => this.disposeRuntime());
  }

  onunload(): void {
    this.disposeRuntime();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private createRuntime(): PluginRuntime {
    return makePluginRuntime({ plugin: this, settings: this.settings });
  }

  private disposeRuntime(): void {
    this.runtime?.dispose();
    this.runtime = null;
  }

  private getRuntime(): PluginRuntime {
    if (this.runtime !== null) {
      return this.runtime;
    }

    throw new Error("Plugin runtime is not available.");
  }

  private async openPanel(): Promise<void> {
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
  }

  private async runGeneratePanelResponse(prompt: string): Promise<PanelGenerationResult> {
    return this.getRuntime().generatePanelResponse(prompt);
  }

  private async runSaveGeneratedResponse(response: string): Promise<PanelSaveResult> {
    return this.getRuntime().saveGeneratedResponse(response);
  }
}
