-- Per-character vote summary, aggregated in the database.
--
-- Used by the MBTI type hub pages (/mbti/:type) and by the build-time prerender/sitemap scripts.
-- Aggregating here avoids pulling every vote row to the client (PostgREST caps responses at 1000 rows,
-- which silently truncates client-side counts once a character set has many votes).
--
-- security_invoker = true: the view runs with the caller's privileges, so the existing RLS policies on
-- characters / works / personality_votes still apply (anon can already read all three).

CREATE INDEX IF NOT EXISTS idx_personality_votes_character_id ON personality_votes (character_id);

CREATE OR REPLACE VIEW character_personality_summary
WITH (security_invoker = true) AS
SELECT
  c.id            AS character_id,
  c.work_id,
  c.name_cn,
  c.name_en,
  c.name_jp,
  c.avatar_url,
  w.name_cn       AS work_name_cn,
  w.name_en       AS work_name_en,
  w.name_jp       AS work_name_jp,
  COALESCE(t.vote_count, 0) AS vote_count,
  m.value         AS top_mbti,
  m.votes         AS top_mbti_votes,
  e.value         AS top_enneagram,
  s.value         AS top_subtype,
  tt.value        AS top_tritype,
  y.value         AS top_yi_hexagram
FROM characters c
LEFT JOIN works w ON w.id = c.work_id
LEFT JOIN LATERAL (
  SELECT count(*) AS vote_count FROM personality_votes pv WHERE pv.character_id = c.id
) t ON true
LEFT JOIN LATERAL (
  SELECT pv.mbti AS value, count(*) AS votes FROM personality_votes pv
  WHERE pv.character_id = c.id AND pv.mbti IS NOT NULL
  GROUP BY pv.mbti ORDER BY count(*) DESC, pv.mbti LIMIT 1
) m ON true
LEFT JOIN LATERAL (
  SELECT pv.enneagram AS value FROM personality_votes pv
  WHERE pv.character_id = c.id AND pv.enneagram IS NOT NULL
  GROUP BY pv.enneagram ORDER BY count(*) DESC, pv.enneagram LIMIT 1
) e ON true
LEFT JOIN LATERAL (
  SELECT pv.subtype AS value FROM personality_votes pv
  WHERE pv.character_id = c.id AND pv.subtype IS NOT NULL
  GROUP BY pv.subtype ORDER BY count(*) DESC, pv.subtype LIMIT 1
) s ON true
LEFT JOIN LATERAL (
  SELECT pv.tritype AS value FROM personality_votes pv
  WHERE pv.character_id = c.id AND pv.tritype IS NOT NULL
  GROUP BY pv.tritype ORDER BY count(*) DESC, pv.tritype LIMIT 1
) tt ON true
LEFT JOIN LATERAL (
  SELECT pv.yi_hexagram AS value FROM personality_votes pv
  WHERE pv.character_id = c.id AND pv.yi_hexagram IS NOT NULL
  GROUP BY pv.yi_hexagram ORDER BY count(*) DESC, pv.yi_hexagram LIMIT 1
) y ON true;

GRANT SELECT ON character_personality_summary TO anon, authenticated;

COMMENT ON VIEW character_personality_summary IS
  'One row per character with vote count and the most-voted type per system (ties broken alphabetically).';
