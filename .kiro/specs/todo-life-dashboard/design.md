# Design Document

## Overview

The To-Do List Life Dashboard is a zero-dependency single-page application delivered as three files: `index.html`, `css/style.css`, and `js/app.js`. It runs entirely in the browser — no build step, no server — and persists all state in `localStorage`.

The UI is divided into four functional cards arranged in a responsive CSS Grid:

1. **Greeting & Clock** — live time/date display with a personalized salutation
2. **Focus Timer** — Pomodoro-style countdown with configurable duration
3. **To-Do List** — task CRUD with sorting and duplicate detection
4. **Quick Links** — user-defined URL shortcuts

A global theme toggle and a custom-name input complete the feature set.

Design goals ranked by priority:

| Priority | Goal |
|---|---|
| 1 | Correctness — all state changes must be consistent with localStorage |
| 2 | Accessibility — keyboard navigable, labelled inputs, sufficient contrast |
| 3 | Simplicity — no abstractions beyond what the requirements demand |
| 4 | Performance — all interactions respond within 100 ms |

---

## Architecture

The application follows a **flat, event-driven module pattern** inside a single script file. There is no virtual DOM, no reactive framework, and no bundler. Each logical section of `app.js` owns its own DOM references, event listeners, and storage interactions.

```
index.html
 └── <script src="js/app.js">
       ├── Storage helpers        (read/write with try/catch)
       ├── Greeting & Clock       (setInterval @ 1 s)
       ├── Focus Timer            (setInterval @ 1 s, state machine)
       ├── To-Do List             (CRUD + sort + render)
       ├── Quick Links            (CRUD + render)
       └── Theme                  (toggle + system-preference init)
```

### Initialization sequence

```
DOMContentLoaded
  │
  ├─ Theme.init()          ← apply stored/system theme before paint
  ├─ Greeting.init()       ← read name from storage, start clock tick
  ├─ Timer.init()          ← read saved duration, render MM:SS
  ├─ TodoList.init()       ← read tasks + sort order, render list
  ├─ QuickLinks.init()     ← read links, render buttons
  └─ CustomName.init()     ← pre-populate name input
```

All `init()` calls happen synchronously inside the `DOMContentLoaded` handler. The clock and timer ticks are the only ongoing async operations.

### Event delegation strategy

The To-Do list and Quick Links sections use **event delegation**: a single listener is attached to the containing `<ul>` element and routes clicks to the correct handler based on `data-*` attributes on the target. This avoids attaching and removing per-item listeners as items are added or deleted.

---

## Components and Interfaces

### Storage Helpers

```js
// Storage helpers
function storageGet(key, defaultValue) { ... }   // JSON.parse with try/catch
function storageSet(key, value) { ... }          // JSON.stringify with try/catch
function storageRemove(key) { ... }              // localStorage.removeItem with try/catch
```

Both functions are the **only** code that touches `localStorage`. Every other section calls these helpers exclusively.

`storageGet` returns `defaultValue` on any failure (key not found, parse error, storage unavailable).  
`storageSet` silently discards the write on any failure; the in-memory state already reflects the change.

No error is propagated to callers; the UI simply operates on defaults. `storageRemove` wraps `localStorage.removeItem` in a try/catch and silently discards any exception.

---

### Greeting & Clock

**DOM targets:**
- `#clock` — live HH:MM:SS text
- `#date-display` — formatted date string
- `#greeting-text` — greeting + optional name

**Behavior:**
- `Greeting.init()` starts a `setInterval` that fires every 1000 ms and calls `Greeting.tick()`.
- `Greeting.tick()` reads `new Date()`, formats the clock and date strings, computes the time-of-day salutation, appends the stored name (capped at 50 chars), and writes to the three DOM elements.
- `Greeting.tick()` is also called immediately on init so the display is populated within one rendering cycle (< 500 ms requirement).

**Greeting ranges:**

| Hour range | Text |
|---|---|
| 05–11 | Good Morning |
| 12–16 | Good Afternoon |
| 17–20 | Good Evening |
| 21–23, 00–04 | Good Night |

---

### Custom Name

**DOM targets:**
- `#name-input` — text input (maxlength=50)
- `#name-form` — wrapping form

**Behavior:**
- On `submit`: trim the value. If non-empty, call `storageSet('name', trimmed)`; if empty, call `storageRemove('name')` (a thin wrapper around `localStorage.removeItem`). Then call `Greeting.tick()` to refresh the salutation immediately.
- On `init`: read stored name, set `input.value`.

---

### Focus Timer

The timer is modeled as a finite state machine with three states:

```
         Start         Stop (pause)
IDLE ──────────► RUNNING ──────────► PAUSED
  ▲               │   ▲                │
  │    Reset      │   │                │ Start
  └───────────────┘   └────────────────┘
  ▲
  │  (auto-transition when seconds reach 0)
  └── RUNNING → IDLE (fires "Time's Up!" side effect)
```

**DOM targets:**
- `#timer-display` — MM:SS text
- `#timer-start` — Start button
- `#timer-stop` — Stop/pause button
- `#timer-reset` — Reset button
- `#timer-duration-input` — minute input (1–120)
- `#timer-duration-save` — save button
- `#timer-message` — inline "Time's Up!" area

**State variables (module-scoped):**
```js
let timerState    = 'IDLE';   // 'IDLE' | 'RUNNING' | 'PAUSED'
let timerSeconds  = 0;        // remaining seconds
let timerInterval = null;     // setInterval handle
```

**Key behaviors:**
- `Start` only acts in IDLE or PAUSED state.
- `Stop` only acts in RUNNING state.
- `Reset` acts in any state; it clears the interval, reads the saved duration, resets `timerSeconds`, and transitions to IDLE.
- The duration input and save button are `disabled` while `timerState === 'RUNNING'`.
- When the user saves a new valid focus duration while `timerState` is `IDLE` or `PAUSED`, the timer display is updated to the new duration in MM:SS and `timerState` is set to `IDLE`.
- Validation on duration save: must be integer, 1–120. Invalid input shows inline message in `#timer-duration-error`.

---

### To-Do List

**Task data shape:**
```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  text:      string,   // trimmed, max 200 chars
  done:      boolean,
  createdAt: number    // Date.now() timestamp
}
```

**DOM targets:**
- `#todo-form` / `#todo-input` — add-task form
- `#todo-error` — inline error display
- `#todo-list` — `<ul>` for task items (event delegation root)
- `#sort-select` — sort order `<select>`

**Render contract:**  
`TodoList.render()` always reads from the in-memory `tasks` array, applies the current sort, and rebuilds the `<ul>` innerHTML. The array is the single source of truth; the DOM is a pure projection of it.

Each rendered `<li>` contains:
- A `<input type="checkbox">` with `data-id`
- A `<span>` with the task text (strikethrough when `done === true`)
- An edit `<button>` with `data-action="edit"` and `data-id`
- A delete `<button>` with `data-action="delete"` and `data-id`

**Edit mode:**  
When edit is activated on a task, `TodoList.enterEditMode(id)` replaces that `<li>`'s text span with an `<input>` pre-filled with the current text. `Enter` saves; `Escape` cancels.

**Duplicate detection:**  
Performed on trimmed, case-insensitive text against all existing tasks (excluding the task being edited, for edit operations).

---

### Quick Links

**Link data shape:**
```js
{
  id:   string,  // crypto.randomUUID() or Date.now().toString()
  name: string,  // max 100 chars
  url:  string   // normalized, max 2048 chars
}
```

**DOM targets:**
- `#link-form` — add-link form
- `#link-name-input` / `#link-url-input` — inputs
- `#link-error` — inline error display
- `#links-list` — `<ul>` for link buttons (event delegation root)

**URL normalization:**  
If the submitted URL does not start with `http://` or `https://`, prepend `https://`. After normalization, validate that the string starts with `http://` or `https://` and contains at least one `.` in the host portion (simple host-presence check; no full RFC 3986 parser needed).

---

### Theme

**DOM targets:**
- `#theme-toggle` — always-visible button

**Behavior:**
- On `init`: read stored theme. If none, read `window.matchMedia('(prefers-color-scheme: dark)').matches`. Apply the theme by setting `document.documentElement.dataset.theme = 'light'|'dark'`.
- CSS is authored against `[data-theme="dark"]` and `[data-theme="light"]` selectors on `:root`.
- On toggle click: flip the current value, update the attribute, call `storageSet('theme', newTheme)`.

---

## Data Models

### localStorage Keys

| Key | Type | Default | Description |
|---|---|---|---|
| `tdld_name` | `string` | `""` | Custom display name, trimmed |
| `tdld_theme` | ``"light"\|"dark"`` | system preference | Active color mode |
| `tdld_timer_duration` | `number` | `25` | Focus duration in minutes (1–120) |
| `tdld_sort_order` | `string` | `"newest"` | Active sort key |
| `tdld_tasks` | `Task[]` | `[]` | Ordered array of task objects |
| `tdld_links` | `QuickLink[]` | `[]` | Ordered array of quick-link objects |

All keys are prefixed with `tdld_` to avoid collisions with other apps on the same origin.

### Task schema

```json
{
  "id":        "1700000000000",
  "text":      "Buy groceries",
  "done":      false,
  "createdAt": 1700000000000
}
```

### QuickLink schema

```json
{
  "id":   "1700000000001",
  "name": "GitHub",
  "url":  "https://github.com"
}
```

### Sort order values

| Stored value | Label |
|---|---|
| `"newest"` | Newest First |
| `"oldest"` | Oldest First |
| `"az"` | A–Z |
| `"za"` | Z–A |
| `"unfinished"` | Unfinished First |

---

## CSS Architecture

### Custom properties (design tokens)

```css
:root {
  /* Spacing */
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;

  /* Typography */
  --font-body:  14px;
  --font-heading: 18px;

  /* Radius */
  --radius:     8px;

  /* Accent */
  --color-accent: #2563eb;

  /* Light theme (default) */
  --color-bg:        #f5f5f5;
  --color-surface:   #ffffff;
  --color-text:      #1a1a1a;
  --color-text-muted:#555555;
  --color-border:    #e0e0e0;
}

[data-theme="dark"] {
  --color-bg:        #121212;
  --color-surface:   #1e1e1e;
  --color-text:      #f0f0f0;
  --color-text-muted:#a0a0a0;
  --color-border:    #333333;
}
```

All component styles reference only these tokens — no hard-coded color values anywhere outside `:root`.

### Grid layout

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
}
```

This single rule satisfies both the ≥2-column desktop requirement (768 px+) and the single-column mobile requirement (360 px), without a media query. A media query at `max-width: 767px` forces single column if `auto-fit` does not trigger it at the boundary.

### Card style

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
}
```

### Focus indicator

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Applied globally; individual components do not re-specify focus styles.

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <div id="greeting-section">
      <p id="greeting-text"></p>
      <p id="clock"></p>
      <p id="date-display"></p>
    </div>
    <div id="header-controls">
      <form id="name-form">
        <label for="name-input" class="visually-hidden">Your name</label>
        <input id="name-input" type="text" maxlength="50" placeholder="Enter your name">
        <button type="submit">Save</button>
      </form>
      <button id="theme-toggle" aria-label="Toggle theme">🌙</button>
    </div>
  </header>

  <main class="dashboard-grid">
    <section class="card" id="timer-card" aria-labelledby="timer-heading">
      <h2 id="timer-heading">Focus Timer</h2>
      <!-- timer controls -->
    </section>

    <section class="card" id="todo-card" aria-labelledby="todo-heading">
      <h2 id="todo-heading">To-Do List</h2>
      <!-- todo controls -->
    </section>

    <section class="card" id="links-card" aria-labelledby="links-heading">
      <h2 id="links-heading">Quick Links</h2>
      <!-- link controls -->
    </section>
  </main>

  <footer>
    <p>Life Dashboard</p>
  </footer>

  <script src="js/app.js"></script>
</body>
</html>
```

The `visually-hidden` utility class uses the clip-based technique required by Requirement 1.6:

```css
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

---

## Error Handling

### Storage errors

`storageGet(key, default)` and `storageSet(key, value)` wrap all `localStorage` calls in `try/catch`. On any exception:
- `storageGet` returns `default`.
- `storageSet` returns without updating storage (in-memory state is already correct).

No error is propagated to callers; the UI simply operates on defaults.

### Validation errors

Each feature section has a dedicated inline error element (`#todo-error`, `#timer-duration-error`, `#link-error`). The pattern is:

```js
function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}
function clearError(el) {
  el.textContent = '';
  el.hidden = true;
}
```

Errors are cleared on the next valid submission or when the user modifies the relevant input.

### Timer edge cases

- If `setInterval` drifts, the timer still decrements by exactly 1 second per tick (it does not attempt wall-clock correction). Drift is acceptable for a productivity aid.
- If `timerSeconds` somehow goes negative (defensive check), it is clamped to 0 and the "Time's Up!" flow fires.

### Corrupted storage data

`storageGet` returns the default value whenever `JSON.parse` throws. The in-memory arrays for tasks and links default to `[]`, the sort order to `"newest"`, the duration to `25`, and the theme to the system preference. This satisfies Requirements 5.14, 6.10, 7.9, 8.5, and 9.3–9.4.

---

## Manual Test Checklist

Open `index.html` in a browser and verify each item by hand.

### Greeting & Clock
- [ ] Clock shows current time in HH:MM:SS and updates every second.
- [ ] Date shows in the format "Friday, November 20, 2026".
- [ ] Greeting says "Good Morning" (05:00–11:59), "Good Afternoon" (12:00–16:59), "Good Evening" (17:00–20:59), or "Good Night" (21:00–04:59) based on the current hour.
- [ ] Enter a name and save — greeting updates to include the name (e.g., "Good Morning, Alim").
- [ ] Clear the name and save — greeting reverts to no name.
- [ ] Reload the page — name and greeting persist.

### Theme
- [ ] Theme toggle button is always visible.
- [ ] On first visit (no saved theme), the page matches the OS light/dark preference.
- [ ] Clicking the toggle switches between light and dark modes.
- [ ] Reload the page — chosen theme persists.

### Focus Timer
- [ ] Timer displays as MM:SS on load (default 25:00 or saved duration).
- [ ] Start begins the countdown; clicking Start again while running does nothing.
- [ ] Stop pauses the countdown; the display holds the current value.
- [ ] Start after Stop resumes from where it paused.
- [ ] Reset returns the display to the saved duration and stops counting.
- [ ] Let the timer reach 00:00 — countdown stops and "Time's Up!" message appears on the page (no browser alert).
- [ ] Enter a valid duration (e.g., 10) and save — Reset now returns to 10:00. While timer is IDLE or PAUSED, the display also updates to the new duration immediately.
- [ ] Try saving 0, 121, or a non-number — inline validation message appears and the timer is unchanged.
- [ ] While the timer is running, the duration input and save button are disabled.

### To-Do List
- [ ] Add a task — it appears in the list.
- [ ] Submit an empty input — inline error appears, no task created.
- [ ] Add a task with the same text as an existing one (any casing) — inline duplicate warning appears, no task created.
- [ ] Try adding a task with text longer than 200 characters — inline error appears.
- [ ] Check the checkbox on a task — text gains strikethrough styling.
- [ ] Click the edit button on a task — text becomes an editable inline input.
- [ ] Press Enter while editing — changes are saved.
- [ ] Edit a task to match another task's text — inline duplicate warning appears, change is not saved.
- [ ] Press Escape while editing — original text is restored.
- [ ] Press Enter with an empty edit field — inline error appears, change is not saved.
- [ ] Click the delete button on a task — task is removed.
- [ ] Reload the page — task list (including done states) persists.

### Task Sorting
- [ ] Select "Newest First" — most recently added task appears at the top.
- [ ] Select "Oldest First" — oldest task appears at the top.
- [ ] Select "A–Z" — tasks are in ascending alphabetical order (case-insensitive).
- [ ] Select "Z–A" — tasks are in descending alphabetical order.
- [ ] Select "Unfinished First" — incomplete tasks appear before completed tasks.
- [ ] Reload the page — selected sort order persists.

### Quick Links
- [ ] Add a link with a name and a URL — a button appears with that name.
- [ ] Click the link button — the URL opens in a new tab.
- [ ] Add a URL without `https://` (e.g., `github.com`) — link is saved and opens correctly with `https://` prepended.
- [ ] Submit with an empty name — inline validation message appears, link not saved.
- [ ] Submit an invalid URL (e.g., `not a url`) — inline validation message appears, link not saved.
- [ ] Delete a link — button is removed from the page.
- [ ] Reload the page — saved links persist.

### Responsive Layout
- [ ] At desktop width (≥768 px), cards display in at least 2 columns.
- [ ] At mobile width (360 px), all cards stack in a single column and remain usable.
- [ ] All inputs and buttons are reachable via keyboard Tab; focus outline is visible on each.
