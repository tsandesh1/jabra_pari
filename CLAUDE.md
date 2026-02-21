# Family Tree

Client-side family tree web app built with React + Vite. No backend — data is persisted via JSON file export/import.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build to `dist/`
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

## Architecture

### Data Model

The tree is a single nested object (no flat arrays, no parent pointers). Each node:

```js
{ id, name, birthYear, deathYear, gender, children: [...] }
```

The entire app state IS the JSON — export/import is trivial.

### Project Structure

```
src/
├── main.jsx                # Entry point
├── App.jsx                 # Root component, holds tree state (useState)
├── App.css                 # All styles (global, tree layout, modals)
├── components/
│   ├── TreeView.jsx        # Pan/zoom container, renders root TreeNode
│   ├── TreeNode.jsx        # Recursive node card with expand/collapse
│   ├── NodeForm.jsx        # Add/edit modal form
│   ├── Toolbar.jsx         # Top bar: export, import, search, create root
│   ├── SearchBar.jsx       # Search input, highlights matching nodes
│   └── ConfirmDialog.jsx   # Delete confirmation with descendant count
└── utils/
    ├── treeUtils.js        # Immutable tree operations (add, delete, update, find, search)
    └── fileUtils.js        # JSON export (Blob download) / import (FileReader + validation)
```

### Key Patterns

- **Immutable updates**: All tree utility functions return a new tree (deep clone via JSON.parse/JSON.stringify). No mutations.
- **No state library**: Single `useState` in App.jsx holds the tree. Handlers passed down as props.
- **CSS-only tree layout**: Connector lines use `::before`/`::after` pseudo-elements on flex containers. No SVG/canvas libraries.
- **Pan/zoom**: Manual mouse drag + wheel events with CSS `transform: scale() translate()` on `.tree-canvas`.
- **Zero external dependencies** beyond React/ReactDOM.

### Conventions

- Components are function components with hooks
- One component per file in `src/components/`
- Utility functions are pure and testable in isolation
- Gender color coding: blue (male), pink (female), green (other)
- IDs generated via `crypto.randomUUID()`
