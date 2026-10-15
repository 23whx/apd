// Helpers for aggregating personality_votes rows on the client.

export const VOTE_FIELDS = ['mbti', 'enneagram', 'subtype', 'tritype', 'yi_hexagram'] as const;
export type VoteField = typeof VOTE_FIELDS[number];

export type VoteRow = { character_id?: string } & Partial<Record<VoteField, string | null>>;

export interface TopPersonality {
  top_mbti?: string;
  top_enneagram?: string;
  top_subtype?: string;
  top_yi?: string;
}

/** Count votes per value for each field. */
export function countVotes(votes: VoteRow[]): Record<VoteField, Record<string, number>> {
  const stats = {
    mbti: {},
    enneagram: {},
    subtype: {},
    tritype: {},
    yi_hexagram: {},
  } as Record<VoteField, Record<string, number>>;

  for (const vote of votes) {
    for (const field of VOTE_FIELDS) {
      const value = vote[field];
      if (value) stats[field][value] = (stats[field][value] || 0) + 1;
    }
  }
  return stats;
}

/** The most-voted value in a count map (first one wins on ties). */
export function topOf(counts: Record<string, number>): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const [value, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/** Group votes by character in one pass and return the most-voted type per field for each character. */
export function topPersonalitiesByCharacter(votes: VoteRow[] | null | undefined): Map<string, TopPersonality> {
  const grouped = new Map<string, VoteRow[]>();
  for (const vote of votes ?? []) {
    if (!vote.character_id) continue;
    const list = grouped.get(vote.character_id);
    if (list) list.push(vote);
    else grouped.set(vote.character_id, [vote]);
  }

  const result = new Map<string, TopPersonality>();
  for (const [characterId, charVotes] of grouped) {
    const stats = countVotes(charVotes);
    result.set(characterId, {
      top_mbti: topOf(stats.mbti),
      top_enneagram: topOf(stats.enneagram),
      top_subtype: topOf(stats.subtype),
      top_yi: topOf(stats.yi_hexagram),
    });
  }
  return result;
}
