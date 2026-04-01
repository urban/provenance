import { Plugin } from "obsidian";
import { registerOpenPanelCommand } from "./commands/openPanel";
import { makePluginRuntime } from "./services/runtime";
import { SettingTab } from "./settings";
import { DEFAULT_SETTINGS, type PersistedSettings } from "./config";
import { VIEW_TYPE, PanelView } from "./ui/PanelView";

export default class ProvenancePlugin extends Plugin {
  settings: PersistedSettings = DEFAULT_SETTINGS;

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

    const runtime = makePluginRuntime({ plugin: this, settings: this.settings });
    this.register(() => runtime.dispose());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
