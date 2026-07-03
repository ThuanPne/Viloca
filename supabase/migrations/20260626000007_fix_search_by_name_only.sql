CREATE OR REPLACE FUNCTION search_locations(
  search_query     TEXT    DEFAULT '',
  city_code        TEXT    DEFAULT NULL,
  category_keyword TEXT    DEFAULT NULL
)
RETURNS SETOF locations
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM locations
  WHERE
    verified = true
    AND is_active = true
    AND (search_query = '' OR unaccent(name) ILIKE unaccent('%' || search_query || '%'))
    AND (city_code IS NULL OR city = city_code)
    AND (category_keyword IS NULL OR unaccent(coalesce(category, '')) ILIKE unaccent('%' || category_keyword || '%'))
  ORDER BY
    CASE WHEN unaccent(name) ILIKE unaccent(search_query || '%') THEN 0 ELSE 1 END,
    name
  LIMIT 50;
$$;
