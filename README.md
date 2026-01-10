# Hextras - Marketplace de Tareas

Hextras es una plataforma donde cualquier usuario puede publicar y realizar tareas. Diseñada para conectar a personas que necesitan ayuda con tareas cotidianas con quienes están disponibles para realizarlas.

## Características Principales

- **Publicar Tareas**: Cualquier usuario puede crear y publicar tareas con ubicación, fecha y descripción
- **Tomar Tareas**: Los usuarios pueden buscar tareas disponibles y tomarlas instantáneamente
- **Mapa Interactivo**: Vista de mapa mostrando todas las tareas disponibles con su ubicación GPS
- **Sistema de Calificación**: Los creadores de tareas califican a quienes las realizan (1-5 estrellas)
- **Ranking de Usuarios**: Sistema de reputación basado en calificaciones recibidas
- **Asignación Inteligente**: Si dos usuarios intentan tomar la misma tarea simultáneamente, se asigna automáticamente al usuario con mejor ranking

## Flujo de la Aplicación

1. **Registro**: Los usuarios crean una cuenta (sin roles, todos son iguales)
2. **Publicar Tarea**: Cualquier usuario puede crear una tarea con:
   - Título y descripción
   - Ubicación (ciudad/zona + coordenadas GPS opcionales)
   - Fecha y hora programada (opcional)
3. **Buscar Tareas**: Los usuarios pueden ver tareas disponibles en:
   - Vista de lista con filtros
   - Vista de mapa con ubicaciones
4. **Tomar Tarea**: Hacer clic en "Tomar Esta Tarea" para asignarla instantáneamente
5. **Completar**: El creador marca la tarea como completada cuando se finaliza
6. **Calificar**: El creador califica al usuario que realizó la tarea (1-5 estrellas)

## Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Mapa**: Leaflet + React Leaflet
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: CSS personalizado

## Base de Datos

### Tablas Principales

#### `profiles`
- Perfil de usuario con nombre, teléfono
- `rating`: Promedio de calificaciones (0-5)
- `total_ratings`: Número total de calificaciones recibidas
- `completed_tasks`: Contador de tareas completadas
- `published_tasks`: Contador de tareas publicadas

#### `tasks`
- Información de la tarea (título, descripción, ubicación)
- `creator_id`: Usuario que publicó la tarea
- `assigned_to`: Usuario asignado a la tarea
- `status`: available | assigned | in_progress | completed | rated
- Coordenadas GPS para mostrar en mapa
- Fecha y hora programada

#### `task_ratings`
- Calificación de usuario por tarea completada
- `rated_user_id`: Usuario calificado (quien realizó la tarea)
- `rating_user_id`: Usuario que califica (quien publicó la tarea)
- `rating`: 1-5 estrellas
- `comment`: Comentario opcional

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Variables de Entorno

Crear un archivo `.env` con:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los usuarios solo pueden tomar tareas que no sean propias
- Solo el creador puede marcar como completada y calificar
- Políticas restrictivas por defecto

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── TaskList.tsx    # Lista de tareas con filtros
│   ├── TaskMap.tsx     # Mapa con marcadores de tareas
│   ├── TaskDetail.tsx  # Detalle y acciones de tarea
│   ├── CreateTask.tsx  # Formulario para crear tarea
│   ├── Profile.tsx     # Perfil de usuario
│   ├── Login.tsx       # Inicio de sesión
│   └── Register.tsx    # Registro de usuario
├── contexts/           # Context API
│   └── AuthContext.tsx # Contexto de autenticación
├── lib/                # Utilidades
│   └── supabase.ts     # Cliente y tipos de Supabase
├── App.tsx             # Componente principal
├── App.css             # Estilos globales
├── main.tsx            # Punto de entrada
└── index.css           # CSS base
```
