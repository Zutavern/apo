# API-Dokumentation

## Authentifizierung

Alle API-Endpunkte erfordern eine gültige Authentifizierung über Supabase Auth.

### Authentifizierungs-Header

```typescript
{
  "Authorization": "Bearer <access_token>"
}
```

## Benutzer-API

### Benutzer auflisten

```typescript
GET /api/users
```

Query-Parameter:
- `page`: Seitennummer (Standard: 1)
- `per_page`: Einträge pro Seite (Standard: 8)
- `search`: Suchbegriff für Username oder Name

Antwort:
```typescript
{
  users: {
    username: string
    created_at: string
    lastlogin: string | null
    role: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }[]
  total: number
  page: number
  total_pages: number
}
```

### Benutzer erstellen

```typescript
POST /api/users
```

Body:
```typescript
{
  username: string
  password: string
  role?: string
  first_name?: string
  last_name?: string
}
```

### Benutzer aktualisieren

```typescript
PATCH /api/users/:username
```

Body:
```typescript
{
  password?: string
  role?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}
```

### Benutzer löschen

```typescript
DELETE /api/users/:username
```

## Profil-API

### Profilbild hochladen

```typescript
POST /api/profile/avatar
```

Body (multipart/form-data):
```typescript
{
  file: File // Max 2MB, nur .jpg, .jpeg, .png
}
```

Antwort:
```typescript
{
  avatar_url: string
}
```

### Profil aktualisieren

```typescript
PATCH /api/profile
```

Body:
```typescript
{
  first_name?: string
  last_name?: string
  avatar_url?: string
}
```

## Fehler-Responses

Alle API-Endpunkte verwenden Standard-HTTP-Statuscodes:

- 200: Erfolgreiche Anfrage
- 201: Ressource erfolgreich erstellt
- 400: Ungültige Anfrage
- 401: Nicht authentifiziert
- 403: Nicht autorisiert
- 404: Ressource nicht gefunden
- 500: Server-Fehler

Fehlerantwort-Format:
```typescript
{
  error: {
    message: string
    code?: string
    details?: any
  }
}
```

## Supabase Direkt-Zugriff

Für Client-seitige Operationen wird die Supabase JavaScript Client Library verwendet:

```typescript
import { supabase } from '@/lib/supabase'

// Beispiel: Benutzer laden
const { data, error } = await supabase
  .from('users')
  .select('*')
  .range(0, 7)
  .order('username', { ascending: true })
```

## Datenbankschema

### Users Tabelle

```sql
create table users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lastlogin timestamp with time zone,
  role text default 'user'::text,
  firstname text,
  lastname text,
  avatar_url text
);
```

### Berechtigungen

- Öffentlich: Nur Lesen von ausgewählten Feldern
- Authentifizierte Benutzer: Lesen aller Felder, Aktualisieren des eigenen Profils
- Admin-Benutzer: Voller Zugriff auf alle Operationen 