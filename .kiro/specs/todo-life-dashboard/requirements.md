# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, storing all data in Local Storage. The dashboard gives users a unified view of the current time and date, a Pomodoro-style focus timer, a personal to-do list, and a set of quick-access links — all in a clean, responsive layout that works on both desktop and mobile.

## Glossary

- **Dashboard**: The single HTML page (`index.html`) that hosts all features.
- **Storage**: The browser's `localStorage` API, accessed exclusively through try/catch helpers.
- **Timer**: The 25-minute (default) countdown component shown in MM:SS format.
- **Task**: A single to-do item consisting of text, a completion state, and a creation timestamp.
- **Task_List**: The ordered collection of Tasks displayed to the user.
- **Quick_Link**: A named URL that the user saves for one-click access.
- **Theme**: The active color mode of the Dashboard, either light or dark.
- **Greeting**: The time-of-day salutation combined with the user's optional custom name.
- **Sort_Order**: The user-selected ordering applied to the Task_List (Newest First, Oldest First, A–Z, Z–A, Unfinished First).

---

## Requirements

### Requirement 1: Project Structure and Technology Constraints

**User Story:** As a developer, I want a strict file layout and technology boundary, so that the project stays simple and deployable on GitHub Pages without any build step.

#### Acceptance Criteria

1. THE web app code SHALL consist of exactly three files: `index.html` at the project root, `css/style.css`, and `js/app.js`; other project files such as `README.md` and the `.kiro` folder SHALL be preserved and are not part of the web app deliverable.
2. THE Dashboard SHALL use only HTML, CSS, and Vanilla JavaScript — no external libraries, CDNs, npm packages, or build tools.
3. THE Dashboard SHALL load and render all visible UI sections — greeting, timer, to-do list, quick links, and theme toggle — when `index.html` is opened directly via the `file://` protocol and when served from a GitHub Pages URL, without any console errors.
4. THE Dashboard SHALL operate without defects in Chrome 124+, Firefox 125+, Edge 124+, and Safari 17+, without requiring polyfills.
5. THE Dashboard SHALL use semantic HTML elements (`header`, `main`, `section`, `h1`/`h2`, `form`, `label`, `button`, `ul`/`li`, `footer`), using `div` only when the HTML specification defines no semantic element that fits the content's role.
6. THE Dashboard SHALL ensure every input has an associated label (visible or visually hidden using a clip-based CSS technique) and every clickable control is a `<button>` element that displays a focus indicator with at least a 2px solid outline when focused via keyboard navigation.
7. THE `js/app.js` file SHALL be organized into named sections — Storage helpers, Greeting, Timer, To-Do, Quick Links, Theme — each preceded by a comment block identifying the section name, with at least one inline comment per function explaining its purpose.

---

### Requirement 2: Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a personalized greeting, so that I am immediately oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current time in HH:MM:SS 24-hour format, updating every 1000 milliseconds using the device's local clock.
2. THE Dashboard SHALL display the current date in the format "Friday, November 20, 2026" using the device's local calendar.
3. WHEN the local hour is between 05:00 and 11:59 (inclusive), THE Dashboard SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 16:59 (inclusive), THE Dashboard SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 17:00 and 20:59 (inclusive), THE Dashboard SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 21:00 and 23:59 or between 00:00 and 04:59 (inclusive), THE Dashboard SHALL display the greeting "Good Night".
7. WHERE a custom name has been saved, THE Dashboard SHALL append the saved name to the greeting text, separated by a comma and a space (e.g., "Good Morning, Alim"), with the name truncated to a maximum of 50 characters.
8. WHILE no custom name is stored, THE Dashboard SHALL display the greeting text without a name suffix.
9. WHEN the Dashboard is first opened or reloaded, THE Dashboard SHALL render the time, date, and greeting within 500 milliseconds using the device's current local time.

---

### Requirement 3: Custom Name

**User Story:** As a user, I want to set and update my name on the Dashboard, so that the greeting feels personal.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input control that lets the user enter or change their name, accepting a maximum of 50 characters.
2. WHEN the user submits a non-empty name, THE Dashboard SHALL save the trimmed name (stripped of leading and trailing whitespace) to Storage and update the greeting within one rendering cycle.
3. WHEN the user clears the name and submits, THE Dashboard SHALL remove the name from Storage and show the greeting without a name.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved name from Storage, pre-populate the name input control with that value, and display it in the greeting.
5. IF Storage is unavailable or the saved name value is not a non-empty string after trimming, THEN THE Dashboard SHALL display the greeting without a name, leave the input control empty, and continue operating normally.

---

### Requirement 4: Focus Timer

**User Story:** As a user, I want a countdown timer that tracks focused work sessions, so that I can manage my time using the Pomodoro technique.

#### Acceptance Criteria

1. THE Timer SHALL display time remaining in MM:SS format where MM is zero-padded to two digits and SS is zero-padded to two digits.
2. WHEN the Dashboard loads, THE Timer SHALL initialize to the user's saved focus duration (default 25 minutes) and show that duration in MM:SS format.
3. WHEN the user clicks Start and the Timer is not already running, THE Timer SHALL begin counting down one second at a time, decrementing the displayed seconds value by 1 every 1000 milliseconds.
4. WHILE the Timer is running, THE Dashboard SHALL prevent a second countdown interval from starting if Start is clicked again.
5. WHEN the user clicks Stop (pause), THE Timer SHALL pause the countdown without resetting the remaining time, retaining the last displayed MM:SS value.
6. WHEN the user clicks Reset, THE Timer SHALL stop counting down and restore the display to the current saved focus duration in MM:SS format.
7. WHEN the Timer reaches 00:00, THE Timer SHALL stop automatically and THE Dashboard SHALL display a visible "Time's Up!" message within the page (not a browser alert or confirm dialog) within 1 second of the timer reaching 00:00.
8. THE Dashboard SHALL provide an input that lets the user set the focus duration to any whole number of minutes between 1 and 120.
9. WHEN the user saves a valid focus duration, THE Dashboard SHALL store the value in Storage and use it for all subsequent Resets without requiring a page reload.
10. WHILE the Timer is running, THE Dashboard SHALL disable the focus duration input and its save control so the user cannot submit a changed duration.
11. IF the user enters a focus duration outside the range 1–120 or a non-integer value, THEN THE Dashboard SHALL display an inline validation message adjacent to the input field and reject the input without updating Storage.
12. IF Storage is unavailable or the saved duration is missing or non-integer or outside the range 1–120, THEN THE Timer SHALL fall back to a 25-minute default.

---

### Requirement 5: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks in a persistent list, so that I can track my daily work.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input and submit button for adding new Tasks.
2. WHEN the user submits the add-task form with a non-empty value, THE Task_List SHALL create a new Task with the trimmed input text (maximum 200 characters), an incomplete state, and the current timestamp, then save the updated Task_List to Storage.
3. IF the user submits the add-task form with an empty or whitespace-only value, THEN THE Dashboard SHALL display an inline error message and reject the Task without creating it.
4. IF the user submits the add-task form with a trimmed input exceeding 200 characters, THEN THE Dashboard SHALL display an inline error message indicating the character limit and reject the Task without creating it.
5. IF the trimmed, case-insensitive text of a new Task matches an existing Task's text, THEN THE Dashboard SHALL display an inline duplicate-warning message and reject the new Task without creating it.
6. WHEN the user activates the edit control on a Task, THE Dashboard SHALL replace the Task's display text with an inline text input pre-filled with the current text.
7. WHEN the user presses Enter while editing a Task with a non-empty trimmed value, THE Dashboard SHALL save the trimmed input (maximum 200 characters) as the new Task text, update Storage, and exit edit mode.
8. IF the user presses Enter while editing a Task with an empty or whitespace-only trimmed value, THEN THE Dashboard SHALL display an inline error message and cancel the save without updating Storage.
9. WHEN the user presses Escape while editing a Task, THE Dashboard SHALL discard the change and exit edit mode.
10. IF the trimmed, case-insensitive text of an edited Task matches another existing Task's text, THEN THE Dashboard SHALL display an inline duplicate-warning message and cancel the save without updating Storage.
11. WHEN the user toggles the checkbox on a Task, THE Dashboard SHALL update the Task's completion state, apply a strikethrough style to the text of completed Tasks, and save the updated Task_List to Storage.
12. WHEN the user clicks the delete control on a Task, THE Dashboard SHALL remove that Task from the Task_List and save the updated Task_List to Storage.
13. WHEN the Dashboard loads, THE Dashboard SHALL read the Task_List from Storage and render all saved Tasks.
14. IF Storage is unavailable or the saved Task_List is corrupted, THEN THE Dashboard SHALL render an empty Task_List and continue operating normally.

---

### Requirement 6: Task Sorting

**User Story:** As a user, I want to sort my task list in different orders, so that I can focus on the tasks that matter most right now.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a dropdown control with the Sort_Order options: Newest First, Oldest First, A–Z, Z–A, Unfinished First.
2. WHEN the user selects a Sort_Order, THE Task_List SHALL re-render in that order within 100 milliseconds without altering the stored Task data.
3. WHEN the user selects "Newest First", THE Task_List SHALL display Tasks ordered by creation timestamp descending; Tasks sharing the same creation timestamp SHALL appear in reverse insertion order.
4. WHEN the user selects "Oldest First", THE Task_List SHALL display Tasks ordered by creation timestamp ascending; Tasks sharing the same creation timestamp SHALL appear in insertion order.
5. WHEN the user selects "A–Z", THE Task_List SHALL display Tasks ordered alphabetically by task text, ascending, case-insensitive.
6. WHEN the user selects "Z–A", THE Task_List SHALL display Tasks ordered alphabetically by task text, descending, case-insensitive.
7. WHEN the user selects "Unfinished First", THE Task_List SHALL display incomplete Tasks before completed Tasks, with Tasks within each group ordered by creation timestamp ascending.
8. WHEN the user selects a Sort_Order, THE Dashboard SHALL save that Sort_Order to Storage.
9. WHEN the Dashboard loads, THE Dashboard SHALL restore the Sort_Order from Storage and apply it to the Task_List before display.
10. IF Storage is unavailable or the saved Sort_Order value does not match any of the five valid Sort_Order options, THEN THE Dashboard SHALL default to Newest First.

---

### Requirement 7: Quick Links

**User Story:** As a user, I want to save named website shortcuts on the Dashboard, so that I can open frequently visited pages with one click.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a form with a link-name input (maximum 100 characters) and a URL input (maximum 2048 characters) for adding Quick_Links.
2. WHEN the user submits the add-link form with a valid name and URL, THE Dashboard SHALL normalize the URL (prepending `https://` if no scheme is present), save the Quick_Link to Storage, and render it as a button.
3. WHEN a Quick_Link button is clicked, THE Dashboard SHALL open the saved URL in a new browser tab with `rel="noopener noreferrer"`.
4. IF the URL entered by the user, after normalization, does not begin with `http://` or `https://` or does not contain a valid host, THEN THE Dashboard SHALL display an inline validation message and reject the Quick_Link without saving it.
5. IF the name field is empty when the add-link form is submitted, THEN THE Dashboard SHALL display an inline validation message and reject the Quick_Link.
6. IF the name field value exceeds 100 characters or the URL field value exceeds 2048 characters when the add-link form is submitted, THEN THE Dashboard SHALL display an inline validation message and reject the Quick_Link without saving it.
7. WHEN the user clicks the delete control on a Quick_Link, THE Dashboard SHALL remove it from Storage and remove the button from the page.
8. WHEN the Dashboard loads, THE Dashboard SHALL read Quick_Links from Storage and render each as a button.
9. IF Storage is unavailable or the saved Quick_Links data is corrupted, THEN THE Dashboard SHALL render an empty Quick_Links list and continue operating normally.

---

### Requirement 8: Light / Dark Theme

**User Story:** As a user, I want to switch between light and dark color modes, so that the Dashboard is comfortable to look at in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle button that is always visible and indicates the currently active Theme (`light` or `dark`).
2. WHEN the Dashboard loads for the first time and no Theme is stored, THE Dashboard SHALL apply the Theme that matches the browser's `prefers-color-scheme` media query.
3. WHEN the user clicks the theme toggle, THE Dashboard SHALL switch the active Theme on the root element to the opposite value (`light` or `dark`) and save that value to Storage.
4. WHEN the Dashboard loads and a Theme is stored, THE Dashboard SHALL apply the stored Theme instead of the system preference.
5. IF Storage is unavailable or the stored Theme value is not exactly `light` or `dark`, THEN THE Dashboard SHALL fall back to the system preference.

---

### Requirement 9: Storage Safety

**User Story:** As a developer, I want all Local Storage access wrapped in error handling, so that the Dashboard continues to work even when storage is blocked or data is corrupted.

#### Acceptance Criteria

1. THE Storage helpers SHALL wrap every `localStorage.getItem` and `localStorage.setItem` call in a try/catch block.
2. IF a `localStorage.setItem` call throws, THEN THE Storage helpers SHALL catch the error and THE Dashboard SHALL remain in its current state with all previously rendered data visible and interactive.
3. IF a `localStorage.getItem` call returns a value that cannot be parsed as expected JSON, THEN THE Storage helpers SHALL return the documented default value for that key.
4. IF `localStorage` is unavailable or throws on access, THEN THE Storage helpers SHALL return the documented default value for read operations and silently discard write operations without propagating the exception to the caller.

---

### Requirement 10: Responsive Layout and Visual Design

**User Story:** As a user, I want the Dashboard to look good and be usable on both my phone and desktop, so that I can access it anywhere.

#### Acceptance Criteria

1. THE Dashboard SHALL display cards in a grid of at least 2 columns on viewports 768 px wide and above, with a minimum gap of 16 px between columns and rows.
2. THE Dashboard SHALL display cards in a single-column layout on viewports narrower than 768 px, including 360 px wide.
3. THE Dashboard SHALL use a neutral (non-purple-gradient) background color, one accent color applied consistently across interactive elements, card corners rounded by at least 4 px, and uniform padding of at least 16 px inside each card.
4. THE Dashboard SHALL render all body text at a minimum font size of 14 px and all heading text at a minimum font size of 18 px, with a text-to-background contrast ratio of at least 4.5:1 at all supported viewport widths.
5. THE Dashboard SHALL ensure all interactive elements display a keyboard-focus indicator with a visible outline of at least 2 px and a focus-indicator-to-background contrast ratio of at least 3:1.
