/*
  Limpiar y corregir políticas de profiles

  Descripción:
  Eliminar política insegura y simplificar las políticas de acceso a perfiles.

  1. Cambios de seguridad
    - Eliminar política "Anyone can view profiles" (insegura)
    - Mantener solo la política que permite ver tu propio perfil o todos si eres employer
  
  2. Políticas finales
    - SELECT: Ver tu propio perfil o todos si eres employer
    - INSERT: Crear tu propio perfil (usado por trigger)
    - UPDATE: Actualizar tu propio perfil
*/

-- Eliminar política insegura
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- La política "Employers can view all profiles" ya existe y es correcta
-- La política "Users can insert own profile" ya existe y es correcta
-- La política "Users can update own profile" ya existe y es correcta
