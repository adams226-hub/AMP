-- ============================================================
-- MIGRATION : Téléphone + Trigger + RLS Profiles
-- African Mining Partenair SARL
-- 2026-04-30
-- ============================================================

-- 1. Ajouter la colonne téléphone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Politique RLS : les utilisateurs authentifiés peuvent gérer tous les profils
--    (nécessaire pour que l'admin puisse créer/modifier des profils d'autres utilisateurs)
DROP POLICY IF EXISTS "Users can insert their own profile."  ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile."  ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated full access profiles" ON public.profiles;

CREATE POLICY "Authenticated full access profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Mettre à jour le trigger handle_new_user pour stocker username, role, phone
--    depuis les user_metadata passés au moment de signUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, department, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username',   split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name',  NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role',       'operator'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    username   = COALESCE(EXCLUDED.username,   profiles.username),
    full_name  = COALESCE(EXCLUDED.full_name,  profiles.full_name),
    role       = COALESCE(EXCLUDED.role,       profiles.role),
    department = COALESCE(EXCLUDED.department, profiles.department),
    phone      = COALESCE(EXCLUDED.phone,      profiles.phone);
  RETURN NEW;
END;
$$;

-- Recréer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
