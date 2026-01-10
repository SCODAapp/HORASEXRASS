# Sistema de Gestión de Horas Extras

Aplicación web completa para gestionar solicitudes de horas extras con autenticación de usuarios, roles diferenciados y visualización en mapa.

## Características

- Autenticación segura con Supabase
- Roles de usuario: Empleado y Empleador
- Panel de empleado:
  - Crear solicitudes de horas extras
  - Ver historial de solicitudes
  - Agregar ubicación GPS a las solicitudes
  - Estadísticas personales
- Panel de empleador:
  - Ver todas las solicitudes de horas extras
  - Aprobar o rechazar solicitudes
  - Filtrar por estado
  - Estadísticas generales
- Visualización de ubicaciones en mapa interactivo
- Diseño responsive y moderno

## Tecnologías

- React 18 con TypeScript
- Vite
- Supabase (Base de datos + Autenticación)
- React Router para navegación
- Tailwind CSS para estilos
- Leaflet para mapas
- Lucide React para iconos
- date-fns para manejo de fechas

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Las variables de entorno ya están configuradas en `.env`

3. La base de datos ya está configurada con las tablas necesarias

## Desplegar en GitHub Pages

Para que el sitio funcione correctamente en GitHub Pages:

1. Ve a **Settings > Secrets and variables > Actions** en tu repositorio
2. Agrega estos secrets:
   - `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase
3. Ve a **Settings > Pages** y asegúrate de que esté habilitado GitHub Pages
4. El workflow se ejecutará automáticamente con cada push a main

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── EmployeeDashboard.tsx
│   ├── EmployerDashboard.tsx
│   ├── OvertimeForm.tsx
│   ├── MapView.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # Context API
│   └── AuthContext.tsx
├── pages/             # Páginas principales
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Dashboard.tsx
├── lib/               # Utilidades
│   └── supabase.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Base de Datos

### Tablas

- **profiles**: Perfiles de usuario con roles
- **overtime_requests**: Solicitudes de horas extras con ubicación

### Seguridad

Todas las tablas tienen Row Level Security (RLS) habilitado con políticas que garantizan:
- Los empleados solo ven sus propias solicitudes
- Los empleadores pueden ver todas las solicitudes
- Los usuarios solo pueden editar su propia información

## Uso

### Como Empleado

1. Registrarse seleccionando "Empleado"
2. Iniciar sesión
3. Crear solicitudes de horas extras
4. Agregar ubicación GPS (opcional)
5. Ver el estado de las solicitudes

### Como Empleador

1. Registrarse seleccionando "Empleador"
2. Iniciar sesión
3. Ver todas las solicitudes de empleados
4. Aprobar o rechazar solicitudes
5. Ver ubicaciones en el mapa
6. Consultar estadísticas
