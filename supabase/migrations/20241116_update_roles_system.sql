-- Migración: Sistema de Roles con Metadata
-- Fecha: 2024-11-16
-- Descripción: Actualizar sistema de roles para soportar asignación automática desde metadata de signup

-- PASO 1: Asegurar que la columna 'role' existe y tiene el tipo correcto
DO $$ 
BEGIN
    -- Verificar si la columna existe, si no, crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'buyer';
    END IF;
END $$;

-- PASO 2: Agregar constraint para validar roles permitidos
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_role_check'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    
    -- Agregar nuevo constraint
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('buyer', 'organizer'));
END $$;

-- PASO 3: Crear índice para búsquedas rápidas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- PASO 4: Actualizar función handle_new_user para leer rol desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Obtener rol desde raw_user_meta_data (enviado durante signup)
  -- Si no existe, usar 'buyer' por defecto
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role', 
    'buyer'
  );
  
  -- Validar que el rol sea válido
  IF user_role NOT IN ('buyer', 'organizer') THEN
    user_role := 'buyer';
  END IF;
  
  -- Insertar perfil con el rol correspondiente
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Recrear el trigger (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 6: Agregar comentarios descriptivos
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: buyer (comprador) u organizer (organizador de eventos). Un email solo puede tener un rol.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un usuario. Lee el rol desde metadata de signup (raw_user_meta_data.role).';

-- PASO 7: Validar que no existan roles inválidos en datos existentes
-- (Actualizar cualquier rol inválido a 'buyer')
UPDATE public.profiles 
SET role = 'buyer' 
WHERE role IS NULL OR role NOT IN ('buyer', 'organizer');

-- PASO 8: Hacer la columna 'role' NOT NULL (ahora que todos tienen valor válido)
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'buyer';

-- PASO 9: Crear vista helper para estadísticas de roles (opcional pero útil)
CREATE OR REPLACE VIEW public.role_statistics AS
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_last_7_days
FROM public.profiles
GROUP BY role;

COMMENT ON VIEW public.role_statistics IS 'Estadísticas de usuarios por rol. Útil para analytics del dashboard.';

-- PASO 10: Crear función helper para verificar rol de usuario (para usar en RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Obtiene el rol de un usuario. Útil para políticas RLS.';

-- Fin de la migración
