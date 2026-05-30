import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";

import type { Scene, StickerNode } from "@/lib/scene/types";

/**
 * The scene graph store. `order` (back → front) is the single source of truth
 * for stacking; each node's `z` is kept equal to its index in `order` via
 * `syncZ`, so serialized scenes stay self-consistent and rendering can use
 * either. All updates are immutable.
 *
 * Wrapped with `temporal` (zundo) for undo/redo and `persist` for localStorage
 * autosave. The temporal history tracks only {nodes, order}, never the actions.
 */

const PERSIST_KEY = "zineos-scene-v1";
const HISTORY_LIMIT = 80;

/** Per-node fields needed to add a sticker; the store fills in id/x/y/z. */
export interface AddStickerInput {
  readonly giphyId: string;
  readonly src: string;
  readonly baseWidth: number;
  readonly baseHeight: number;
  readonly title: string;
  /** Optional explicit placement; defaults to canvas-ish center with jitter. */
  readonly x?: number;
  readonly y?: number;
  /** Optional initial scale; defaults to fitting baseWidth to a sane size. */
  readonly scale?: number;
}

export type TransformPatch = Partial<
  Pick<StickerNode, "x" | "y" | "scale" | "rotation">
>;

export interface SceneState {
  nodes: Record<string, StickerNode>;
  order: string[];

  add: (input: AddStickerInput) => string;
  remove: (id: string) => void;
  updateTransform: (id: string, patch: TransformPatch) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  reorder: (id: string, toIndex: number) => void;
  duplicate: (id: string) => string | null;
  clear: () => void;
  loadScene: (scene: Scene) => void;
}

const DEFAULT_TARGET_WIDTH = 180; // px a freshly added sticker aims for
const DUPLICATE_OFFSET = 24; // px offset for duplicated nodes

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `node_${Math.floor(performance.now())}_${globalThis.history?.length ?? 0}`;
}

/** Return a new nodes record with each node's `z` set to its index in `order`. */
function syncZ(
  nodes: Record<string, StickerNode>,
  order: readonly string[],
): Record<string, StickerNode> {
  const next: Record<string, StickerNode> = {};
  order.forEach((id, index) => {
    const node = nodes[id];
    if (node) next[id] = node.z === index ? node : { ...node, z: index };
  });
  return next;
}

export const useSceneStore = create<SceneState>()(
  persist(
    temporal(
      (set, get) => ({
        nodes: {},
        order: [],

        add: (input) => {
          const id = makeId();
          const scale =
            input.scale ??
            (input.baseWidth > 0 ? DEFAULT_TARGET_WIDTH / input.baseWidth : 1);

          const node: StickerNode = {
            id,
            giphyId: input.giphyId,
            src: input.src,
            baseWidth: input.baseWidth,
            baseHeight: input.baseHeight,
            x: input.x ?? 0,
            y: input.y ?? 0,
            scale,
            rotation: 0,
            z: get().order.length,
            title: input.title,
          };

          set((state) => {
            const order = [...state.order, id];
            const nodes = syncZ({ ...state.nodes, [id]: node }, order);
            return { nodes, order };
          });
          return id;
        },

        remove: (id) => {
          set((state) => {
            if (!state.nodes[id]) return state;
            const rest = { ...state.nodes };
            delete rest[id];
            const order = state.order.filter((nid) => nid !== id);
            return { nodes: syncZ(rest, order), order };
          });
        },

        updateTransform: (id, patch) => {
          set((state) => {
            const node = state.nodes[id];
            if (!node) return state;
            return {
              nodes: { ...state.nodes, [id]: { ...node, ...patch } },
            };
          });
        },

        bringToFront: (id) => {
          set((state) => {
            if (!state.nodes[id]) return state;
            const order = [...state.order.filter((nid) => nid !== id), id];
            return { nodes: syncZ(state.nodes, order), order };
          });
        },

        sendToBack: (id) => {
          set((state) => {
            if (!state.nodes[id]) return state;
            const order = [id, ...state.order.filter((nid) => nid !== id)];
            return { nodes: syncZ(state.nodes, order), order };
          });
        },

        reorder: (id, toIndex) => {
          set((state) => {
            const from = state.order.indexOf(id);
            if (from === -1) return state;
            const clampedTo = Math.max(
              0,
              Math.min(toIndex, state.order.length - 1),
            );
            if (from === clampedTo) return state;
            const order = [...state.order];
            const [moved] = order.splice(from, 1);
            if (moved === undefined) return state;
            order.splice(clampedTo, 0, moved);
            return { nodes: syncZ(state.nodes, order), order };
          });
        },

        duplicate: (id) => {
          const source = get().nodes[id];
          if (!source) return null;
          const newId = makeId();
          set((state) => {
            const clone: StickerNode = {
              ...source,
              id: newId,
              x: source.x + DUPLICATE_OFFSET,
              y: source.y + DUPLICATE_OFFSET,
              z: state.order.length,
            };
            const order = [...state.order, newId];
            const nodes = syncZ({ ...state.nodes, [newId]: clone }, order);
            return { nodes, order };
          });
          return newId;
        },

        clear: () => set({ nodes: {}, order: [] }),

        loadScene: (scene) => {
          const order = [...scene.order];
          set({ nodes: syncZ(scene.nodes, order), order });
        },
      }),
      {
        limit: HISTORY_LIMIT,
        // Track only the scene data in history, not the action functions.
        partialize: (state): Scene => ({
          nodes: state.nodes,
          order: state.order,
        }),
        equality: (a, b) => a.nodes === b.nodes && a.order === b.order,
      },
    ),
    {
      name: PERSIST_KEY,
      partialize: (state) => ({ nodes: state.nodes, order: state.order }),
      // Rehydrate explicitly after mount (Phase 6) to avoid SSR mismatch.
      skipHydration: true,
    },
  ),
);

/** Read the current scene as a plain serializable object. */
export function getSceneSnapshot(): Scene {
  const { nodes, order } = useSceneStore.getState();
  return { nodes, order };
}
