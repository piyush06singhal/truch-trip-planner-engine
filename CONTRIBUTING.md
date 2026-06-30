# Contributing to Spotter Compliance Planner

We welcome contributions to help improve the Spotter Truck Trip Planner & FMCSA HOS Engine! Please follow the instructions below to set up your development environment.

---

## 🛠️ Code Quality Standards

### Commit Style Guidelines
We use the **Conventional Commits** format for clear git history. Please prefix your commit messages with:
* `feat:` for new capabilities.
* `fix:` for fixing issues/bugs.
* `refactor:` for code restructures (no behavior changes).
* `docs:` for markdown guides and updates.
* `style:` for cosmetic tweaks (semicolons, spacing).
* `test:` for writing tests.
* `chore:` for updating build scripts, configs, or npm/pip packages.

*Example:* `feat: integrate sonner promise toasts for trip clones`

### Frontend Standards
1. Run `npm run lint` before committing. Commits will fail CI checks if there are ESLint warnings.
2. Ensure types are strongly defined. Do not use the `any` keyword.

### Backend Standards
1. Check that all files compile cleanly:
   `python -m py_compile manage.py config/*.py trip_planner/*.py`
2. Keep your views and models thin. Business calculations must be placed in services.

---

## 🚀 Branching & Pull Requests
1. Clone the repository and branch off `develop`:
   `git checkout -b feature/your-feature-name`
2. Create a clean Pull Request targeting the `develop` integration branch.
3. Make sure all steps in the CI pipeline build successfully.
