document.addEventListener('DOMContentLoaded', function () {
  Theme.init();
  Greeting.init();
  Timer.init();
  TodoList.init();
  QuickLinks.init();
  CustomName.init();
});

// === Storage helpers ===

// Safely read a value from localStorage. Returns defaultValue if the key is
// missing, storage is unavailable, or the stored JSON cannot be parsed.
function storageGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    // Storage blocked, quota exceeded, or JSON parse failure — return the default.
    return defaultValue;
  }
}

// Safely write a value to localStorage as JSON. Silently discards any error
// (e.g. storage blocked or quota exceeded) so the caller's in-memory state
// remains the source of truth.
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Swallow write failures; the UI continues on in-memory state.
  }
}

// Safely remove a key from localStorage. Silently discards any error.
function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Swallow removal failures.
  }
}

// === Greeting ===
const Greeting = {
  // tick() reads the current time and updates all three greeting DOM elements.
  tick() {
    const now = new Date();

    // Format the clock as HH:MM:SS (24-hour, zero-padded).
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hh}:${mm}:${ss}`;

    // Format the date as "Weekday, Month DD, YYYY" (e.g., "Friday, November 20, 2026").
    document.getElementById('date-display').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric'
    });

    // Determine the time-of-day salutation from the current hour.
    const hour = now.getHours();
    let salutation;
    if (hour >= 5 && hour <= 11) {
      salutation = 'Good Morning';
    } else if (hour >= 12 && hour <= 16) {
      salutation = 'Good Afternoon';
    } else if (hour >= 17 && hour <= 20) {
      salutation = 'Good Evening';
    } else {
      salutation = 'Good Night';
    }

    // Append the saved name (if any), capped at 50 characters, to the salutation.
    const rawName = storageGet('tdld_name', '');
    const name = typeof rawName === 'string' ? rawName.trim().slice(0, 50) : '';
    document.getElementById('greeting-text').textContent =
      name ? `${salutation}, ${name}` : salutation;
  },

  // init() populates the display immediately, then refreshes every 1000 ms.
  init() {
    Greeting.tick();
    setInterval(Greeting.tick, 1000);
  }
};

// === Timer ===

// Module-scoped state variables for the timer finite state machine.
let timerState    = 'IDLE';   // 'IDLE' | 'RUNNING' | 'PAUSED'
let timerSeconds  = 0;        // remaining seconds
let timerInterval = null;     // setInterval handle

const Timer = {
  // formatMMSS converts a total-seconds value into a zero-padded "MM:SS" string.
  formatMMSS(seconds) {
    const totalSecs = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },

  // render writes the current timerSeconds value to the #timer-display element.
  render() {
    document.getElementById('timer-display').textContent = Timer.formatMMSS(timerSeconds);
  },

  // setDurationControls enables or disables the duration input and its save button.
  setDurationControls(disabled) {
    document.getElementById('timer-duration-input').disabled = disabled;
    document.getElementById('timer-duration-save').disabled = disabled;
  },

  // init reads the saved focus duration from storage, validates it, and renders the initial display.
  // It also wires up the Start, Stop, and Reset button click handlers.
  init() {
    const raw = storageGet('tdld_timer_duration', 25);

    // Validate: must be an integer in the range 1–120; fall back to 25 if not.
    const savedDuration =
      Number.isInteger(raw) && raw >= 1 && raw <= 120 ? raw : 25;

    timerSeconds = savedDuration * 60;
    Timer.render();

    // Start: only acts when IDLE or PAUSED; guards against double-start while RUNNING.
    document.getElementById('timer-start').addEventListener('click', function () {
      if (timerState === 'RUNNING') return;

      // Hide any "Time's Up!" message from a previous run.
      const msg = document.getElementById('timer-message');
      if (msg) msg.hidden = true;

      // If the timer has reached zero, restore the saved duration before starting.
      if (timerSeconds === 0) {
        const rawDuration = storageGet('tdld_timer_duration', 25);
        const restored =
          Number.isInteger(rawDuration) && rawDuration >= 1 && rawDuration <= 120
            ? rawDuration
            : 25;
        timerSeconds = restored * 60;
        Timer.render();
      }

      timerState = 'RUNNING';
      Timer.setDurationControls(true);

      timerInterval = setInterval(function () {
        timerSeconds = Math.max(0, timerSeconds - 1);
        Timer.render();

        if (timerSeconds === 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          timerState = 'IDLE';
          Timer.setDurationControls(false);
          const msg = document.getElementById('timer-message');
          if (msg) {
            msg.textContent = "Time's Up!";
            msg.hidden = false;
          }
        }
      }, 1000);
    });

    // Stop: only acts when RUNNING; pauses the countdown.
    document.getElementById('timer-stop').addEventListener('click', function () {
      if (timerState !== 'RUNNING') return;

      clearInterval(timerInterval);
      timerInterval = null;
      timerState = 'PAUSED';
      Timer.setDurationControls(false);
    });

    // Reset: acts in any state; restores the timer to its saved duration.
    document.getElementById('timer-reset').addEventListener('click', function () {
      clearInterval(timerInterval);
      timerInterval = null;

      const rawDuration = storageGet('tdld_timer_duration', 25);
      const resetDuration =
        Number.isInteger(rawDuration) && rawDuration >= 1 && rawDuration <= 120
          ? rawDuration
          : 25;

      timerSeconds = resetDuration * 60;
      timerState = 'IDLE';
      Timer.render();
      Timer.setDurationControls(false);

      // Hide the time's-up message if it is currently visible.
      const msg = document.getElementById('timer-message');
      if (msg) msg.hidden = true;
    });

    // Duration-save: validate the input, persist it, and sync the display when
    // the timer is not running.
    document.getElementById('timer-duration-save').addEventListener('click', function () {
      const errorEl = document.getElementById('timer-duration-error');
      const inputEl = document.getElementById('timer-duration-input');
      const parsed = parseInt(inputEl.value, 10);

      // Reject non-integers and values outside the 1–120 minute range.
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
        if (errorEl) {
          errorEl.textContent = 'Please enter a whole number between 1 and 120.';
          errorEl.hidden = false;
        }
        return;
      }

      // Clear any previously displayed error.
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }

      storageSet('tdld_timer_duration', parsed);

      // Only update the live display when the timer is idle or paused.
      if (timerState !== 'RUNNING') {
        timerSeconds = parsed * 60;
        timerState = 'IDLE';
        Timer.render();
      }
    });
  }
};

// === To-Do ===

// Module-scoped tasks array. Loaded from storage once at startup; every
// subsequent read uses this in-memory array as the single source of truth.
let tasks = (function () {
  const stored = storageGet('tdld_tasks', []);
  return Array.isArray(stored) ? stored : [];
})();

// Module-scoped sort order. Defaults to 'newest'; updated by the sort-select
// change handler and restored from storage in TodoList.init().
let sortOrder = 'newest';

const TodoList = {
  // save() persists the current in-memory tasks array to localStorage.
  save() {
    storageSet('tdld_tasks', tasks);
  },

  // sortTasks(arr, order) returns a sorted shallow copy of arr according to
  // the specified order string. The original array is never mutated.
  sortTasks(arr, order) {
    return arr.slice().sort(function (a, b) {
      switch (order) {
        // Req 6.4 — ascending createdAt; ties preserve insertion order.
        case 'oldest':
          return a.createdAt !== b.createdAt
            ? a.createdAt - b.createdAt
            : arr.indexOf(a) - arr.indexOf(b);

        // Req 6.5 — ascending case-insensitive text.
        case 'az':
          return a.text.toLowerCase().localeCompare(b.text.toLowerCase());

        // Req 6.6 — descending case-insensitive text.
        case 'za':
          return b.text.toLowerCase().localeCompare(a.text.toLowerCase());

        // Req 6.7 — incomplete tasks first; within each group, ascending createdAt.
        case 'unfinished':
          if (a.done !== b.done) return a.done ? 1 : -1;
          return a.createdAt - b.createdAt;

        // Req 6.3 — descending createdAt (default); ties → reverse insertion order.
        case 'newest':
        default:
          return a.createdAt !== b.createdAt
            ? b.createdAt - a.createdAt
            : arr.indexOf(b) - arr.indexOf(a);
      }
    });
  },

  // render() rebuilds the #todo-list DOM from the in-memory tasks array.
  // Delegates sorting to sortTasks() so the stored array order is never mutated.
  render() {
    const listEl = document.getElementById('todo-list');

    // Sort a shallow copy via the dedicated sortTasks method (Req 6.1, 6.2).
    const sorted = TodoList.sortTasks(tasks, sortOrder);

    // Clear the list before rebuilding.
    listEl.innerHTML = '';

    sorted.forEach(function (task) {
      const li = document.createElement('li');

      // Checkbox — reflects and controls the task's done state.
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.id = task.id;
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as done');

      // Task text span — textContent prevents XSS; strikethrough class when done.
      const span = document.createElement('span');
      span.textContent = task.text;
      if (task.done) {
        span.classList.add('task-done');
      }

      // Edit button.
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.dataset.action = 'edit';
      editBtn.dataset.id = task.id;
      editBtn.textContent = 'Edit';

      // Delete button.
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = task.id;
      deleteBtn.textContent = 'Delete';

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      listEl.appendChild(li);
    });
  },

  // enterEditMode() switches a task's display text into an inline editable input.
  // Finds the task by id, locates its <li> in the DOM, replaces the text <span>
  // with a focused <input>, and wires Enter/Escape handlers for save and cancel.
  enterEditMode(id) {
    // Look up the task in the in-memory array.
    const task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    // Find the <li> that owns this task by locating its edit button (data-id).
    const editBtn = document.querySelector(
      '#todo-list button[data-action="edit"][data-id="' + id + '"]'
    );
    if (!editBtn) return;
    const li = editBtn.closest('li');
    if (!li) return;

    // Find the text <span> inside this <li> and replace it with an edit input.
    // Guard: do nothing if this <li> already has an edit input open.
    if (li.querySelector('.task-edit-input')) return;

    const span = li.querySelector('span:not(.task-edit-error)');
    if (!span) return;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = task.text;
    editInput.maxLength = 200;
    editInput.className = 'task-edit-input';
    editInput.setAttribute('aria-label', 'Edit task');

    // Create an inline error node for edit-mode validation messages.
    const editError = document.createElement('span');
    editError.className = 'task-edit-error';

    li.replaceChild(editInput, span);
    li.insertBefore(editError, editBtn);

    editInput.focus();

    // Handle Enter (save) and Escape (cancel) while in edit mode (Req 5.7–5.10).
    editInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        const trimmed = editInput.value.trim();

        // Req 5.8 — reject empty or whitespace-only value.
        if (trimmed === '') {
          editError.textContent = 'Task cannot be empty.';
          return;
        }

        // Req 5.10 — reject if trimmed text matches another task (case-insensitive),
        // excluding the task currently being edited.
        const lowerTrimmed = trimmed.toLowerCase();
        const isDuplicate = tasks.some(function (t) {
          return t.id !== id && t.text.toLowerCase() === lowerTrimmed;
        });
        if (isDuplicate) {
          editError.textContent = 'A task with this text already exists.';
          return;
        }

        // All checks passed — persist the change and re-render.
        task.text = trimmed;
        TodoList.save();
        TodoList.render();
      }

      // Req 5.9 — Escape discards the change and exits edit mode.
      if (event.key === 'Escape') {
        TodoList.render();
      }
    });
  },

  // init() restores the saved sort order, renders the initial task list, and
  // wires up the add-task form submit handler.
  init() {
    const savedOrder = storageGet('tdld_sort_order', 'newest');
    const validOrders = ['newest', 'oldest', 'az', 'za', 'unfinished'];
    sortOrder = validOrders.includes(savedOrder) ? savedOrder : 'newest';

    const selectEl = document.getElementById('sort-select');
    selectEl.value = sortOrder;

    // Sort-order change handler — update the module variable, persist to storage,
    // and re-render within 100 ms (Req 6.2, 6.8).
    selectEl.addEventListener('change', function () {
      const validOrders = ['newest', 'oldest', 'az', 'za', 'unfinished'];
      const chosen = selectEl.value;
      sortOrder = validOrders.includes(chosen) ? chosen : 'newest';
      storageSet('tdld_sort_order', sortOrder);
      TodoList.render();
    });

    TodoList.render();

    // Event-delegated click handler on the list container (Req 5.6, 5.11, 5.12).
    // A single listener routes checkbox toggles, edits, and deletes by inspecting
    // the target's type or data-action attribute.
    document.getElementById('todo-list').addEventListener('click', function (event) {
      const target = event.target;

      // Checkbox toggle — update done state and persist (Req 5.11).
      if (target.type === 'checkbox') {
        const id = target.dataset.id;
        const task = tasks.find(function (t) { return t.id === id; });
        if (task) {
          task.done = !task.done;
          TodoList.save();
          TodoList.render();
        }
        return;
      }

      // Delete button — remove the task from the array and persist (Req 5.12).
      if (target.dataset.action === 'delete') {
        const id = target.dataset.id;
        tasks = tasks.filter(function (t) { return t.id !== id; });
        TodoList.save();
        TodoList.render();
        return;
      }

      // Edit button — delegate to enterEditMode for inline editing (Req 5.6).
      if (target.dataset.action === 'edit') {
        const id = target.dataset.id;
        TodoList.enterEditMode(id);
        return;
      }
    });

    // Add-task form handler — validates input before creating a task.
    document.getElementById('todo-form').addEventListener('submit', function (event) {
      event.preventDefault();

      const inputEl  = document.getElementById('todo-input');
      const errorEl  = document.getElementById('todo-error');
      const trimmed  = inputEl.value.trim();

      // Helper to show an inline error message.
      function showError(message) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }

      // Helper to clear the inline error message.
      function clearError() {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }

      // Req 5.3 — reject empty or whitespace-only input.
      if (trimmed === '') {
        showError('Task cannot be empty.');
        return;
      }

      // Req 5.4 — reject input exceeding 200 characters.
      if (trimmed.length > 200) {
        showError('Task text must be 200 characters or fewer.');
        return;
      }

      // Req 5.5 — reject duplicates (case-insensitive comparison).
      const lowerTrimmed = trimmed.toLowerCase();
      const isDuplicate = tasks.some(function (t) {
        return t.text.toLowerCase() === lowerTrimmed;
      });
      if (isDuplicate) {
        showError('A task with this text already exists.');
        return;
      }

      // All validations passed — create and store the new task.
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString();

      tasks.push({
        id:        id,
        text:      trimmed,
        done:      false,
        createdAt: Date.now()
      });

      TodoList.save();
      TodoList.render();

      // Reset the input field and clear any previous error.
      inputEl.value = '';
      clearError();
    });
  }
};

// === Quick Links ===

// Module-scoped links array. Loaded from storage once at startup; every
// subsequent read uses this in-memory array as the single source of truth.
let links = (function () {
  const stored = storageGet('tdld_links', []);
  return Array.isArray(stored) ? stored : [];
})();

const QuickLinks = {
  // save() persists the current in-memory links array to localStorage.
  save() {
    storageSet('tdld_links', links);
  },

  // render() rebuilds the #links-list DOM from the in-memory links array.
  // User-supplied text is set via textContent and direct property assignment
  // to prevent XSS — innerHTML is never used for user data.
  render() {
    const listEl = document.getElementById('links-list');

    // Clear the list before rebuilding.
    listEl.innerHTML = '';

    links.forEach(function (link) {
      const li = document.createElement('li');

      // Anchor that opens the link in a new tab.
      const anchor = document.createElement('a');
      anchor.textContent = link.name;   // textContent prevents XSS (Req 7.9)
      anchor.href = link.url;           // direct property assignment, not innerHTML
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';

      // Delete button — identified by data-action and data-id for event delegation.
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = link.id;
      deleteBtn.textContent = 'Delete';

      li.appendChild(anchor);
      li.appendChild(deleteBtn);

      listEl.appendChild(li);
    });
  },

  // init() renders the initial links list and wires up the add-link form
  // handler and the event-delegated delete handler.
  init() {
    QuickLinks.render();

    // Add-link form submit handler (Req 7.1, 7.2, 7.4, 7.5, 7.6).
    document.getElementById('link-form').addEventListener('submit', function (event) {
      event.preventDefault();

      const nameInput  = document.getElementById('link-name-input');
      const urlInput   = document.getElementById('link-url-input');
      const errorEl    = document.getElementById('link-error');

      const name = nameInput.value.trim();
      let   url  = urlInput.value.trim();

      // Helper to show an inline error.
      function showError(message) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }

      // Helper to clear the inline error.
      function clearError() {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }

      // Req 7.5 — reject if name is empty.
      if (name === '') {
        showError('Link name cannot be empty.');
        return;
      }

      // Req 7.6 — reject if name exceeds 100 characters.
      if (name.length > 100) {
        showError('Link name must be 100 characters or fewer.');
        return;
      }

      // Req 7.6 — reject if URL exceeds 2048 characters (checked before normalization).
      if (url.length > 2048) {
        showError('URL must be 2048 characters or fewer.');
        return;
      }

      // URL normalization: prepend https:// if no scheme is present.
      if (url !== '' && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Req 7.4 — validate that the normalized URL starts with http:// or https://
      // and that the host portion contains at least one dot.
      let validUrl = false;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const parsed = new URL(url);
          // The host must contain at least one dot (e.g. "example.com").
          if (parsed.hostname && parsed.hostname.includes('.')) {
            validUrl = true;
          }
        } catch (e) {
          // URL constructor threw — not a valid URL.
          validUrl = false;
        }
      }

      if (!validUrl) {
        showError('Please enter a valid URL (e.g. https://example.com).');
        return;
      }

      // All validations passed — create and store the new link.
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString();

      links.push({ id, name, url });
      QuickLinks.save();
      QuickLinks.render();

      // Reset inputs and clear any previous error.
      nameInput.value = '';
      urlInput.value  = '';
      clearError();
    });

    // Event-delegated delete handler on #links-list (Req 7.7).
    // A single listener routes delete clicks by data-action and data-id.
    document.getElementById('links-list').addEventListener('click', function (event) {
      const target = event.target;
      if (target.dataset.action === 'delete') {
        const id = target.dataset.id;
        links = links.filter(function (l) { return l.id !== id; });
        QuickLinks.save();
        QuickLinks.render();
      }
    });
  }
};

// === Theme ===
const Theme = {
  init() {
    // Read the stored theme preference, falling back to null if absent.
    const stored = storageGet('tdld_theme', null);

    // Determine which theme to apply: use the stored value if it's valid,
    // otherwise fall back to the OS/browser color-scheme preference.
    let theme;
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    // Apply the theme before the first paint by setting the data attribute
    // on the root element, which CSS [data-theme] selectors target.
    document.documentElement.dataset.theme = theme;

    // updateThemeButton sets the toggle button's label and aria-label to reflect
    // the active theme, satisfying Req 8.1.
    function updateThemeButton() {
      const active = document.documentElement.dataset.theme;
      const btn = document.getElementById('theme-toggle');
      if (active === 'dark') {
        btn.textContent = '☀️ Light';
        btn.setAttribute('aria-label', 'Theme: dark, click to switch to light');
      } else {
        btn.textContent = '🌙 Dark';
        btn.setAttribute('aria-label', 'Theme: light, click to switch to dark');
      }
    }

    updateThemeButton();

    // Toggle between light and dark whenever the user clicks the button.
    document.getElementById('theme-toggle').addEventListener('click', function () {
      const current = document.documentElement.dataset.theme;
      const newTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = newTheme;
      storageSet('tdld_theme', newTheme);
      updateThemeButton();
    });
  }
};

// === Custom Name ===
const CustomName = {
  init() {
    // Pre-populate the input with any previously saved name.
    const saved = storageGet('tdld_name', '');
    document.getElementById('name-input').value =
      typeof saved === 'string' ? saved : '';

    // Handle name form submission.
    document.getElementById('name-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const trimmed = document.getElementById('name-input').value.trim();
      if (trimmed) {
        storageSet('tdld_name', trimmed);
      } else {
        storageRemove('tdld_name');
      }
      Greeting.tick();
    });
  }
};
