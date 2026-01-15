-- Add tritype field to personality_votes table
ALTER TABLE personality_votes ADD COLUMN IF NOT EXISTS tritype TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN personality_votes.tritype IS 'Enneagram Tritype (e.g., 358, 469, 125)';
