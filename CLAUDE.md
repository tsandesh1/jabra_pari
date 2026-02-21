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
{
  id, name, gender,
  birthDate, deathDate, marriageDate,       // ISO date strings (YYYY-MM-DD) or null
  photoUrl,                                  // base64 data URL or null
  socialLinks: { facebook?, twitter?, instagram?, linkedin? },
  permanentAddress, currentAddress,          // strings or null
  education: [{ institution, degree, year }],
  children: [...]
}
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
- **Pan/zoom**: Manual mouse drag + progressive multiplicative wheel zoom with CSS `transform: scale() translate()` on `.tree-canvas`. Zoom controls (in/out/reset) in bottom-right corner.
- **Photos**: Stored as base64 data URLs in the node data (max 2MB). Displayed as circular thumbnails on node cards.
- **Social links**: Optional URLs for Facebook, X/Twitter, Instagram, LinkedIn. Shown as clickable icon badges on node cards.
- **Profile modal**: Clicking a node name/photo opens a read-only profile popup with all details. Edit button in profile opens the edit form.
- **Addresses**: Optional permanent and current address text fields.
- **Education**: Array of education entries (institution, degree, year).
- **Zero external dependencies** beyond React/ReactDOM.

### Conventions

- Components are function components with hooks
- One component per file in `src/components/`
- Utility functions are pure and testable in isolation
- Gender color coding: blue (male), pink (female), green (other)
- IDs generated via `crypto.randomUUID()`
