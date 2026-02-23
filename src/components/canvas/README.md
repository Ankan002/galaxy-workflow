# Canvas & Node Registry

This document describes how to use the workflow canvas and the **Node Registry** to build and extend the React Flow–based workflow builder.

---

## Overview

- **WorkflowCanvas** – React Flow canvas with built-in node types from the registry, controls, minimap, and workflow edges.
- **NODE_REGISTRY** – Map of `NodeType` → `NodeDefinition` (metadata + React component) for every registered node.
- **nodeTypes** – React Flow `NodeTypes` object (node type string → component), used by the canvas to render nodes.
- **BaseNode** – Shared node shell: title, description, dynamic input/output handles, status badge, and optional body (children).

All registry nodes use **typed config** stored in `node.data.config`, **dynamic UI** (controls update config via `useUpdateNodeConfig`), and **input/output handles** defined on the node definition.

---

## Using the Canvas

### Basic setup

```tsx
import { WorkflowCanvas, useWorkflowCanvas } from "@/components/canvas";

function MyWorkflowScreen() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useWorkflowCanvas();

  return (
    <div className="h-screen w-full">
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </div>
  );
}
```

The canvas already uses the registry’s `nodeTypes`, so any node with `type` set to a `NodeType` (e.g. `"TEXT"`, `"RUN_LLM"`) will render the correct component.

### Adding a node to the graph

Use the registry to get `defaultConfig` and build a valid node:

```tsx
import { NODE_REGISTRY, NodeType } from "@/components/canvas";

// Get the definition for a node type
const definition = NODE_REGISTRY[NodeType.TEXT];

// Create a new node with default config and position
const newNode = {
  id: "text-1",
  type: NodeType.TEXT,
  position: { x: 100, y: 100 },
  data: {
    type: NodeType.TEXT,
    config: { ...definition.defaultConfig },
    // optional: status: "idle" | "running" | "completed" | "failed"
  },
};

addNode(newNode);
```

For any type:

```tsx
function createNode(type: NodeType, id: string, position: { x: number; y: number }) {
  const def = NODE_REGISTRY[type];
  return {
    id,
    type,
    position,
    data: {
      type,
      config: { ...def.defaultConfig },
    },
  };
}
```

---

## Using the Registry

### Imports

From the canvas package:

```ts
import {
  NODE_REGISTRY,
  nodeTypes,
  NodeType,
  type NodeDefinition,
  type NodeStatus,
} from "@/components/canvas";
```

From the registry only (e.g. inside `components/canvas`):

```ts
import {
  NODE_REGISTRY,
  nodeTypes,
  NodeType,
  type NodeDefinition,
  type NodeStatus,
  type InputHandleDef,
  type OutputHandleDef,
} from "@/components/canvas/nodes/registry";
```

### NODE_REGISTRY

`NODE_REGISTRY` is a `Record<NodeType, NodeDefinition>`.

- **Look up a definition:** `NODE_REGISTRY[NodeType.TEXT]`
- **Metadata:** `label`, `description`, `provider`, `inputHandles`, `outputHandles`, `defaultConfig`
- **Component:** `definition.Component` (the React component for that node type)

Example: building a palette or list of addable nodes:

```tsx
const nodeTypesList = Object.entries(NODE_REGISTRY).map(([type, def]) => ({
  type: type as NodeType,
  label: def.label,
  description: def.description,
  defaultConfig: def.defaultConfig,
}));
```

### nodeTypes

`nodeTypes` is the object passed to React Flow as `nodeTypes`:

- Keys: `NodeType` enum values (e.g. `"TEXT"`, `"RUN_LLM"`).
- Values: React components (e.g. `TextNode`, `RunLlmNode`).

`WorkflowCanvas` already merges `nodeTypes` with the legacy `base` type and any `extraNodeTypes` you pass. You only need to pass `extraNodeTypes` if you add custom node types outside the registry.

### Handle IDs and connections

- **Input handles** use `InputHandleDef.key` as the handle id (e.g. `systemPrompt`, `video_url`).
- **Output handles** use `OutputHandleDef.key` (e.g. `value`, `url`, `output`).
- When creating edges, set `sourceHandle` and `targetHandle` to these keys so connections match the node’s ports.

Example: connect a Text node’s output to Run LLM’s system prompt:

- Source: `sourceHandle: "value"` (Text node’s single output).
- Target: `targetHandle: "systemPrompt"` (Run LLM input).

---

## Adding a New Node Type

1. **Add the enum value** in `nodes/registry/types.ts`:

   ```ts
   export enum NodeType {
     // ...
     MY_NODE = "MY_NODE",
   }
   ```

2. **Create the node component** in `nodes/library/my-node.tsx`:
   - Define `MyNodeConfig` and `MY_NODE_DEFINITION` (with `type`, `label`, `description`, `provider`, `inputHandles`, `outputHandles`, `defaultConfig`; omit `Component`).
   - Export a component that uses `BaseNode` and, if needed, `useUpdateNodeConfig(id)` for dynamic fields.
   - Use `nodrag nopan` on interactive controls so they don’t trigger canvas drag/pan.

3. **Export from the library** in `nodes/library/index.ts`:

   ```ts
   export { MyNode, MY_NODE_DEFINITION, type MyNodeConfig } from "./my-node";
   ```

4. **Register the node** in `nodes/registry/index.ts`:
   - Import `MyNode` and `MY_NODE_DEFINITION`.
   - Add an entry to `NODE_REGISTRY`: `[NodeType.MY_NODE]: { ...MY_NODE_DEFINITION, Component: MyNode }`.
   - Add an entry to `nodeTypes`: `[NodeType.MY_NODE]: MyNode`.

After that, you can create nodes with `type: NodeType.MY_NODE` and `data.config` from `NODE_REGISTRY[NodeType.MY_NODE].defaultConfig`.

---

## Types Reference

| Type | Description |
|------|-------------|
| `NodeType` | Enum of all registered node types (TEXT, IMAGE_UPLOAD, RUN_LLM, etc.). |
| `NodeDefinition<TConfig>` | `type`, `label`, `description`, `provider`, `inputHandles`, `outputHandles`, `defaultConfig`, `Component`. |
| `NodeStatus` | `"idle"` \| `"running"` \| `"completed"` \| `"failed"`. |
| `InputHandleDef` | `key`, `type` (HandleDataType), `required?`. |
| `OutputHandleDef` | `key`, `type` (HandleDataType). |
| `NodeProvider` | `"INTERNAL"` \| `"TRANSLOADIT"` \| `"TRIGGER_DEV"`. |
| `HandleDataType` | `"string"` \| `"number"` \| `"image"` \| `"video"` \| `"json"` \| etc. |

---

## File Structure

```
src/components/canvas/
├── README.md                 # This doc
├── index.ts                  # Public exports (WorkflowCanvas, NODE_REGISTRY, nodeTypes, types)
├── workflow-canvas.tsx       # React Flow canvas (uses nodeTypes from registry)
├── hook.ts                   # useWorkflowCanvas (nodes/edges state, addNode, onConnect, …)
├── edges/
│   └── base-edge.tsx        # WorkflowEdge
└── nodes/
    ├── base-node.tsx        # Shared node UI (handles, title, status, children)
    ├── index.ts             # Re-exports nodes + registry
    ├── use-update-node-config.ts   # Hook to update node.data.config from UI
    ├── registry/
    │   ├── types.ts         # NodeType, NodeDefinition, handles, BaseNodeProps, …
    │   └── index.ts         # NODE_REGISTRY, nodeTypes, type exports
    └── library/             # One file per node type
        ├── index.ts
        ├── text-node.tsx
        ├── image-upload-node.tsx
        ├── video-upload-node.tsx
        ├── run-llm-node.tsx
        ├── crop-image-node.tsx
        ├── extract-video-node.tsx
        └── extract-video-frame-node.tsx
```

---

## Summary

- Use **WorkflowCanvas** with **useWorkflowCanvas** for the graph; the canvas already uses the registry’s **nodeTypes**.
- Use **NODE_REGISTRY[NodeType.X]** to get metadata and **defaultConfig** when creating nodes.
- Add new node types by extending **NodeType**, adding a component in **library/**, and registering it in **registry/index.ts**.
