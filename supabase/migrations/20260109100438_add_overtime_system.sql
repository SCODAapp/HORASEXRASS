/*
  Agregar Sistema de Horas Extras

  Descripción:
  Este migration agrega funcionalidad de gestión de horas extras al sistema existente.

  1. Modificaciones a tabla profiles
    - Agregar columna email (text)
    - Agregar columna role (text) con valores 'employee' o 'employer'

  2. Nueva tabla overtime_requests
    - id (uuid, primary key) - ID único
    - employee_id (uuid) - ID del empleado
    - date (date) - Fecha de las horas extras
    - hours (numeric) - Cantidad de horas
    - description (text) - Descripción del trabajo
    - status (text) - Estado: 'pending', 'approved', 'rejected'
    - approved_by (uuid, opcional) - ID del empleador que aprobó
    - latitude (numeric, opcional) - Latitud de ubicación
    - longitude (numeric, opcional) - Longitud de ubicación
    - location_name (text, opcional) - Nombre del lugar
    - created_at (timestamp) - Fecha de creación
    - updated_at (timestamp) - Fecha de actualización

  3. Seguridad
    - Enable RLS en overtime_requests
    - Políticas para empleados: ver/crear sus propias solicitudes
    - Políticas para empleadores: ver todas las solicitudes, aprobar/rechazar
*/

-- Agregar columnas a profiles si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'employee' CHECK (role IN ('employee', 'employer'));
  END IF;
END $$;

-- Actualizar usuarios existentes con email de auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Hacer email obligatorio si aún no lo es
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
  END IF;
END $$;

-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de solicitudes de horas extras
CREATE TABLE IF NOT EXISTS overtime_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours numeric(5,2) NOT NULL CHECK (hours > 0),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES profiles(id),
  latitude numeric(10,8),
  longitude numeric(11,8),
  location_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_status ON overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_overtime_date ON overtime_requests(date);

-- Trigger para updated_at en overtime_requests
DROP TRIGGER IF EXISTS update_overtime_updated_at ON overtime_requests;
CREATE TRIGGER update_overtime_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS en overtime_requests
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para overtime_requests
DROP POLICY IF EXISTS "Employees can view own overtime requests" ON overtime_requests;
CREATE POLICY "Employees can view own overtime requests"
  ON overtime_requests FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

DROP POLICY IF EXISTS "Employees can create own overtime requests" ON overtime_requests;
CREATE POLICY "Employees can create own overtime requests"
  ON overtime_requests FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "Employees can update own pending requests" ON overtime_requests;
CREATE POLICY "Employees can update own pending requests"
  ON overtime_requests FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Employers can view all overtime requests" ON overtime_requests;
CREATE POLICY "Employers can view all overtime requests"
  ON overtime_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  );

DROP POLICY IF EXISTS "Employers can update overtime requests" ON overtime_requests;
CREATE POLICY "Employers can update overtime requests"
  ON overtime_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  );

DROP POLICY IF EXISTS "Employers can delete overtime requests" ON overtime_requests;
CREATE POLICY "Employers can delete overtime requests"
  ON overtime_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  );

-- Agregar política para que employers puedan ver todos los perfiles
DROP POLICY IF EXISTS "Employers can view all profiles" ON profiles;
CREATE POLICY "Employers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  );
