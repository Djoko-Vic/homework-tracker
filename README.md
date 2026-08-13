# 📖 HomeworkHub — Student Homework Tracker

A modern, retro-white themed web application for teachers and tutors to track student homework completion, image uploads, and daily study streaks.

![Retro Homework Tracker](https://img.shields.io/badge/Theme-Retro%20White-d96b43)
![License](https://img.shields.io/badge/License-MIT-blue)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS-4a7c59)

---

## ✨ Features

- **🎨 Retro White Aesthetic**: Soft ivory canvas (`#FAF7F2`), vintage typography (`Space Grotesk` & `Plus Jakarta Sans`), and warm color palette designed to eliminate screen glare and eye strain.
- **🔒 Role-Based Login (Teacher vs Student)**:
  - **Teacher Portal**: Full administrative access — create/edit/delete students, assign homework tasks, review & approve uploaded photos, and track all student progress. Default passcode: `admin`.
  - **Student Portal**: Student selection & 4-digit PIN authentication (default: `1234`). Displays only their personal assigned tasks, homework photo uploader, and individual streak stats.
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
   - Click **🔑 Switch User** ➔ Select **Teacher Portal** (Password: `admin`).
   - Go to **Manage Students** ➔ Add students.
   - Go to **Assignments** ➔ Create assignments for students.
3. **As a Student**:
   - Click **🔑 Switch User** ➔ Select **Student Portal**.
   - Choose your student profile and enter your PIN (Default: `1234`).
   - Click on your assigned homework ➔ Upload photos of your homework!

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
