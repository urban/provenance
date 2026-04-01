import type ProvenancePlugin from "../main";
import { VIEW_TYPE } from "../ui/PanelView";

export const registerOpenPanelCommand = (plugin: ProvenancePlugin): void => {
  plugin.addCommand({
    id: "open-provenance-panel",
    name: "Open Provenance panel",
    callback: async () => {
      const leaf = plugin.app.workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      await plugin.app.workspace.revealLeaf(leaf);
    },
  });
};
