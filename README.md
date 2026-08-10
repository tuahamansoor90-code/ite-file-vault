# 🗂️ ITE File Vault

**A full-featured File & Employee Records Management desktop application built for Innovative Tech Engineering (Pvt) Ltd.**

A modern Electron-based desktop app with a React 19 frontend, cloud-synced database via Supabase, AI assistant, voice input, and Excel import/export — packaged as a standalone Windows executable.

---

## ✨ Features

- **📁 File Index** — Add, search, and track physical files with fields: File Code, Document Title, Department, Cabinet Number, Row, Side, Full Location Code, and Year
- **🔄 Status Tracking** — Per-file status: Available, Issued, Lost, Archived, Record Room — with full issue/return history (issued to, issue date, expected return, returned date, note)
- **⚠️ Overdue Detection** — Automatically flags files that have passed their expected return date
- **👥 Employee Management** — Add, edit, delete, and search employee records (Employee ID, Name, CNIC, Department, Designation, Email, Contact)
- **🔗 Shareable Employee Form** — Generate a public link + QR code so employees can fill in their own data remotely
- **📊 Analytics Dashboard** — Live stats: Issued Today, Returned Today, Overdue count, Lost files, and a current holders list (who is holding which files)
- **📥 Import / Export** — Bulk import file and employee records from Excel (`.xlsx`) and export a full backup to Excel
- **🔐 Auth Gate** — Supabase-powered login to protect all data
- **☁️ Offline + Cloud Sync** — Data cached locally in localStorage for offline use; syncs to Supabase cloud when online
- **💻 Standalone Executable** — Packaged with Electron Packager as a Windows `.exe` — no installation required

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
