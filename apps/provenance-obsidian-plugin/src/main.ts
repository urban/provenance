import { Plugin } from "obsidian";
import type { ArtifactDraft } from "@urban/provenance-shared";
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
  readonly subscribeSettings: (onStoreChange: () => void) => () => void;
  readonly generatePanelResponse: (prompt: string) => Promise<PanelGenerationResult>;
  readonly saveGeneratedResponse: (draft: ArtifactDraft) => Promise<PanelSaveResult>;
}

export default class ProvenancePlugin extends Plugin {
  settings: PersistedSettings = DEFAULT_SETTINGS;
  runtime: PluginRuntime | null = null;
  private readonly settingsListeners = new Set<() => void>();
  readonly appAccess: PluginAppAccess = {
    openPanel: () => this.openPanel(),
    getSettings: () => this.settings,
    subscribeSettings: (onStoreChange) => this.subscribeSettings(onStoreChange),
    generatePanelResponse: (prompt) => this.runGeneratePanelResponse(prompt),
    saveGeneratedResponse: (draft) => this.runSaveGeneratedResponse(draft),
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

  async updateSettings(settings: PersistedSettings): Promise<void> {
    this.settings = settings;
    await this.saveData(this.settings);
    this.rebuildRuntime();
    this.notifySettingsChanged();
  }

  private createRuntime(): PluginRuntime {
    return makePluginRuntime({ plugin: this, settings: this.settings });
  }

  private rebuildRuntime(): void {
    this.disposeRuntime();
    this.runtime = this.createRuntime();
  }

  private disposeRuntime(): void {
    this.runtime?.dispose();
    this.runtime = null;
  }

  private subscribeSettings(onStoreChange: () => void): () => void {
    this.settingsListeners.add(onStoreChange);

    return () => {
      this.settingsListeners.delete(onStoreChange);
    };
  }

  private notifySettingsChanged(): void {
    for (const listener of this.settingsListeners) {
      listener();
    }
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

  private async runSaveGeneratedResponse(draft: ArtifactDraft): Promise<PanelSaveResult> {
    return this.getRuntime().saveGeneratedResponse(draft);
  }
}
