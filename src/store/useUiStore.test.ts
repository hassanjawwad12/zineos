import { beforeEach, describe, expect, it } from "vitest";

import { useUiStore } from "./useUiStore";

function reset() {
  useUiStore.setState({ selectedId: null, drawerOpen: false, tool: "select" });
}

describe("useUiStore", () => {
  beforeEach(reset);

  it("selects and clears the active node", () => {
    useUiStore.getState().select("abc");
    expect(useUiStore.getState().selectedId).toBe("abc");
    useUiStore.getState().select(null);
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it("sets drawer open state explicitly", () => {
    useUiStore.getState().setDrawerOpen(true);
    expect(useUiStore.getState().drawerOpen).toBe(true);
  });

  it("toggles the drawer", () => {
    useUiStore.getState().toggleDrawer();
    expect(useUiStore.getState().drawerOpen).toBe(true);
    useUiStore.getState().toggleDrawer();
    expect(useUiStore.getState().drawerOpen).toBe(false);
  });

  it("sets the active tool", () => {
    useUiStore.getState().setTool("select");
    expect(useUiStore.getState().tool).toBe("select");
  });
});
