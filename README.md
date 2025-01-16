# Apotheken-Verwaltungssystem

Ein modernes Verwaltungssystem für Apotheken, entwickelt mit Next.js 14, TypeScript und Supabase.

## Features

- 🔐 Sicheres Authentifizierungssystem
- 👥 Benutzerverwaltung mit Rollensystem
- 🖼️ Profilbilder-Upload und -Verwaltung
- 📱 Responsive Design
- 🌙 Dark Mode
- 📊 Paginierung für große Datensätze

## Technologie-Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn/UI Komponenten
  - Lucide Icons

- **Backend:**
  - Supabase (PostgreSQL)
  - Supabase Auth
  - Supabase Storage

## Lokale Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/Zutavern/apo.git
cd apo
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env.local
```
Dann die Supabase-Zugangsdaten in `.env.local` eintragen.

4. Entwicklungsserver starten:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

## Deployment

Die Anwendung ist für das Deployment auf Vercel optimiert:

1. Vercel CLI installieren:
```bash
npm i -g vercel
```

2. Deployment starten:
```bash
vercel
```

## Projektstruktur

```
app/
├── api/            # API-Routen
├── auth/           # Authentifizierungsseiten
├── dashboard/      # Dashboard und Admin-Bereich
│   ├── admin/      # Admin-Verwaltung
│   └── profile/    # Benutzerprofil
├── components/     # Wiederverwendbare Komponenten
├── lib/           # Hilfsfunktionen und Utilities
└── types/         # TypeScript Typdefinitionen
```

## Beiträge

Beiträge sind willkommen! Bitte beachten Sie folgende Schritte:

1. Fork des Repositories erstellen
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
