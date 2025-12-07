/**
 * Schema.org Structured Data for SEO
 * 
 * This provides rich snippets for search engines to better understand the site.
 * Add this to each page dynamically for optimal SEO.
 */

export interface SchemaOrgWebsite {
  '@context': string;
  '@type': string;
  name: string;
  alternateName?: string;
  url: string;
  description: string;
  inLanguage: string[];
  author: {
    '@type': string;
    name: string;
    url?: string;
    sameAs?: string[];
  };
  potentialAction: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

export interface SchemaOrgOrganization {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo?: string;
  description: string;
  sameAs: string[];
  contactPoint?: {
    '@type': string;
    email: string;
    contactType: string;
  };
}

// Website Schema
export const websiteSchema: SchemaOrgWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ACGN Personality Database',
  alternateName: 'APD',
  url: 'https://acgn-personality-database.top',
  description: 'A comprehensive database for exploring and analyzing personality types (MBTI, Enneagram, Instinctual Variants, Yi Hexagrams) of ACGN (Anime, Manga, Game, Novel) characters.',
  inLanguage: ['en', 'zh-CN', 'ja-JP'],
  author: {
    '@type': 'Person',
    name: 'Rollkey (小学生滚键式)',
    sameAs: [
      'https://twitter.com/Rollkey4',
      'https://github.com/Rollkey',
      'https://oumashu.top'
    ]
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://acgn-personality-database.top/works?search={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

// Organization Schema
export const organizationSchema: SchemaOrgOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'APD - ACGN Personality Database',
  url: 'https://acgn-personality-database.top',
  description: 'Open-source, community-driven platform for ACGN character personality analysis',
  sameAs: [
    'https://twitter.com/Rollkey4',
    'https://oumashu.top'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'wanghongxiang23@gmail.com',
    contactType: 'Customer Support'
  }
};

// Work/Creative Work Schema (template for individual work pages)
export const createWorkSchema = (work: {
  id: string;
  name: string;
  type: string[];
  description?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': work.id,
  name: work.name,
  genre: work.type.join(', '),
  description: work.description || 'ACGN work in the APD database',
  url: work.url,
  isPartOf: {
    '@type': 'WebSite',
    name: 'ACGN Personality Database',
    url: 'https://apd-eight.vercel.app'
  }
});

// Character/Person Schema (template for individual character pages)
export const createCharacterSchema = (character: {
  id: string;
  name: string;
  description?: string;
  url: string;
  workName?: string;
  imageUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': character.id,
  name: character.name,
  description: character.description || 'Character in the APD database',
  url: character.url,
  image: character.imageUrl,
  isPartOf: character.workName ? {
    '@type': 'CreativeWork',
    name: character.workName
  } : undefined
});

// Helper function to inject schema into <head>
export const injectSchema = (schema: any) => {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);

  return () => {
    document.head.removeChild(script);
  };
};

