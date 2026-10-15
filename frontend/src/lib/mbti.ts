// MBTI type hub content: temperament groups and a short original description per type (en / zh / ja).
import { MBTI_TYPES, type MBTIType } from './types';
import type { SeoLang } from './seo';

export const isMbtiType = (value: string | undefined | null): value is MBTIType =>
  !!value && (MBTI_TYPES as readonly string[]).includes(value.toUpperCase());

export const mbtiPath = (type: string) => `/mbti/${type.toLowerCase()}`;

type Localized = Record<SeoLang, string>;

export const MBTI_GROUPS: { id: string; label: Localized; types: MBTIType[] }[] = [
  { id: 'nt', label: { en: 'NT · Rationals', zh: 'NT · 理性者', ja: 'NT · 合理主義者' }, types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { id: 'nf', label: { en: 'NF · Idealists', zh: 'NF · 理想主义者', ja: 'NF · 理想主義者' }, types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { id: 'sj', label: { en: 'SJ · Guardians', zh: 'SJ · 守护者', ja: 'SJ · 保護者' }, types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { id: 'sp', label: { en: 'SP · Artisans', zh: 'SP · 技艺者', ja: 'SP · 職人' }, types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];

export const MBTI_SUMMARY: Record<MBTIType, Localized> = {
  INTJ: { en: 'Strategic, independent planners who trust their own long-range vision.', zh: '独立的战略家，相信自己的长远规划。', ja: '長期的なビジョンを信じる独立した戦略家。' },
  INTP: { en: 'Curious analysts who chase ideas and internal consistency.', zh: '追求逻辑自洽、对理论充满好奇的分析者。', ja: '理論と論理の一貫性を追い求める探究者。' },
  ENTJ: { en: 'Decisive commanders who organize people toward ambitious goals.', zh: '果断的指挥者，带领众人实现宏大目标。', ja: '人を率いて大きな目標に向かう決断力ある指揮官。' },
  ENTP: { en: 'Inventive debaters who love testing possibilities and rules.', zh: '热衷辩论、喜欢试探规则边界的创新者。', ja: '可能性とルールの限界を試すのが好きな発明家。' },
  INFJ: { en: 'Insightful idealists guided by a deep sense of meaning.', zh: '富有洞察力、追寻深层意义的理想主义者。', ja: '深い意味を求める洞察力のある理想主義者。' },
  INFP: { en: 'Sincere dreamers led by personal values and imagination.', zh: '忠于内心价值与想象力的真诚梦想家。', ja: '自分の価値観と想像力に従う誠実な夢想家。' },
  ENFJ: { en: 'Charismatic mentors who rally others around shared ideals.', zh: '富有感召力、以共同理想凝聚他人的引导者。', ja: '共通の理想で人々をまとめるカリスマ的な導き手。' },
  ENFP: { en: 'Enthusiastic free spirits who see potential everywhere.', zh: '热情奔放、处处看见可能性的自由灵魂。', ja: 'あらゆる所に可能性を見出す情熱的な自由人。' },
  ISTJ: { en: 'Dependable guardians of duty, order and tradition.', zh: '可靠的守护者，重视责任、秩序与传统。', ja: '責任・秩序・伝統を守る頼れる守護者。' },
  ISFJ: { en: 'Quiet protectors devoted to caring for the people around them.', zh: '默默守护身边之人的温柔保护者。', ja: '身近な人を静かに支える献身的な守り手。' },
  ESTJ: { en: 'Practical organizers who enforce standards and get things done.', zh: '务实的组织者，坚持标准、把事情办成。', ja: '基準を守り物事をやり遂げる実務的なまとめ役。' },
  ESFJ: { en: 'Warm hosts who keep their community connected and cared for.', zh: '热心周到、维系群体和谐的照顾者。', ja: '仲間の和を保つ温かい世話役。' },
  ISTP: { en: 'Cool-headed troubleshooters who learn by taking things apart.', zh: '冷静务实、动手解决问题的技术派。', ja: '物事を分解して理解する冷静な問題解決者。' },
  ISFP: { en: 'Gentle artists who live in the moment and follow their heart.', zh: '活在当下、追随内心的温柔艺术家。', ja: '今を生き心に従う穏やかな芸術家。' },
  ESTP: { en: 'Bold risk-takers who thrive on action and quick thinking.', zh: '大胆果敢、在行动中如鱼得水的冒险家。', ja: '行動と瞬発力で輝く大胆な冒険家。' },
  ESFP: { en: 'Spontaneous entertainers who light up every room.', zh: '随性开朗、点亮全场的表演者。', ja: 'その場を明るくする自由奔放なエンターテイナー。' },
};

/** Row shape of the character_personality_summary view (supabase/migrations/20261015_*). */
export interface CharacterSummaryRow {
  character_id: string;
  work_id: string;
  name_cn: string | null;
  name_en: string | null;
  name_jp: string | null;
  avatar_url: string | null;
  work_name_cn: string | null;
  work_name_en: string | null;
  work_name_jp: string | null;
  vote_count: number;
  top_mbti: string | null;
  top_mbti_votes: number | null;
  top_enneagram: string | null;
  top_subtype: string | null;
  top_tritype: string | null;
  top_yi_hexagram: string | null;
}
