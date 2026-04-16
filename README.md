# Online Courses Platform

A single-page web application for browsing courses, enrolling, tracking learning progress, and completing courses.

Built with vanilla JavaScript + Vite, using hash-based routing and integration with the Redberry internship API.

## Features

- Authentication (register, login, logout)
- Course catalog with sorting, filtering, and pagination
- Course detail page with schedule/time/session selection
- Enrollment flow with profile checks and repair fallbacks
- Enrolled courses sidebar with progress tracking
- Continue Learning section on dashboard (for logged-in users with enrollments)
- Course completion flow with:
  - `Complete Course`
  - `Retake Course`
  - Visual star rating panel + feedback message

## Tech Stack

- JavaScript (ES modules)
- Vite
- HTML/CSS
- REST API (`https://api.redclass.redberryinternship.ge/api`)

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/dolchadoli/assignment-redberry.git
cd assignment-redberry
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build locally

## Build Output

This project uses:

- `root: src`
- `publicDir: public`
- `outDir: dist`

Configured in [`vite.config.js`](./vite.config.js).

## Project Structure

```text
online-courses-platform/
  public/                 # static assets
  src/
    index.html
    js/
      api/                # API modules
      components/         # UI components (layout, modals, sidebar)
      pages/              # dashboard/catalog/course detail pages
      services/           # auth/profile service layer
      state/              # lightweight stores
      utils/              # helpers
      app.js              # app bootstrap + global handlers
      router.js           # hash router
      config.js           # API base URL + storage keys
    styles/               # global/component CSS
  dist/                   # production output
```

## Routing

The app uses hash routing:

- `#/` - dashboard
- `#/courses` - catalog
- `#/courses/:id` - course detail

## API Configuration

API constants are in [`src/js/config.js`](./src/js/config.js):

- `API_BASE_URL`
- `AUTH_TOKEN_KEY`
- `USER_STORAGE_KEY`

No `.env` setup is required for current configuration.

## Notes for Evaluation

- UI was tuned for desktop grading workflows (including 1920x1080 layout requirements).
- If API data is incomplete for a user profile, enrollment flow includes automatic fallback/repair attempts.

## Troubleshooting

### `npm run build` / dev server issues

- Ensure Node.js version is modern (18+ recommended).
- Delete and reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

(Windows PowerShell)

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### API-related behavior

If enroll/profile fields look inconsistent, test with a fresh account first to rule out stale server-side user data.

## License

Private project for internship/assignment workflow.
