-- 创建搜索函数
CREATE OR REPLACE FUNCTION search_works(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name_cn TEXT,
  name_en TEXT,
  name_jp TEXT,
  type JSONB,
  poster_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name_cn,
    w.name_en,
    w.name_jp,
    w.type,
    w.poster_url
  FROM works w
  WHERE 
    w.name_cn ILIKE '%' || search_query || '%' OR
    w.name_en ILIKE '%' || search_query || '%' OR
    w.name_jp ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

