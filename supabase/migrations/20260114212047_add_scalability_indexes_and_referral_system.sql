/*
  # Escalabilidad + Sistema de Referidos

  ## 1. Índices de Performance (CRÍTICO para escalar)
    Cuando tengas 100K+ registros, las búsquedas serán lentas sin índices.
    - `idx_tasks_status` - Buscar tareas por estado (available, assigned, etc)
    - `idx_tasks_location` - Búsquedas geográficas rápidas
    - `idx_tasks_creator` - Ver tareas de un empleador
    - `idx_tasks_assigned` - Ver tareas de un trabajador
    - `idx_profiles_rating` - Ordenar usuarios por rating
    - `idx_task_ratings_rated_user` - Ver ratings de un usuario
    - `idx_task_applications_worker` - Ver aplicaciones de un trabajador
    - `idx_task_applications_task` - Ver aplicaciones de una tarea

  ## 2. Sistema de Referidos
    - Tabla `referrals` - Trackear quién refirió a quién
    - Cada usuario tiene un código único de referido (ej: "JUAN2024")
    - Cuando alguien se registra con tu código, ambos obtienen 50% descuento
    - Contador de referidos exitosos

  ## 3. Estructura de Suscripciones (preparada, NO activa aún)
    - Tabla `subscriptions` - Estado de suscripción de cada usuario
    - Por ahora todos tienen status 'free' (gratis)
    - Cuando decidas monetizar, cambias status a 'active' y agregas payment_provider
    - Trackea descuentos por referidos

  ## 4. Seguridad
    - RLS habilitado en todas las tablas nuevas
    - Solo puedes ver tus propios referidos
    - Solo puedes ver tu propia suscripción
*/

-- ============================================
-- PARTE 1: ÍNDICES DE PERFORMANCE
-- ============================================

-- Índices para tabla tasks (las búsquedas más frecuentes)
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_date, scheduled_time) WHERE scheduled_date IS NOT NULL;

-- Índices para tabla profiles
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices para tabla task_ratings
CREATE INDEX IF NOT EXISTS idx_task_ratings_rated_user ON task_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_rating_user ON task_ratings(rating_user_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_task ON task_ratings(task_id);

-- Índices para tabla task_applications
CREATE INDEX IF NOT EXISTS idx_task_applications_worker ON task_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_task ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON task_applications(status);

-- ============================================
-- PARTE 2: SISTEMA DE REFERIDOS
-- ============================================

-- Agregar código de referido único a cada perfil
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'successful_referrals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN successful_referrals INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'has_referral_discount'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_referral_discount BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Crear índice para búsquedas por código de referido
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Tabla de historial de referidos (quién refirió a quién y cuándo)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(referred_id)
);

-- Habilitar RLS en referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para referrals
CREATE POLICY "Users can view their own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

CREATE POLICY "Users can view their own referral as referred"
  ON referrals FOR SELECT
  TO authenticated
  USING (referred_id = auth.uid());

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices para referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- ============================================
-- PARTE 3: ESTRUCTURA DE SUSCRIPCIONES
-- ============================================

-- Tabla de suscripciones (por ahora todos free, preparada para futuro)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'free',
  plan_name TEXT DEFAULT 'free',
  discount_percentage INTEGER DEFAULT 0,
  monthly_price NUMERIC(10,2) DEFAULT 0.00,
  discounted_price NUMERIC(10,2) DEFAULT 0.00,
  payment_provider TEXT,
  subscription_id_external TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Habilitar RLS en subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- PARTE 4: FUNCIÓN PARA GENERAR CÓDIGO DE REFERIDO
-- ============================================

-- Función para generar código único de referido
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Crear código base desde el nombre (primeros 6 caracteres alfanuméricos en mayúsculas)
  base_code := UPPER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g'));
  base_code := LEFT(base_code, 6);
  
  -- Si el nombre es muy corto, usar parte del UUID
  IF LENGTH(base_code) < 4 THEN
    base_code := base_code || UPPER(SUBSTRING(REPLACE(user_id::TEXT, '-', '') FROM 1 FOR 6 - LENGTH(base_code)));
  END IF;
  
  final_code := base_code;
  
  -- Asegurar que el código sea único, agregar números si es necesario
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 5: TRIGGER PARA CREAR REFERRAL_CODE Y SUBSCRIPTION AUTOMÁTICAMENTE
-- ============================================

-- Función que se ejecuta cuando se crea un nuevo perfil
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Generar código de referido si no existe
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code(NEW.full_name, NEW.id);
  END IF;
  
  -- Crear suscripción gratuita automáticamente
  INSERT INTO subscriptions (user_id, status, plan_name)
  VALUES (NEW.id, 'free', 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_profile_created_setup ON profiles;
CREATE TRIGGER on_profile_created_setup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_setup();

-- Actualizar perfiles existentes con código de referido
UPDATE profiles 
SET referral_code = generate_referral_code(full_name, id)
WHERE referral_code IS NULL;

-- Crear suscripciones gratuitas para usuarios existentes
INSERT INTO subscriptions (user_id, status, plan_name)
SELECT id, 'free', 'free'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PARTE 6: FUNCIÓN PARA APLICAR REFERIDO
-- ============================================

-- Función para aplicar un código de referido (llamar cuando alguien se registre)
CREATE OR REPLACE FUNCTION apply_referral_code(p_user_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_already_referred BOOLEAN;
BEGIN
  -- Verificar si el usuario ya fue referido
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND referred_by IS NOT NULL
  ) INTO v_already_referred;
  
  IF v_already_referred THEN
    RETURN false; -- Ya fue referido
  END IF;
  
  -- Buscar el referrer por código
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code
  AND id != p_user_id; -- No puedes referirte a ti mismo
  
  IF v_referrer_id IS NULL THEN
    RETURN false; -- Código inválido
  END IF;
  
  -- Actualizar el perfil del usuario referido
  UPDATE profiles
  SET referred_by = v_referrer_id,
      has_referral_discount = true
  WHERE id = p_user_id;
  
  -- Incrementar contador de referidos exitosos
  UPDATE profiles
  SET successful_referrals = successful_referrals + 1,
      has_referral_discount = true
  WHERE id = v_referrer_id;
  
  -- Crear registro en tabla referrals
  INSERT INTO referrals (referrer_id, referred_id, referral_code)
  VALUES (v_referrer_id, p_user_id, p_referral_code);
  
  -- Aplicar descuento del 50% en ambas suscripciones
  UPDATE subscriptions
  SET discount_percentage = 50
  WHERE user_id IN (p_user_id, v_referrer_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS Y NOTAS
-- ============================================

COMMENT ON TABLE referrals IS 'Historial de referidos: quién refirió a quién';
COMMENT ON TABLE subscriptions IS 'Estado de suscripción de cada usuario. Por ahora todos free, preparado para monetización futura';
COMMENT ON COLUMN profiles.referral_code IS 'Código único para compartir con amigos (ej: JUAN2024)';
COMMENT ON COLUMN profiles.referred_by IS 'Usuario que te refirió (NULL si nadie)';
COMMENT ON COLUMN profiles.successful_referrals IS 'Cantidad de personas que referiste exitosamente';
COMMENT ON COLUMN profiles.has_referral_discount IS 'Tiene 50% de descuento por referidos (true si refirió a alguien O fue referido)';
COMMENT ON COLUMN subscriptions.discount_percentage IS '50% si tienes referidos exitosos, 0% si no';
