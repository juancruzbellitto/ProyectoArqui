@AGENTS.md

# ComplejoSport — Sistema de Reserva de Turnos de Canchas

**Materia:** Arquitectura y Diseño de Sistemas 2026 — Comisión 5  
**Integrantes:** Monardez, Sagasti, Bloga, Uzeltinger, Bellitto, Julián  
**Slogan:** "Reservá tu cancha, jugá sin complicaciones"

Plataforma web que permite a usuarios clientes reservar canchas deportivas en complejos, gestionar equipamiento y pagos. Administradores y auxiliares gestionan complejos, canchas, inventario y estadísticas.

---

## Entregables

| # | Fecha | Contenido |
|---|-------|-----------|
| 1 | 6 abr | Modelo de dominio, glosario, RF-01–RF-28, RNF-01–RNF-15, DER |
| 2 | 27 abr | Diagrama de contexto, contenedores y componentes (C4) |
| 3 | 18 may | Modelo de datos relacional y diccionario de datos |

**Pendientes:**
- **8 jun** — Diseño de APIs + Descripción del Pipeline de Datos + ADRs (decisiones arquitectónicas)
- **22 jun** — Estrategia de Despliegue (opcional)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend | API Routes de Next.js + servidor Express separado (`backend/`) |
| ORM | Prisma 7 con adaptador `@prisma/adapter-pg` |
| Base de datos | PostgreSQL |
| Autenticación | JWT |
| Pagos | Mercado Pago |
| Notificaciones | Gmail API / Nodemailer |
| Contenedores | Docker |
| Package manager | pnpm |

---

## Estructura del Proyecto

```
ProyectoArqui/
├── app/                        # Next.js App Router (páginas y API routes)
│   ├── globals.css             # Tailwind v4 + variables CSS de paleta
│   ├── layout.tsx              # Layout raíz (lang=es, fuentes Geist)
│   └── page.tsx                # Landing page (Home)
├── src/
│   ├── components/             # Componentes reutilizables de UI
│   │   ├── Navbar.tsx          # 'use client' — sticky, hamburguesa mobile
│   │   ├── Hero.tsx            # 'use client' — barra de búsqueda
│   │   ├── Features.tsx        # Server Component
│   │   ├── ComplejoCard.tsx    # Server Component
│   │   ├── CanchaCard.tsx      # 'use client' — botón reservar con TODO auth
│   │   ├── HowItWorks.tsx      # Server Component
│   │   └── Footer.tsx          # Server Component
│   └── mocks/
│       └── data.ts             # Datos mockeados (reemplazar con queries Prisma al tener DB)
├── backend/                    # Servidor Express independiente
│   ├── app/prisma/prisma.ts    # Instancia Prisma del backend
│   ├── prisma/schema.prisma    # Schema Prisma (fuente de verdad del modelo — aún vacío)
│   ├── app.js
│   └── server.js
├── docs/
│   ├── CU/                     # Casos de uso CU-01 a CU-26 (.docx)
│   ├── Diccionario de Datos.docx / .pdf
│   ├── Diagrama de componentes - entregable 2.pdf
│   ├── Diagrama entidad-relacion entregable 1.png
│   ├── Documentacion-proyecto - entregable 1.pdf
│   ├── Modelo de Datos-5.pdf
│   └── Proyecto 2026.pdf       # Lineamientos y criterios de evaluación
├── public/                     # Assets estáticos
├── prisma.config.ts
├── next.config.ts
├── tsconfig.json               # paths: "@/*" → "./*"
└── package.json
```

---

## Ruteo de la Aplicación

Decisión tomada: las canchas son recursos anidados dentro de complejos. La reserva vive en el contexto de cancha → complejo.

```
/                                                   → Landing (hecha)
/login                                              → Inicio de sesión
/registro                                           → Registro

/complejos                                          → Lista y búsqueda de complejos
/complejos/[complejo_id]                            → Detalle del complejo + sus canchas
/complejos/[complejo_id]/canchas/[cancha_id]        → Detalle de cancha (horarios, reseñas)
/complejos/[complejo_id]/canchas/[cancha_id]/reservar  → Formulario de reserva (auth requerida)

/reservas                                           → Mis reservas (auth requerida)
/reservas/[reserva_id]                              → Detalle / comprobante de reserva

/dashboard                                          → Panel admin / auxiliar (auth requerida)
/dashboard/complejos                                → Gestión de complejos
/dashboard/complejos/[complejo_id]                  → Gestión de canchas e inventario
```

---

## Base de Datos — Pendientes antes de la primera migración

La DB está hosteada en **Neon PostgreSQL** (Vercel). La connection string está en `.env` y `.env.local`. Hay cuatro cosas a resolver antes de correr `prisma migrate dev`:

1. **Escribir los modelos en `backend/prisma/schema.prisma`** — actualmente vacío.
2. **Agregar `directUrl`** — Neon usa PgBouncer; sin `directUrl` apuntando a la URL sin pooling, las migraciones fallan por advisory locks:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DATABASE_URL_UNPOOLED")
   }
   ```
3. **Copiar `DATABASE_URL_UNPOOLED` al `.env`** — actualmente solo está en `.env.local` (que lee Next.js, no Prisma CLI).
4. **Corregir el path en `prisma.config.ts`** — apunta a `prisma/schema.prisma` pero el archivo está en `backend/prisma/schema.prisma`.

Una vez resueltos: `pnpm exec prisma migrate dev` crea las tablas. Reemplazar el import de `src/mocks/data.ts` en `app/page.tsx` con queries de Prisma, y borrar el archivo de mocks.

---

## Mapa de Documentación

| Archivo | Contenido |
|---------|-----------|
| `docs/Proyecto 2026.pdf` | Lineamientos de la materia, requerimientos arquitectónicos obligatorios, criterios de evaluación |
| `docs/Documentacion-proyecto - entregable 1.pdf` | Glosario del dominio, RF-01–RF-28, RNF-01–RNF-15 |
| `docs/Diagrama de componentes - entregable 2.pdf` | Arquitectura C4: Login API, Estadísticas API, Turnos API, Pagos API |
| `docs/Modelo de Datos-5.pdf` | Modelo relacional con todas las tablas |
| `docs/Diccionario de Datos.docx/.pdf` | Descripción de tablas, tipos, reglas de negocio |
| `docs/Diagrama entidad-relacion entregable 1.png` | DER con entidades del dominio |
| **Casos de uso** | |
| `CU-01` | Crear cuenta (usuario cliente) |
| `CU-02` | Iniciar sesión |
| `CU-03` | Cerrar sesión |
| `CU-04` | Ver cuenta |
| `CU-05` | Modificar cuenta |
| `CU-06` | Reservar turno |
| `CU-07` | Cancelar turno |
| `CU-08` | Pagar turno |
| `CU-09` | Ver ubicación del complejo |
| `CU-10` | Ver canchas disponibles |
| `CU-11` | Buscar jugador (publicar solicitud de jugadores) |
| `CU-12` | Reportar complejo (comentario/reporte) |
| `CU-13` | Solicitar equipamiento en reserva |
| `CU-14` | Buscar equipo (unirse a reserva abierta) |
| `CU-15` | Crear cuenta (administrador) |
| `CU-16` | Agregar cancha |
| `CU-17` | Eliminar cancha |
| `CU-17.1` | Editar info. cancha |
| `CU-18` | Agregar complejo |
| `CU-19` | Eliminar complejo |
| `CU-19.1` | Editar info. complejo |
| `CU-20` | Notificar estado de cancha (marcar como no disponible) |
| `CU-21` | Registrar inasistencia del usuario cliente |
| `CU-22` | Gestionar inventario de equipamiento |
| `CU-23` | Consultar estadísticas del complejo |
| `CU-24` | Registrar reserva manual (presencial) |
| `CU-25` | Consultar disponibilidad de canchas |
| `CU-26` | Crear cuenta (auxiliar) |

---

## Modelo de Datos Resumido

| Tabla | PK | Relaciones clave |
|-------|----|-----------------|
| `Usuario` | `email` | superclase; rol: `admin\|auxiliar\|cliente` |
| `Cliente` | `email` (FK→Usuario) | herencia 1:1 de Usuario |
| `Auxiliar` | `email` (FK→Usuario) | FK→Complejo |
| `Complejo` | `id_complejo` | FK→Usuario (`email_administrador`) |
| `Cancha` | `id_cancha` | FK→Complejo |
| `Reserva` | `id_reserva` | FK→Cancha, FK→Cliente; estados: `Pendiente\|Pagada\|Cancelada\|Ausente` |
| `Pago` | `id_pago` | FK→Reserva |
| `Equipamiento` | `id_equipamiento` | FK→Complejo; campos: `stock`, `stock_disponible` |
| `ReservaEquipamiento` | `(id_reserva, id_equipamiento)` | tabla asociativa M:N |
| `Reseña` | `id_reseña` | FK→Cliente, FK→Cancha; calificacion 1–5 |
| `Inasistencia` | `id_inasistencia` | FK→Cliente; tiene `fecha_caducidad` |

Patrón de herencia: **Class Table Inheritance** (garantiza 3FN).

---

## Casos de Uso — Tabla Resumen

| ID | Nombre | Actor principal |
|----|--------|----------------|
| CU-01 | Crear cuenta (cliente) | Usuario cliente |
| CU-02 | Iniciar sesión | Cliente / Auxiliar / Admin |
| CU-03 | Cerrar sesión | Cliente / Auxiliar / Admin |
| CU-04 | Ver cuenta | Cliente / Auxiliar / Admin |
| CU-05 | Modificar cuenta | Cliente / Auxiliar / Admin |
| CU-06 | Reservar turno | Usuario cliente |
| CU-07 | Cancelar turno | Usuario cliente |
| CU-08 | Pagar turno | Usuario cliente |
| CU-09 | Ver ubicación del complejo | Usuario cliente |
| CU-10 | Ver canchas disponibles | Usuario cliente |
| CU-11 | Buscar jugador | Usuario cliente |
| CU-12 | Reportar complejo | Usuario cliente |
| CU-13 | Solicitar equipamiento | Usuario cliente |
| CU-14 | Buscar equipo | Usuario cliente |
| CU-15 | Crear cuenta (admin) | Administrador |
| CU-16 | Agregar cancha | Administrador |
| CU-17 | Eliminar cancha | Administrador |
| CU-17.1 | Editar info. cancha | Administrador |
| CU-18 | Agregar complejo | Administrador |
| CU-19 | Eliminar complejo | Administrador |
| CU-19.1 | Editar info. complejo | Administrador |
| CU-20 | Notificar estado de cancha | Admin / Auxiliar |
| CU-21 | Registrar inasistencia | Admin / Auxiliar |
| CU-22 | Gestionar inventario | Admin / Auxiliar |
| CU-23 | Consultar estadísticas | Administrador |
| CU-24 | Registrar reserva manual | Admin / Auxiliar |
| CU-25 | Consultar disponibilidad | Admin / Auxiliar |
| CU-26 | Crear cuenta (auxiliar) | Administrador |

---

## Reglas de Negocio Importantes

- **Sin superposición:** no pueden existir dos reservas para la misma cancha en el mismo horario (RNF-06).
- **Horario de funcionamiento:** las reservas solo se pueden crear dentro del `horario_apertura`–`horario_cierre` de la cancha (RNF-15).
- **Cancelación con límite:** solo se puede cancelar una reserva hasta un tiempo máximo previo al inicio del turno (RNF-12).
- **Stock de equipamiento:** `stock_disponible` ≤ `stock`; nunca puede quedar negativo (RNF-14).
- **Penalizaciones por inasistencia:** las inasistencias se acumulan; superado un umbral dentro del período de `fecha_caducidad`, se aplica penalización al cliente (RF-28, RNF-13).
- **Rol en reserva:** `email_cliente` en Reserva debe apuntar a un Usuario con `rol = 'cliente'`.
- **Calificaciones:** el campo `calificacion` en Reseña acepta solo valores entre 1 y 5.
- **Un administrador puede gestionar múltiples complejos.**
- **Un auxiliar pertenece a un único complejo** (`id_complejo` NOT NULL).

---

## Convenciones de Código

- **TypeScript estricto** (`strict: true` en tsconfig).
- Nombres de variables de dominio **en español**: `reserva`, `cancha`, `complejo`, `equipamiento`, `inasistencia`.
- Comentarios **en español**.
- Seguir principios **SOLID** (requisito de evaluación de la materia).
- Seguir las convenciones del App Router de Next.js (Server Components por defecto, Client Components solo cuando necesario).
- Leer `node_modules/next/dist/docs/` ante dudas sobre la versión actual de Next.js (ver AGENTS.md).

---

## Comandos Útiles

```bash
# Desarrollo
pnpm run dev          # Next.js en modo desarrollo (puerto 3000)
pnpm run build        # Build de producción
pnpm run lint         # ESLint

# Prisma (ejecutar desde raíz o desde backend/)
pnpm exec prisma migrate dev      # Crear y aplicar migración
pnpm exec prisma migrate deploy   # Aplicar migraciones en producción
pnpm exec prisma generate         # Regenerar cliente Prisma
pnpm exec prisma studio           # UI visual de la base de datos
pnpm exec prisma db push          # Push del schema sin migración (dev rápido)
```
