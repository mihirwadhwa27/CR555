# GitHub Import & Deployment Troubleshooting Guide

This guide provides clear, step-by-step instructions for importing **PitFUSION** into GitHub and resolving the most common deployment errors.

---

## ⚡ Method 1: Exporting & Pushing to a New GitHub Repository

### Step 1: Create a Repository on GitHub
1. Go to [GitHub.com](https://github.com) and click the **+** icon in the top-right corner → **New repository**.
2. Name it (e.g. `pitfusion` or `frc1002-pitfusion`).
3. Set the visibility to **Public** (recommended for free GitHub Pages hosting) or **Private**.
4. **Important**: Leave "Add a README file", ".gitignore", and "Choose a license" **UNCHECKED** (we already have all three).
5. Click **Create repository**.

### Step 2: Push Your Local Code to GitHub
Open your terminal in the project directory and run:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Add all project files
git add .

# 3. Create your initial commit
git commit -m "Initial commit of PitFUSION FRC Pit Operations Display"

# 4. Set branch to main
git branch -M main

# 5. Link your GitHub repository (replace with your real URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 6. Push code to GitHub
git push -u origin main
```

*(If you already linked origin previously, use `git remote set-url origin <URL>` instead of `git remote add`).*

---

## 🚨 Troubleshooting Common GitHub Errors

### Error 1: "fatal: remote origin already exists"
**Fix**:
```bash
git remote set-url origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### Error 2: "error: failed to push some refs" or "rejected (non-fast-forward)"
This happens when the remote repository already had a commit (like a README or license):
**Fix**:
```bash
git pull origin main --rebase
git push -u origin main
```
Or, if you want your local PitFUSION code to completely replace the empty remote repository:
```bash
git push -u origin main --force
```

### Error 3: GitHub Actions "Deploy to GitHub Pages" Fails with Permission Denied
If the GitHub Action fails with `HttpError: Resource not accessible by integration` or `403`:
1. On GitHub, navigate to your repository.
2. Click **Settings** (top tab) → **Actions** (left sidebar) → **General**.
3. Scroll down to **Workflow permissions**.
4. Select **Read and write permissions**.
5. Check **Allow GitHub Actions to approve pull request requests** if available.
6. Click **Save**.
7. Go to **Actions** tab → click the failed workflow → click **Re-run all jobs**.

### Error 4: Blank White Screen or 404 Assets on GitHub Pages
This happens when an app uses absolute root paths (`/assets/...`) instead of relative paths.
- **PitFUSION is already pre-configured** with `base: './'` in `vite.config.ts`, so assets load properly from any sub-path (e.g., `https://username.github.io/repo-name/`).
- If you change your repository name or custom domain, no config changes are required!

---

## 🌐 Enabling Free GitHub Pages Hosting

Once pushed to GitHub, turn on automated hosting:
1. In your repository on GitHub, click **Settings** → **Pages** (under the "Code and automation" section).
2. Under **Build and deployment**:
   - Change **Source** from "Deploy from a branch" to **GitHub Actions**.
3. That's it! GitHub will run the included `.github/workflows/deploy.yml` workflow automatically.
4. Within 60 seconds, your site will be live at:
   ```
   https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
   ```

---

## 🖥️ Running on Pit Displays & Kiosk TVs

### Fullscreen Pit Kiosk Mode:
1. Open your deployed URL (or `localhost:3000`) in Chrome / Edge on your pit display PC or Raspberry Pi.
2. Press **F11** for native fullscreen.
3. Click the **Ten-Foot Display Mode** toggle in the top bar to maximize text and timers for readability from across the competition aisle.

### Running Completely Offline at Events:
If your arena Wi-Fi is disabled or restricted:
1. Run `npm run build`.
2. Serve locally with any zero-config web server:
   ```bash
   npx serve dist -l 3000
   ```
3. PitFUSION has full offline caching with Statbotics EPA and TBA fallback datasets built-in.
