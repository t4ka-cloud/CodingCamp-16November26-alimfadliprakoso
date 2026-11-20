# Implementation Plan: To-Do List Life Dashboard

## Overview

Build the dashboard incrementally as three files — `index.html`, `css/style.css`, and `js/app.js` — with no dependencies or build step. Each task produces a runnable state: open `index.html` in a browser and the work so far is visible and functional. Tasks follow the order: scaffold → storage → theme → greeting/clock → custom name → focus timer → to-do list → task sorting → quick links → visual polish.

## Tasks

- [ ] 1. Project scaffold
  - [ ] 1.1 Create `index.html` with the full semantic HTML structure
    - Add `<!DOCTYPE html>`, `<html lang="en" data-theme="light">`, `<head>` with charset, viewport, title, and `<link>` to `css/style.css`
    - Add `<header>` containing `#greeting-section` (`#greeting-text`, `#clock`, `#date-display`) and `#header-controls` (`#name-form` with visually-hidden label and `#name-input`, `#theme-toggle` button)
    - Add `<main class="dashboard-grid">` with three `<section class="card">` elements: `#timer-card`, `#todo-card`, `#links-card`, each with an `aria-labelledby` heading
    - Populate `#timer-card` with `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-duration-input`, `#timer-duration-save`, `#timer-duration-error`, `#timer-message`
    - Populate `#todo-card` with `#todo-form` / `#todo-input` / submit button, `#todo-error`, `#sort-select` with five options, `#todo-list`
    - Populate `#links-card` with `#link-form`, `#link-name-input`, `#link-url-input`, `#link-error`, `#links-list`
    - Add `<footer>` and `<script src="js/app.js">` at end of `<body>`
    - Every `<input>` must have an associated `<label>` (visible or `.visually-hidden`); every clickable control must be a `<button>`
    - _Requirements: 1.1, 1.5, 1.6_

  - [ ] 1.2 Create `css/style.css` with design tokens and base resets
    - Define all CSS custom properties on `:root`: `--space-sm`, `--space-md`, `--space-lg`, `--font-body` (14px), `--font-heading` (18px), `--radius` (8px), `--color-accent` (#2563eb), and the five light-theme color tokens
    - Add `[data-theme="dark"]` overrides for all five color tokens
    - Add a base reset (`box-sizing: border-box`, `margin: 0`, `font-size: var(--font-body)`)
    - Add `.visually-hidden` using the clip-based technique
    - Add `.card` with `background`, `border-radius`, `padding`, and `border` referencing tokens
    - Add `:focus-visible` global outline rule (2px solid `--color-accent`, offset 2px)
    - _Requirements: 1.2, 1.5, 1.6, 10.3, 10.4, 10.5_

  - [ ] 1.3 Create `js/app.js` skeleton with named section comments
    - Open with a `DOMContentLoaded` handler that calls `Theme.init()`, `Greeting.init()`, `Timer.init()`, `TodoList.init()`, `QuickLinks.init()`, `CustomName.init()` in that order
    - Add six empty section blocks, each preceded by a comment identifying its name: `// === Storage helpers ===`, `// === Greeting ===`, `// === Timer ===`, `// === To-Do ===`, `// === Quick Links ===`, `// === Theme ===`
    - Each section block declares a stub object literal with an `init()` function that does nothing
    - _Requirements: 1.7_

- [ ] 2. Storage helpers
  - [ ] 2.1 Implement `storageGet`, `storageSet`, and `storageRemove`
    - `storageGet(key, defaultValue)`: wraps `localStorage.getItem` and `JSON.parse` in try/catch; returns `defaultValue` on any exception, missing key, or parse failure
    - `storageSet(key, value)`: wraps `JSON.stringify` and `localStorage.setItem` in try/catch; silently discards exceptions without propagating them
    - `storageRemove(key)`: wraps `localStorage.removeItem` in try/catch; silently discards exceptions
    - Add at least one inline comment per function explaining its purpose
    - These three functions are the **only** code that may touch `localStorage`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 3. Theme
  - [ ] 3.1 Implement `Theme.init()` and the toggle handler
    - `Theme.init()`: read `storageGet('tdld_theme', null)`; if null or not `'light'`/`'dark'`, read `window.matchMedia('(prefers-color-scheme: dark)').matches` to determine the default; set `document.documentElement.dataset.theme`
    - Attach a click listener on `#theme-toggle`: flip the current `dataset.theme` value between `'light'` and `'dark'`, then call `storageSet('tdld_theme', newTheme)`
    - `Theme.init()` is called first in the `DOMContentLoaded` handler so the theme is applied before any paint
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Greeting & Clock
  - [ ] 4.1 Implement `Greeting.init()` and `Greeting.tick()`
    - `Greeting.tick()`: read `new Date()`, format `#clock` as HH:MM:SS (zero-padded, 24-hour), format `#date-display` as "Weekday, Month DD, YYYY" using `toLocaleDateString` options
    - Determine the time-of-day salutation from the hour: 05–11 → "Good Morning", 12–16 → "Good Afternoon", 17–20 → "Good Evening", 21–23 and 00–04 → "Good Night"
    - Read stored name via `storageGet('tdld_name', '')`, trim and cap to 50 characters; if non-empty, append ", {name}" to the salutation; write to `#greeting-text`
    - `Greeting.init()`: call `Greeting.tick()` immediately (satisfies the < 500 ms requirement), then start a `setInterval` at 1000 ms that calls `Greeting.tick()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 5. Custom Name
  - [ ] 5.1 Implement `CustomName.init()` and the name-form submit handler
    - `CustomName.init()`: read `storageGet('tdld_name', '')` and set `#name-input.value` to the stored value
    - Attach a `submit` listener on `#name-form` (call `event.preventDefault()`): trim the input value; if non-empty, call `storageSet('tdld_name', trimmed)`; if empty, call `storageRemove('tdld_name')`; then call `Greeting.tick()` to refresh the salutation immediately
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Focus Timer
  - [ ] 6.1 Implement the timer state machine and display logic
    - Declare module-scoped variables: `timerState = 'IDLE'`, `timerSeconds = 0`, `timerInterval = null`
    - Write `Timer.formatMMSS(seconds)` that returns a zero-padded MM:SS string
    - Write `Timer.render()` that writes `Timer.formatMMSS(timerSeconds)` to `#timer-display`
    - Write `Timer.setDurationControls(disabled)` that sets the `disabled` property on `#timer-duration-input` and `#timer-duration-save`
    - `Timer.init()`: read `storageGet('tdld_timer_duration', 25)`; validate it is an integer 1–120, else default to 25; set `timerSeconds` to `savedDuration * 60`; call `Timer.render()`
    - _Requirements: 4.1, 4.2, 4.12_

  - [ ] 6.2 Implement Start, Stop, and Reset button handlers
    - Start: only act if `timerState` is `'IDLE'` or `'PAUSED'`; set `timerState = 'RUNNING'`; call `Timer.setDurationControls(true)`; start `setInterval` at 1000 ms that decrements `timerSeconds`, clamps to 0, calls `Timer.render()`, and fires "Time's Up!" logic when it reaches 0
    - Stop: only act if `timerState === 'RUNNING'`; clear the interval; set `timerState = 'PAUSED'`; call `Timer.setDurationControls(false)`
    - Reset: act in any state; clear the interval; read saved duration from storage (default 25, same validation as init); set `timerSeconds` to `savedDuration * 60`; set `timerState = 'IDLE'`; call `Timer.render()`; call `Timer.setDurationControls(false)`; hide `#timer-message`
    - Prevent a second interval from starting if Start is clicked while already `RUNNING`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.10_

  - [ ] 6.3 Implement "Time's Up!" side effect and duration-save handler
    - When `timerSeconds` reaches 0 during a running interval: clear the interval, set `timerState = 'IDLE'`, call `Timer.setDurationControls(false)`, set `#timer-message.hidden = false` and its `textContent` to "Time's Up!"
    - Duration-save handler: read `#timer-duration-input.value`; parse as integer; if not an integer or outside 1–120, show an inline message in `#timer-duration-error` and return; otherwise clear the error, call `storageSet('tdld_timer_duration', value)`, and — if `timerState` is not `'RUNNING'` — update `timerSeconds = value * 60`, set `timerState = 'IDLE'`, call `Timer.render()`
    - _Requirements: 4.7, 4.8, 4.9, 4.11_

- [ ] 7. To-Do List
  - [ ] 7.1 Implement the task data layer and `TodoList.render()`
    - Declare module-scoped `tasks = storageGet('tdld_tasks', [])` (validate it is an array; default to `[]` if not)
    - Write `TodoList.save()` that calls `storageSet('tdld_tasks', tasks)`
    - Write `TodoList.render()`: read the current sort order, sort a shallow copy of `tasks` accordingly (see Requirement 6), clear `#todo-list`, then for each task build a `<li>` using `document.createElement` — do NOT use innerHTML to insert user-supplied text; set the task text using `element.textContent` so characters like `<` and `>` are displayed as plain text rather than parsed as HTML; each `<li>` contains a checkbox (`data-id`), a `<span>` with task text set via `textContent` (add class for strikethrough when `done`), an edit button (`data-action="edit"`, `data-id`), and a delete button (`data-action="delete"`, `data-id`)
    - `TodoList.init()`: read `storageGet('tdld_sort_order', 'newest')`; set `#sort-select.value`; call `TodoList.render()`
    - _Requirements: 5.13, 5.14, 6.1, 6.9, 6.10_

  - [ ] 7.2 Implement add-task form handler with validation
    - Attach a `submit` listener on `#todo-form`; trim the input value
    - Reject with inline error if empty/whitespace-only (_Req 5.3_)
    - Reject with inline error if trimmed length > 200 chars (_Req 5.4_)
    - Reject with inline duplicate warning if trimmed case-insensitive text matches any existing task's text (_Req 5.5_)
    - On valid input: generate an `id` via `crypto.randomUUID()` or `Date.now().toString()`, create a task object `{ id, text, done: false, createdAt: Date.now() }`, push to `tasks`, call `TodoList.save()`, call `TodoList.render()`, clear the input and any error message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 7.3 Implement event-delegated click handler on `#todo-list`
    - Attach a single `click` listener on `#todo-list` and route by `event.target` attributes
    - Checkbox change: find the task by `data-id`, toggle `task.done`, call `TodoList.save()`, call `TodoList.render()` (_Req 5.11_)
    - Delete button (`data-action="delete"`): filter the task out of `tasks`, call `TodoList.save()`, call `TodoList.render()` (_Req 5.12_)
    - Edit button (`data-action="edit"`): call `TodoList.enterEditMode(id)` (_Req 5.6_)
    - _Requirements: 5.6, 5.11, 5.12_

  - [ ] 7.4 Implement inline edit mode
    - `TodoList.enterEditMode(id)`: replace the task's `<span>` in the rendered `<li>` with an `<input>` pre-filled with the current text; focus the input
    - `keydown` listener on the edit input:
      - `Enter`: trim the value; reject with inline error if empty (_Req 5.8_); reject with inline duplicate warning if trimmed case-insensitive text matches another task's text (_Req 5.10_); otherwise update `task.text`, call `TodoList.save()`, call `TodoList.render()`
      - `Escape`: call `TodoList.render()` to exit edit mode without saving (_Req 5.9_)
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10_

- [ ] 8. Task Sorting
  - [ ] 8.1 Implement the sort logic and `#sort-select` change handler
    - Write `TodoList.sortTasks(arr, order)` that returns a sorted shallow copy:
      - `'newest'`: descending `createdAt`; ties → reverse insertion order (_Req 6.3_)
      - `'oldest'`: ascending `createdAt`; ties → insertion order (_Req 6.4_)
      - `'az'`: ascending case-insensitive `text` (_Req 6.5_)
      - `'za'`: descending case-insensitive `text` (_Req 6.6_)
      - `'unfinished'`: incomplete tasks first, each group sorted by `createdAt` ascending (_Req 6.7_)
    - `#sort-select` `change` listener: store new order in module variable; call `storageSet('tdld_sort_order', order)` (_Req 6.8_); call `TodoList.render()` within 100 ms (_Req 6.2_)
    - Use `TodoList.sortTasks` inside `TodoList.render()` to apply sorting before rebuilding the DOM
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ] 9. Quick Links
  - [ ] 9.1 Implement the quick-links data layer and `QuickLinks.render()`
    - Declare module-scoped `links = storageGet('tdld_links', [])` (validate it is an array; default to `[]` if not)
    - Write `QuickLinks.save()` that calls `storageSet('tdld_links', links)`
    - Write `QuickLinks.render()`: clear `#links-list`, then for each link build a `<li>` using `document.createElement` — do NOT use innerHTML to insert user-supplied text; set the link name using `element.textContent` and set the URL using the `href` property directly (e.g., `anchor.href = link.url`) so that link names like `<b>test` are shown as plain text; each `<li>` contains an `<a>` (or `<button>`) that opens the URL in a new tab with `rel="noopener noreferrer"`, and a delete button (`data-action="delete"`, `data-id`)
    - `QuickLinks.init()`: call `QuickLinks.render()`
    - _Requirements: 7.3, 7.8, 7.9_

  - [ ] 9.2 Implement add-link form handler with URL normalization and validation
    - Attach a `submit` listener on `#link-form`; read and trim `#link-name-input.value` and `#link-url-input.value`
    - Reject with inline error if name is empty (_Req 7.5_)
    - Reject with inline error if name > 100 chars or URL > 2048 chars (_Req 7.6_)
    - Normalize URL: if it does not start with `http://` or `https://`, prepend `https://`
    - Reject with inline error if normalized URL does not start with `http://` or `https://` or lacks a valid host (must contain at least one `.` in the host portion) (_Req 7.4_)
    - On valid input: generate `id`, create `{ id, name, url }` object, push to `links`, call `QuickLinks.save()`, call `QuickLinks.render()`, clear the inputs and error
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6_

  - [ ] 9.3 Implement event-delegated delete handler on `#links-list`
    - Attach a single `click` listener on `#links-list`; route delete button clicks by `data-action="delete"` and `data-id`; filter the link out of `links`; call `QuickLinks.save()`; call `QuickLinks.render()`
    - _Requirements: 7.7_

- [ ] 10. Checkpoint — verify the app is fully functional
  - Open `index.html` directly in a browser; confirm all sections render, no console errors appear, all features from the Manual Test Checklist in design.md pass, and localStorage keys are written with the `tdld_` prefix.
  - Ask the user if any behavior needs adjustment before proceeding to visual polish.

- [ ] 11. Responsive layout and visual polish
  - [ ] 11.1 Implement the CSS grid layout for desktop and mobile
    - Add `.dashboard-grid` with `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`, and `gap: var(--space-md)` — this single rule produces ≥2 columns at 768 px+ and a single column at 360 px
    - Add a `@media (max-width: 767px)` rule that forces `grid-template-columns: 1fr` to guarantee single-column layout at the boundary
    - _Requirements: 10.1, 10.2_

  - [ ] 11.2 Apply typography, spacing, and color to all components
    - Set `body` font-size to `var(--font-body)` (14 px minimum) and heading font-size to `var(--font-heading)` (18 px minimum) using the CSS tokens
    - Set `body` background to `var(--color-bg)` and body/heading color to `var(--color-text)`; muted text uses `var(--color-text-muted)`
    - Apply `--color-accent` to all interactive element backgrounds or borders (buttons, focus indicators) consistently
    - Ensure no hard-coded color values appear outside `:root` and `[data-theme="dark"]`
    - _Requirements: 10.3, 10.4_

  - [ ] 11.3 Verify and finalize focus indicators and keyboard navigation
    - Confirm the global `:focus-visible` rule (2 px solid `--color-accent`, offset 2 px) is visible on every focusable element when navigating by keyboard Tab
    - Confirm the contrast ratio of the focus indicator color against the card background meets 3:1 in both themes
    - Confirm text-to-background contrast ratio is at least 4.5:1 for body text in both light and dark themes
    - _Requirements: 1.6, 10.5_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Walk through the complete Manual Test Checklist in `design.md` for both light and dark themes and at desktop (≥768 px) and mobile (360 px) viewport widths.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No external libraries, CDNs, npm packages, or build tools are used at any point.
- All `localStorage` access goes exclusively through `storageGet`, `storageSet`, and `storageRemove`.
- Each task references specific requirements for traceability.
- Checkpoints (tasks 10 and 12) are integration pauses — they produce no new code but confirm the incremental build is working before moving on.
- The dependency graph below excludes checkpoint tasks (10, 12) and top-level parent tasks (1, 6, 7, 9, 11), as those are grouping nodes only.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "4.1"] },
    { "id": 3, "tasks": ["5.1", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["6.3", "7.2", "7.3"] },
    { "id": 6, "tasks": ["7.4", "8.1"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3"] },
    { "id": 9, "tasks": ["11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3"] }
  ]
}
```
