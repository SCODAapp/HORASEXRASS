/*
  Arreglar políticas de inserción de perfiles

  Descripción:
  Agregar política que permita a usuarios autenticados crear su propio perfil
  durante el registro. También crear trigger para automatizar la creación
  del perfil cuando se registra un nuevo usuario.

  1. Políticas nuevas
    - Permitir INSERT a usuarios autenticados para crear su propio perfil
  
  2. Trigger automático
    - Crear perfil automáticamente cuando se registra un nuevo usuario
    - Copiar datos de metadata (full_name, role) al perfil
*/

-- Agregar política de INSERT para profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Crear función que se ejecuta automáticamente al crear usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que ejecuta la función al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
