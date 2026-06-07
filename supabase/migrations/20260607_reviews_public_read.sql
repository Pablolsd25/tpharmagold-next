-- Reseñas aprobadas visibles en tienda; escritura solo vía API (service_role)

GRANT SELECT ON reviews TO anon, authenticated;

CREATE POLICY reviews_select_approved ON reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);
