# ProManage Engineering API

API REST `/api/v1` para proyectos de planta (PTAR), inventario técnico, documentos, proveedores, cotizaciones, matrices (hasta 3 equipos), solicitudes de aprobación (SAE), reportes y usuarios.

Monolito modular **NestJS + PostgreSQL + Redis + MinIO/S3 (opcional)**. Moneda COP, idioma ES, zona `America/Bogota`.

## Arranque local

```bash
docker compose up -d postgres redis
cp .env.example .env   # ya hay un .env de desarrollo
npm install
npm run start:dev
```

- API: http://localhost:3000/api/v1  
- OpenAPI: http://localhost:3000/docs  
- CORS: `http://localhost:4200`

Si la base no tiene usuarios, se crea solo el admin. No hay proyectos ni equipos de demostración.

| Usuario | Email | Password | Rol |
|---|---|---|---|
| Admin | `admin@promanage.local` | `Admin123` | todos los permisos |

## Auth

`Authorization: Bearer <accessToken>` (15 min). Refresh en Redis (7 días).

```http
POST /api/v1/auth/login
{ "email": "admin@promanage.local", "password": "Admin123" }
```

Usuario `active=false` → 403. No se puede desactivar a sí mismo.

## Contrato

- UUID v4 en entidades  
- Soft delete en equipos, documentos, cotizaciones, archivos  
- Archivos: `storage_key` + URL firmada (local o MinIO). Nunca JSON/BYTEA  
- Errores: `{ "code", "message", "details": [] }`  
- Listados: `{ "data", "page", "pageSize", "total" }`  
- `equipment.supplierId` / `quotation.supplierId` / `quotation.equipmentId`  
- `project.engineerId` / `approval.requesterId`  
- `progress` calculado en servidor (documentos/12 + equipos aprobados)  
- Historia: tabla `equipment_events`  
- Score de matriz: `cumplimiento * 2 - entregaDias + (100 - potencia)`

Storage local por defecto (`./storage`). Para MinIO:

```
STORAGE_DRIVER=minio
docker compose up -d minio
```

Fase 2 (campana, settings, export PDF/DOCX) tiene endpoints; el PDF de SAE/reportes devuelve payload para que el cliente termine la plantilla.

## Variables en Vercel

Usa [`.env.vercel.example`](.env.vercel.example), no el `.env` de local.

No agregues `NODE_ENV`, `PORT` ni `TZ`. Vercel reserva `TZ` e inyecta `NODE_ENV=production` y `PORT`. El API ya usa `America/Bogota` si `TZ` no existe.

Si una clave ya existe (`DB_HOST` already exists…): **Edit**, no Add. Una sola fila por nombre; elige Production / Preview / Development en esa misma fila. Después de guardar, haz Redeploy.

`CORS_ORIGIN` debe ser la URL del frontend desplegado (sin barra final). `DB_*` y `REDIS_*` deben apuntar a Postgres y Redis en la nube, nunca a `localhost`. `MINIO_*` y `STORAGE_LOCAL_DIR` no hacen falta si `STORAGE_DRIVER=firebase`.
