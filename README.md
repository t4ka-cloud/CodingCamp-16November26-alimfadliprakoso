# Life Dashboard

A personal productivity dashboard built as a RevoU Coding Camp mini project. It combines a live clock, focus timer, to-do list, and quick links into a single lightweight page — no frameworks, no build step.

**Live demo:** https://t4ka-cloud.github.io/CodingCamp-16November26-alimfadliprakoso/

---

## Features

**MVP**
- **Greeting with clock and date** — displays a time-based greeting, the current time, and today's date
- **Focus Timer** — Pomodoro-style countdown timer with start, pause, and reset controls
- **To-Do List** — add, edit, complete, and delete tasks, saved in Local Storage
- **Quick Links** — add your own favorite websites as buttons, saved in Local Storage

**Challenges**
- Light/Dark mode toggle
- Custom name in the greeting
- Configurable Pomodoro duration
- Duplicate task prevention
- Task sorting

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JavaScript (ES6+) |
| Persistence | Local Storage |

---

## Folder Structure

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── .kiro/
    └── specs/        # spec-driven development specs
```

---

## Run Locally

Open `index.html` directly in a browser, or use the **Live Server** extension in VS Code for hot reload.

---

## About

Built with [Kiro](https://kiro.dev) using spec-driven development. Feature specs live in `.kiro/specs/`.
