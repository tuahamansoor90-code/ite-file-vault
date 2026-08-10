# 🗂️ ITE File Vault

**A full-featured File & Employee Records Management desktop application built for Innovative Tech Engineering (Pvt) Ltd.**

A modern Electron-based desktop app with a React 19 frontend, cloud-synced database via Supabase, AI assistant, voice input, and Excel import/export — packaged as a standalone Windows executable.

---

## ✨ Features

- **📁 File Index** — Add, search, filter, and track files with status badges (Pending, In Progress, Completed, etc.)
- **👥 Employee Management** — Full employee profiles with add/edit forms, analytics panel, and shareable form links (QR code)
- **📊 Analytics Dashboards** — Visual charts (Recharts) for both file and employee data
- **🤖 AI Assistant** — Built-in chat assistant for navigating and querying records
- **🎤 Voice Input** — Voice-powered field filling and data parsing
- **📥 Import / Export** — Import records from Excel/CSV and export data back to Excel (via `xlsx`)
- **🔐 Auth Gate** — Supabase-powered authentication to protect access
- **☁️ Cloud Sync** — All data synced in real-time with Supabase (PostgreSQL)
- **💻 Standalone Executable** — Packaged with Electron Packager as a Windows `.exe`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 31 |
| Frontend | React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Excel I/O | xlsx |
| Voice | Web Speech API |
| Packaging | Electron Packager + electron-builder |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # AuthGate — protects the app with login
│   ├── employees/      # Employee list, add dialog, analytics, import/export, share form
│   ├── file-index/     # File list, add dialog, file detail, analytics, upload zone
│   └── ui/             # Full shadcn/ui component library (50+ components)
├── routes/
│   ├── index.tsx       # Dashboard / home
│   ├── files.tsx       # File Vault page
│   ├── employees.tsx   # Employees page
│   ├── add.tsx         # Add new record page
│   ├── employee-form.tsx # Shareable employee form (via QR link)
│   ├── assistant.tsx   # AI assistant chat UI
│   ├── import-export.tsx # Import/Export page
│   └── api/            # Server-side API routes (assistant, voice, text parse)
├── integrations/
│   └── supabase/       # Supabase client, auth middleware, TypeScript types
├── lib/
│   ├── file-store.ts   # File records data layer
│   ├── employee-store.ts # Employee records data layer
│   └── utils.ts        # Utility functions
└── styles.css          # Global Tailwind styles
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase project with the required tables

### 1. Clone the Repository
```bash
git clone https://github.com/tuahamansoor90-code/ite-file-vault.git
cd ite-file-vault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run in Development
```bash
npm run electron:dev
```

### 5. Build Executable
```bash
npm run electron:build
```
The `.exe` will appear in `dist-electron/`.

---

## 📦 Build Output

The compiled standalone Windows application is:
```
dist-electron/File Vault-win32-x64/File Vault.exe
```

No installation required — runs directly on Windows.

---

## 👨‍💻 Developer

**Tuaha Mansoor**
GitHub: [@tuahamansoor90-code](https://github.com/tuahamansoor90-code)

Built for: **Innovative Tech Engineering (Pvt) Ltd**
