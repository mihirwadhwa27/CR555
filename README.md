# PitFUSION - FRC Pit Operations & Information Display

**PitFUSION** is a high-performance, modular Pit Operations & Information Display application built for **FRC Team 1002 CircuitRunners**. It provides real-time match countdowns, alliance scouting, Statbotics EPA statistics, The Blue Alliance (TBA) integrations, and fully customizable drag-and-drop bento grid layouts.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **npm**: v9+ (or `pnpm` / `yarn`)

### Installation & Development
```bash
# 1. Clone repository or extract ZIP
git clone https://github.com/<your-username>/pitfusion.git
cd pitfusion

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser to `http://localhost:3000` (or the URL printed in the terminal).

### Production Build
```bash
# Build optimized static assets into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 How to Import into GitHub

### Option A: Export Directly from Google AI Studio
1. In Google AI Studio Build, click on the **Settings** or project menu (top right).
2. Choose **Export to GitHub** (or **Download ZIP**).
3. If downloading ZIP:
   - Extract the ZIP on your computer.
   - Initialize git and push to your GitHub account:
     ```bash
     cd pitfusion
     git init
     git add .
     git commit -m "Initial commit of PitFUSION"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<your-repo-name>.git
     git push -u origin main
     ```

### Option B: Clone via Git
If you have an existing repository linked:
```bash
git remote set-url origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 🌐 Deploying to GitHub Pages

PitFUSION is pre-configured for seamless GitHub Pages deployment using Vite's relative base paths and GitHub Actions.

### Method 1: Automated GitHub Actions (Recommended)
This repository already includes `.github/workflows/deploy.yml`:
1. Push your code to the `main` (or `master`) branch on GitHub.
2. Navigate to your repository on GitHub.
3. Go to **Settings** → **Pages** (under "Code and automation").
4. In the **Build and deployment** section, set **Source** to **GitHub Actions**.
5. GitHub will automatically trigger the workflow, compile the app, and deploy it to:
   `https://<your-username>.github.io/<your-repo-name>/`

### Method 2: Deploy from `dist` Branch or `/docs`
If you prefer manual deployment:
1. Run `npm run build` locally.
2. Push the contents of the `dist` folder to a `gh-pages` branch.
3. In repository **Settings** → **Pages**, select **Deploy from a branch** and choose `gh-pages` / `/ (root)`.

> **Note on Client-Side Routing**: The repository includes `public/.nojekyll` and `public/404.html` to ensure that GitHub Pages does not run Jekyll and cleanly routes URL reloads back to the single-page application.

---

## ⚙️ Configuration & Features

### 1. API Keys & Data Integrations
- **The Blue Alliance (TBA)**:
  - Enter your TBA Read API Key directly in the top navigation bar or under **Settings** → **Data Sources**.
  - Event keys (e.g., `2025gacmp`, `2025gal`) and Team numbers (e.g., `1002`) can be modified live without redeploying.
- **Statbotics EPA**:
  - Automatically fetches Expected Points Added (EPA), breakdown categories (Auto, Teleop, Endgame), and win probabilities for all scheduled teams.
  - Includes offline fallback data when arena Wi-Fi is unavailable or throttled.

### 2. Apple-Style Modular Bento Layout
- Click **Edit Widgets** in the layout toolbar on any view.
- **Drag & Rearrange**: Drag any card by its header to reposition it across the 12-column grid.
- **Corner Resize**: Drag the bottom-right corner to adjust both width and height simultaneously.
- **Multi-Row Stacking**:
  - Set any card to **2 Units (Tall)**.
  - Place two **1 Unit (Standard)** cards beside it; they will automatically stack vertically on top of each other directly to the left or right with zero wasted space.
- **Bento Presets**: Quickly toggle between Standard, Bento (Tall + Stacked), 1/3s, and 50/50 layouts.
- **Persistence**: All layout customizations, theme choices, and widget toggles are saved automatically in your browser's local storage.

### 3. Display Themes & Accessibility
- Switch between 8 competition-grade themes:
  - **Circuit Gold** (Team 1002 Signature)
  - **Deep Midnight** (Ultra Dark OLED)
  - **High-Contrast Arena** (Sunlight & Bright Pit Lighting)
  - **Cyberpunk Neon**, **Stealth Carbon**, **FIRST Blue**, **FIRST Red**, and **Matrix Emerald**.

---

## 🛠️ Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages CI/CD workflow
├── public/
│   ├── .nojekyll           # Disables Jekyll processing on GitHub Pages
│   └── 404.html            # Client-side fallback for direct URL visits
├── src/
│   ├── components/         # Reusable modular widgets & layout controls
│   ├── hooks/              # Custom hooks (modular layout, responsive breakpoints)
│   ├── store/              # State management & offline storage
│   ├── views/              # Main application screens (Dashboard, Schedule, Playoffs, etc.)
│   ├── types.ts            # Type definitions for FRC matches, EPA, & themes
│   ├── main.tsx            # Application root
│   └── index.css           # Tailwind styling entry point
├── package.json            # Project dependencies & scripts
├── vite.config.ts          # Vite configuration with relative base paths
└── README.md               # Documentation
```

---

## 📄 License

Created for **FRC Team 1002 CircuitRunners**. Open for use, customization, and deployment by FIRST Robotics Competition teams.
