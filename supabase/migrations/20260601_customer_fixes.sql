-- Nuevos campos de dirección mexicana en tabla addresses
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS num_exterior text,
  ADD COLUMN IF NOT EXISTS num_interior text,
  ADD COLUMN IF NOT EXISTS colonia      text,
  ADD COLUMN IF NOT EXISTS municipio    text,
  ADD COLUMN IF NOT EXISTS referencias  text;

-- Trigger: copiar full_name del user_metadata al crear perfil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
