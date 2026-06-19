# 🚛 Cargo Securing Calculator – Advanced Calculation for Road Transport

A web-based, educational, and responsive cargo securing application tailored for heavy vehicles and professional driving licenses (e.g., BE/CE categories). The calculator combines the official EU standard **EN 12195-1** and industrial safety guidelines with an interactive physics breakdown and an in-depth, pound-for-pound (kilo-for-kilo) cargo balance explanation.

---

## ✨ Features

* **Multi-Method Support:** Handles both **Top-Over Lashing** (friction-based) and **Direct/Diagonal Lashing** (mechanical structural securing).
* **Educational Weight Balance:** Displays exactly how much inertial force is generated during braking, how much the bed's natural friction contributes, and how many kilograms the straps must mechanically hold.
* **Smart Angle Control:** Implements the operational angular rule of thumb:
  * **Steep Angle (75°–90°):** Full tension efficiency ($S_{tf}$).
  * **Flat Angle (30°–75°):** Half efficiency ($\times 0.5$), which mathematically doubles the required number of straps.
* **Safety Standard Compliance:** Follows structural cargo stability guidelines to prevent pivoting and rotation, meaning the application **never suggests fewer than 2 straps** for free-standing cargo.
* **Internationalization (i18n):** Full native support for seamless switching between Swedish and English.

---

## 🛠️ Technical Architecture

The project features a lightweight and secure "Single Source of Truth" architecture, keeping all raw matrix data and mathematical verification engines protected on the server side.

* **Backend:** Node.js with Express. Receives input data via a REST API (`POST /api/calculate`), executes trigonometric and structural formulas, and returns raw data alongside modifiers.
* **Frontend:** Vanilla JavaScript structured as a clean Single Page Application (SPA).
* **UI/Design:** Tailwind CSS for a modern, mobile-first, and fully responsive user experience.

### Project Structure
```text
├── server.js             # Express server and calculation engine (API)
├── package.json          # Node.js dependencies
└── public/
    ├── index.html        # Frontend application (UI & Physics diagram)
    ├── lang_sv.json      # Swedish translation & formula strings
    └── lang_en.json      # English translation & formula strings

### 🐳 Running with Docker Compose

If you have Docker installed, you can spin up the entire application instantly without needing Node.js installed on your host machine:

1. **Start the container:**
   ```bash
   docker compose up -d --build