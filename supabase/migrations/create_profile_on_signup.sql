-- Migración para crear automáticamente un perfil cuando un usuario se registra

-- Función para crear el perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'buyer' -- Por defecto todos son compradores
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si ya existe
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un nuevo usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentarios
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil en profiles cuando se registra un nuevo usuario';
