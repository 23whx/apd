// Personality type constants based on project documentation

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
] as const;

export const ENNEAGRAM_TYPES = [
  '1w9', '1w2',
  '2w1', '2w3',
  '3w2', '3w4',
  '4w3', '4w5',
  '5w4', '5w6',
  '6w5', '6w7',
  '7w6', '7w8',
  '8w7', '8w9',
  '9w8', '9w1'
] as const;

export const SUBTYPES = ['sp/sx', 'sp/so', 'sx/sp', 'sx/so', 'so/sp', 'so/sx'] as const;

// 64 Hexagrams from Yi Jing (易经六十四卦)
export const YI_HEXAGRAMS = [
  { id: '1', name_cn: '乾为天', symbol: '䷀', type: '创造型/领袖型' },
  { id: '2', name_cn: '坤为地', symbol: '䷁', type: '承载型/人本型' },
  { id: '3', name_cn: '水雷屯', symbol: '䷂', type: '冒险型' },
  { id: '4', name_cn: '山水蒙', symbol: '䷃', type: '学习型' },
  { id: '5', name_cn: '水天需', symbol: '䷄', type: '等待型' },
  { id: '6', name_cn: '天水讼', symbol: '䷅', type: '争辩型' },
  { id: '7', name_cn: '地水师', symbol: '䷆', type: '统帅型' },
  { id: '8', name_cn: '水地比', symbol: '䷇', type: '亲和型' },
  { id: '9', name_cn: '风天小畜', symbol: '䷈', type: '积蓄型' },
  { id: '10', name_cn: '天泽履', symbol: '䷉', type: '践行型' },
  { id: '11', name_cn: '地天泰', symbol: '䷊', type: '通泰型' },
  { id: '12', name_cn: '天地否', symbol: '䷋', type: '闭塞型' },
  { id: '13', name_cn: '天火同人', symbol: '䷌', type: '社交型' },
  { id: '14', name_cn: '火天大有', symbol: '䷍', type: '富有型' },
  { id: '15', name_cn: '地山谦', symbol: '䷎', type: '谦逊型' },
  { id: '16', name_cn: '雷地豫', symbol: '䷏', type: '喜悦型' },
  { id: '17', name_cn: '泽雷随', symbol: '䷐', type: '追随型' },
  { id: '18', name_cn: '山风蛊', symbol: '䷑', type: '革新型' },
  { id: '19', name_cn: '地泽临', symbol: '䷒', type: '临近型' },
  { id: '20', name_cn: '风地观', symbol: '䷓', type: '观察型' },
  { id: '21', name_cn: '火雷噬嗑', symbol: '䷔', type: '决断型' },
  { id: '22', name_cn: '山火贲', symbol: '䷕', type: '装饰型' },
  { id: '23', name_cn: '山地剥', symbol: '䷖', type: '剥落型' },
  { id: '24', name_cn: '地雷复', symbol: '䷗', type: '回归型' },
  { id: '25', name_cn: '天雷无妄', symbol: '䷘', type: '无妄型' },
  { id: '26', name_cn: '山天大畜', symbol: '䷙', type: '蓄养型' },
  { id: '27', name_cn: '山雷颐', symbol: '䷚', type: '养育型' },
  { id: '28', name_cn: '泽风大过', symbol: '䷛', type: '超越型' },
  { id: '29', name_cn: '坎为水', symbol: '䷜', type: '陷入型' },
  { id: '30', name_cn: '离为火', symbol: '䷝', type: '光明型' },
  { id: '31', name_cn: '泽山咸', symbol: '䷞', type: '感应型' },
  { id: '32', name_cn: '雷风恒', symbol: '䷟', type: '恒久型' },
  { id: '33', name_cn: '天山遁', symbol: '䷠', type: '退隐型' },
  { id: '34', name_cn: '雷天大壮', symbol: '䷡', type: '强壮型' },
  { id: '35', name_cn: '火地晋', symbol: '䷢', type: '进取型' },
  { id: '36', name_cn: '地火明夷', symbol: '䷣', type: '韬光型' },
  { id: '37', name_cn: '风火家人', symbol: '䷤', type: '家庭型' },
  { id: '38', name_cn: '火泽睽', symbol: '䷥', type: '分离型' },
  { id: '39', name_cn: '水山蹇', symbol: '䷦', type: '困难型' },
  { id: '40', name_cn: '雷水解', symbol: '䷧', type: '解脱型' },
  { id: '41', name_cn: '山泽损', symbol: '䷨', type: '损减型' },
  { id: '42', name_cn: '风雷益', symbol: '䷩', type: '增益型' },
  { id: '43', name_cn: '泽天夬', symbol: '䷪', type: '决裂型' },
  { id: '44', name_cn: '天风姤', symbol: '䷫', type: '遇合型' },
  { id: '45', name_cn: '泽地萃', symbol: '䷬', type: '聚集型' },
  { id: '46', name_cn: '地风升', symbol: '䷭', type: '上升型' },
  { id: '47', name_cn: '泽水困', symbol: '䷮', type: '困境型' },
  { id: '48', name_cn: '水风井', symbol: '䷯', type: '供养型' },
  { id: '49', name_cn: '泽火革', symbol: '䷰', type: '变革型' },
  { id: '50', name_cn: '火风鼎', symbol: '䷱', type: '鼎立型' },
  { id: '51', name_cn: '震为雷', symbol: '䷲', type: '震动型' },
  { id: '52', name_cn: '艮为山', symbol: '䷳', type: '静止型' },
  { id: '53', name_cn: '风山渐', symbol: '䷴', type: '渐进型' },
  { id: '54', name_cn: '雷泽归妹', symbol: '䷵', type: '归属型' },
  { id: '55', name_cn: '雷火丰', symbol: '䷶', type: '丰盛型' },
  { id: '56', name_cn: '火山旅', symbol: '䷷', type: '旅行型' },
  { id: '57', name_cn: '巽为风', symbol: '䷸', type: '顺从型' },
  { id: '58', name_cn: '兑为泽', symbol: '䷹', type: '愉悦型' },
  { id: '59', name_cn: '风水涣', symbol: '䷺', type: '涣散型' },
  { id: '60', name_cn: '水泽节', symbol: '䷻', type: '节制型' },
  { id: '61', name_cn: '风泽中孚', symbol: '䷼', type: '诚信型' },
  { id: '62', name_cn: '雷山小过', symbol: '䷽', type: '小过型' },
  { id: '63', name_cn: '水火既济', symbol: '䷾', type: '完成型' },
  { id: '64', name_cn: '火水未济', symbol: '䷿', type: '未完型' }
] as const;

export type MBTIType = typeof MBTI_TYPES[number];
export type EnneagramType = typeof ENNEAGRAM_TYPES[number];
export type SubtypeType = typeof SUBTYPES[number];
export type YiHexagramType = typeof YI_HEXAGRAMS[number];

// Preset avatar IDs (EVA-style avatars)
export const PRESET_AVATARS = Array.from({ length: 20 }, (_, i) => i + 1);

export interface Work {
  id: string;
  name_cn: string;
  name_en?: string;
  name_jp?: string;
  type: ('anime' | 'manga' | 'game' | 'novel')[]; // 改为数组
  poster_url?: string; // 海报/封面图
  summary_md?: string;
  source_urls?: Record<string, string>;
  created_at: string;
}

export interface Character {
  id: string;
  work_id: string;
  name_cn: string;
  name_en?: string;
  name_jp?: string;
  avatar_url?: string;
  summary_md?: string;
  source_link?: string;
  created_at: string;
}

export interface PersonalityVote {
  id: string;
  character_id: string;
  user_id: string;
  mbti?: MBTIType;
  enneagram?: EnneagramType;
  subtype?: SubtypeType;
  yi_hexagram?: string;
  created_at: string;
}

export interface VoteStatistics {
  mbti: Record<string, number>;
  enneagram: Record<string, number>;
  subtype: Record<string, number>;
  yi_hexagram: Record<string, number>;
}

