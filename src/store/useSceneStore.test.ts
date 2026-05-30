import { beforeEach, describe, expect, it } from "vitest";

import { getSceneSnapshot, useSceneStore } from "./useSceneStore";

const baseInput = {
  giphyId: "g1",
  src: "/x",
  baseWidth: 200,
  baseHeight: 100,
  title: "t",
};

function reset() {
  useSceneStore.setState({ nodes: {}, order: [] });
  useSceneStore.temporal.getState().clear();
}

describe("useSceneStore", () => {
  beforeEach(reset);

  it("adds a node and appends it to order", () => {
    const id = useSceneStore.getState().add(baseInput);
    const { nodes, order } = useSceneStore.getState();
    expect(order).toEqual([id]);
    expect(nodes[id]?.giphyId).toBe("g1");
  });

  it("defaults scale to fit the target width", () => {
    const id = useSceneStore.getState().add(baseInput); // base 200 → target 180
    expect(useSceneStore.getState().nodes[id]?.scaleX).toBeCloseTo(0.9, 6);
    expect(useSceneStore.getState().nodes[id]?.scaleY).toBeCloseTo(0.9, 6);
  });

  it("does not mutate the previous nodes object (immutability)", () => {
    const id1 = useSceneStore.getState().add(baseInput);
    const before = useSceneStore.getState().nodes;
    useSceneStore.getState().add(baseInput);
    const after = useSceneStore.getState().nodes;
    expect(after).not.toBe(before);
    expect(before[id1]).toBe(after[id1]); // unchanged node kept by reference
  });

  it("keeps z in sync with order index", () => {
    const a = useSceneStore.getState().add(baseInput);
    const b = useSceneStore.getState().add(baseInput);
    expect(useSceneStore.getState().nodes[a]?.z).toBe(0);
    expect(useSceneStore.getState().nodes[b]?.z).toBe(1);
  });

  it("bringToFront moves a node to the end and renumbers z", () => {
    const a = useSceneStore.getState().add(baseInput);
    const b = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().bringToFront(a);
    const { order, nodes } = useSceneStore.getState();
    expect(order).toEqual([b, a]);
    expect(nodes[a]?.z).toBe(1);
    expect(nodes[b]?.z).toBe(0);
  });

  it("sendToBack moves a node to the front of the stack", () => {
    const a = useSceneStore.getState().add(baseInput);
    const b = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().sendToBack(b);
    expect(useSceneStore.getState().order).toEqual([b, a]);
  });

  it("reorder moves a node to a clamped index", () => {
    const a = useSceneStore.getState().add(baseInput);
    const b = useSceneStore.getState().add(baseInput);
    const c = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().reorder(a, 99); // clamp to last
    expect(useSceneStore.getState().order).toEqual([b, c, a]);
  });

  it("remove deletes the node and compacts order", () => {
    const a = useSceneStore.getState().add(baseInput);
    const b = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().remove(a);
    const { nodes, order } = useSceneStore.getState();
    expect(order).toEqual([b]);
    expect(nodes[a]).toBeUndefined();
    expect(nodes[b]?.z).toBe(0);
  });

  it("duplicate clones with an offset and a new id", () => {
    const a = useSceneStore.getState().add(baseInput);
    const dup = useSceneStore.getState().duplicate(a);
    expect(dup).not.toBeNull();
    const { nodes } = useSceneStore.getState();
    const original = nodes[a];
    const clone = dup ? nodes[dup] : undefined;
    expect(clone?.giphyId).toBe(original?.giphyId);
    expect(clone?.x).toBe((original?.x ?? 0) + 24);
  });

  it("updateTransform patches only the targeted node", () => {
    const a = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().updateTransform(a, { rotation: 1.2, scaleX: 2 });
    const n = useSceneStore.getState().nodes[a];
    expect(n?.rotation).toBe(1.2);
    expect(n?.scaleX).toBe(2);
  });

  it("supports undo/redo through the temporal store", () => {
    const a = useSceneStore.getState().add(baseInput);
    useSceneStore.getState().updateTransform(a, { x: 500 });
    expect(useSceneStore.getState().nodes[a]?.x).toBe(500);

    useSceneStore.temporal.getState().undo();
    expect(useSceneStore.getState().nodes[a]?.x).toBe(0);

    useSceneStore.temporal.getState().redo();
    expect(useSceneStore.getState().nodes[a]?.x).toBe(500);
  });

  it("getSceneSnapshot returns the live nodes + order", () => {
    const a = useSceneStore.getState().add(baseInput);
    const snap = getSceneSnapshot();
    expect(snap.order).toEqual([a]);
    expect(snap.nodes[a]).toBeDefined();
  });
});
