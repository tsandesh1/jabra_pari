# Project Context: Family Tree App

## Snapshot
- Project: client-only family tree editor/viewer.
- Stack: React 19 + Vite 7, plain CSS, no backend.
- Data persistence: JSON export/import only.
- Entry point: `src/main.jsx` -> `src/App.jsx`.

## Purpose
The app lets users create and manage a nested family tree, edit person details, search by name, pan/zoom the tree canvas, and export/import the full tree as JSON.

## Current Status
- Core tree CRUD flow is implemented in React components + pure utility helpers.
- UI includes toolbar, empty state, node cards, modal form, confirm delete dialog, search, zoom controls, and animated modal close behavior.
- Build is currently blocked by missing source files imported by existing components (see "Known Gaps").

## Tech + Tooling
- Runtime deps: `react`, `react-dom`.
- Dev deps: Vite + ESLint flat config.
- Scripts (`package.json`):
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`

## Data Model
Tree is a single recursive object (root node + descendants).

Node shape used across code:
- `id: string`
- `name: string`
- `birthDate: string | null` (`YYYY-MM-DD`)
- `deathDate: string | null`
- `marriageDate: string | null`
- `gender: "male" | "female" | "other"`
- `photoUrl: string | null` (base64 data URL)
- `socialLinks: Record<string, string>`
- `permanentAddress: string | null`
- `currentAddress: string | null`
- `education: Array<{ institution, degree, year }>`
- `children: Node[]`

## Architecture Map
- `src/App.jsx`
  - Owns all major UI state (`tree`, modal states, search highlights).
  - Wires handlers for add/edit/delete/search/import.
  - Uses custom `useAnimatedModal` helper for close animations.
- `src/components/Toolbar.jsx`
  - Create root, export JSON, import JSON, and search entry point.
- `src/components/TreeView.jsx`
  - Pan/zoom behavior, fit-to-screen, wheel zoom, zoom control UI.
  - Renders root `TreeNode`.
- `src/components/TreeNode.jsx`
  - Recursive node rendering.
  - Collapse/expand descendants, keyboard navigation, hover tooltip trigger.
  - Actions: add child, edit, delete, open profile.
- `src/components/NodeForm.jsx`
  - Add/edit modal for person details.
  - Optional sections for addresses, education, social links.
  - Photo upload (max 2MB) via `FileReader`.
- `src/components/ConfirmDialog.jsx`
  - Delete confirmation modal.
- `src/utils/treeUtils.js`
  - Core immutable-style operations (`createNode`, `addChild`, `updateNode`, `deleteNode`, `searchByName`, etc.).
  - Uses deep clone with `JSON.parse(JSON.stringify(...))`.
- `src/utils/fileUtils.js`
  - Export to downloaded JSON blob.
  - Import + lightweight structural validation.

## Key Behaviors
- Search highlights matching nodes by name (case-insensitive).
- On search results, first match is scrolled into view.
- Delete shows descendant count before confirm.
- Tree initially auto-fits inside viewport after render.
- Default collapsed depth in `TreeNode` is `depth >= 2`.
- Gender affects card color theme.

## Known Gaps / Risks
1. Missing files referenced by imports:
   - `src/App.jsx` imports `./components/ProfileModal` (file not present).
   - `src/components/TreeNode.jsx` imports `./NodeTooltip` (file not present).
   - Result: app will fail to compile until these components are added or imports removed.
2. `README.md` is still default Vite template and does not document this project.
3. Tooling not installed in current environment:
   - `npm run lint` failed with `eslint: command not found` because dependencies are not installed.
4. JSON validation is minimal (`id`, `name`, `children` only), so malformed optional fields can still enter state.
5. Tree ops deep-clone entire tree on each write; acceptable for small/medium trees, but can become slow for very large trees.

## Suggested Next Steps
1. Add missing `ProfileModal.jsx` and `NodeTooltip.jsx` components (or remove references).
2. Run `npm install`, then run `npm run lint` and `npm run build`.
3. Replace `README.md` with project-specific setup + feature docs.
4. Add tests for `treeUtils` and `fileUtils` (high-value, low-effort coverage).

## Fast Re-Entry Checklist
When resuming work later:
1. `npm install`
2. Fix missing component imports first.
3. Verify with `npm run build` and `npm run lint`.
4. Start app with `npm run dev`.
