# Taskpad — Kanban Task Board

A responsive Kanban board built with **plain HTML, CSS and JavaScript** (no framework).
Manage tasks across **To Do → In Progress → Completed** with drag & drop, search and filters.

**Live demo:** _add your Vercel link here_  |  **Demo video:** _add link here_

## Features
- **Add task:** title, description, priority (Low / Medium / High) and due date
- **Edit / Delete:** edit in a modal; delete with a two-step confirm
- **Move between columns:** drag & drop, or the ← → buttons (works on touch screens too)
- **Search** tasks by title (press `/` to focus the search box)
- **Filter** by priority and by status
- Overdue and due-soon badges, live counters, empty states
- Data is saved in `localStorage`, so it stays after a refresh
- Fully responsive (3 columns on desktop, stacked on mobile) and keyboard friendly

## Component structure
| Part | Role |
|------|------|
| `state` | single source of truth: `{ tasks, filters }` |
| `update(fn)` | the only way to change tasks: run fn → `save()` → `render()` |
| `visibleTasks()` | selector: applies search + priority + status filters |
| `TaskCard(task)` | renders one card (tag, title, description, due badge, actions) |
| `Column(status, tasks)` | renders one column with its header, count and cards |
| `render()` | rebuilds the board and stats from state |
| Modal (`<dialog>`) | shared form for Add and Edit |

## State management
Plain JS, one `state` object. Every action (add, edit, delete, move) goes through `update()`,
which saves to `localStorage` and re-renders. Filters live in `state.filters` and are applied
at render time, so the original task list is never changed by searching or filtering.
Event delegation on the board handles all card buttons and drag & drop with a single listener each.

## Key decisions
- **No framework:** the app is small, and plain JS keeps the logic easy to explain.
- **Event delegation** instead of a listener per card, so re-rendering stays cheap.
- **Native `<dialog>`** for the modal: built-in focus handling and the Esc key.
- **HTML5 drag & drop + move buttons:** drag & drop on desktop, buttons for touch devices.
- **XSS-safe:** all user text is escaped before rendering.

## Run locally
Open `index.html` in a browser (or use the VS Code Live Server extension).

## Deploy
Push to GitHub, then import the repo on [Vercel](https://vercel.com). No build step needed.
