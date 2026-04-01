import type ProvenancePlugin from "../main";
import type { PluginAppAccess } from "../main";

export const registerOpenPanelCommand = (
  plugin: ProvenancePlugin,
  appAccess: PluginAppAccess,
): void => {
  plugin.addCommand({
    id: "open-provenance-panel",
    name: "Open Provenance panel",
    callback: () => appAccess.openPanel(),
  });
};
