-- Migración: Asegurar independencia total entre roles de compradores y organizadores
-- Fecha: 2024-11-18
-- Descripción: Agregar constraint único compuesto para email + role y función para verificar cambios de rol

-- PASO 1: Crear índice único compuesto (email, role)
-- Esto permite que el mismo email exista con diferentes roles
DROP INDEX IF EXISTS idx_profiles_email_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_role_unique 
ON public.profiles(email, role);

-- PASO 2: Función para prevenir cambios de rol una vez asignado
-- Un usuario no puede cambiar de buyer a organizer o viceversa
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo aplicar en UPDATE, no en INSERT
  IF TG_OP = 'UPDATE' THEN
    -- Si el rol está cambiando
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'No se puede cambiar el rol de un usuario una vez asignado. Rol actual: %, Rol intentado: %', OLD.role, NEW.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Crear trigger para prevenir cambios de rol
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- PASO 4: Comentarios
COMMENT ON FUNCTION public.prevent_role_change() IS 'Previene que un usuario cambie de rol (buyer <-> organizer) una vez asignado';
COMMENT ON INDEX idx_profiles_email_role_unique IS 'Índice único compuesto que permite el mismo email con diferentes roles (buyer y organizer)';

-- PASO 5: Grant necesarios
GRANT EXECUTE ON FUNCTION public.prevent_role_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_role_change() TO service_role;
