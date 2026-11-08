# 📖 HomeworkHub — Student Homework Tracker

An editorial black-and-white web application with a single orange accent for teachers and tutors to track student homework completion, image uploads, and daily study streaks.

![Retro Homework Tracker](https://img.shields.io/badge/Theme-Retro%20White-d96b43)
![License](https://img.shields.io/badge/License-MIT-blue)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS-4a7c59)

---

## ✨ Features

- **Editorial interface**: Alternating white and charcoal views, Inter headings, IBM Plex Mono data, square ink borders, original study SVGs and reduced-motion support.
- **🔒 Role-Based Login (Teacher vs Student)**:
  - **Teacher Portal**: Full administrative access — create/edit/delete students, assign homework tasks, review & approve uploaded photos, and track all student progress. Use the configured teacher passcode.
  - **Student Portal**: Student selection & 4-digit PIN authentication (default: `0000`). Displays only their personal assigned tasks, homework photo uploader, and individual streak stats.
- **📸 Homework Photo Uploads**: Students can drag-and-drop or upload photos of their completed homework directly onto task cards.
- **🔥 Daily Streak Tracker**: Calculates continuous daily activity and displays a 30-day activity contribution calendar for each student.
- **✅ Teacher Approval System**: Teachers review submitted homework photos and click "Approve Homework" to log completion and update streaks.
- **💾 Local Storage Persistence**: All data (students, tasks, uploads, login state) is saved automatically in the browser — no database setup needed!

---

## 🚀 Live Demo & Deployment

This project is built with static web standards (HTML5, CSS3, ES6 JS) and can be hosted for **free on GitHub Pages**:

1. Go to your repository settings on GitHub (**Settings ➔ Pages**).
2. Set **Source** to `Deploy from a branch`.
3. Select `main` branch and `/ (root)` folder, then click **Save**.
4. Access your live website at: `https://Djoko-Vic.github.io/homework-tracker/`

---

## 📁 Repository Structure

```text
├── index.html     # Main HTML structure & modals
├── style.css      # Retro White theme design system
├── app.js         # State management, role auth, streaks & uploads
└── README.md      # Documentation
```

---

## 👩‍🏫 Getting Started

1. Open `index.html` in any web browser (or visit the GitHub Pages link).
2. **As a Teacher**:
   - Click **🔑 Switch User** ➔ Select **Teacher Portal** (use your configured passcode).
   - Go to **Manage Students** ➔ Add students.
   - Go to **Assignments** ➔ Create assignments for students.
3. **As a Student**:
   - Click **🔑 Switch User** ➔ Select **Student Portal**.
   - Choose your student profile and enter your PIN (Default: `0000`).
   - Click on your assigned homework ➔ Upload photos of your homework!

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.


## Student fee tracking and redesign

Fee records belong to individual students. Teachers can select a student, manage charges/payments/due dates and see account totals; student views are read-only. New accounts start at zero. Existing shared data requires safe migration before cloud fee writes are enabled.

- [Migration instructions, access limitations and manual checklist](docs/fee-tracking.md)
- [Theme files and browser verification](docs/ui-redesign.md)
- Node tests: `node tests/fee-ledger.test.cjs` and `node tests/app-fees.test.cjs`

Run `fee-migration.sql` in a staging Supabase project first. Multiple existing accounts require a confirmed legacy owner UUID. The current PIN/password gate and public Supabase policies do not provide server-enforced student privacy; see the access boundary documentation.
