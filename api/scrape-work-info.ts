// Vercel Serverless Function: Firecrawl 抓取 + DeepSeek 角色提取
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const WIKI_SOURCES = [
  { name: 'moegirl', urlTemplate: (q: string) => `https://zh.moegirl.org.cn/${encodeURIComponent(q)}` },
  { name: 'baike', urlTemplate: (q: string) => `https://baike.baidu.com/item/${encodeURIComponent(q)}` },
  { name: 'wikipedia', urlTemplate: (q: string) => `https://zh.wikipedia.org/wiki/${encodeURIComponent(q)}` }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workName, userId } = req.body;
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 使用 Firecrawl 抓取各个百科
    const scrapeResults = await Promise.all(
      WIKI_SOURCES.map(async (source) => {
        try {
          const url = source.urlTemplate(workName);
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firecrawlApiKey}`
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
              waitFor: 2000
            })
          });

          if (!response.ok) {
            console.error(`Failed to scrape ${source.name}:`, await response.text());
            return { source: source.name, success: false, data: null };
          }

          const data = await response.json();
          return { source: source.name, success: true, data: data.data };
        } catch (error) {
          console.error(`Error scraping ${source.name}:`, error);
          return { source: source.name, success: false, data: null };
        }
      })
    );

    // 2. 使用 DeepSeek 提取角色信息
    const successfulScrapes = scrapeResults.filter(r => r.success && r.data);
    
    if (successfulScrapes.length === 0) {
      throw new Error('Failed to scrape any wiki sources');
    }

    const combinedContent = successfulScrapes
      .map(r => `=== ${r.source} ===\n${r.data.markdown || r.data.html}`)
      .join('\n\n');

    const extractPrompt = `你是ACGN角色提取专家。从以下百科内容中提取作品"${workName}"的角色信息。

内容：
${combinedContent.substring(0, 8000)}

请以JSON格式返回：
{
  "workInfo": {
    "name_cn": "中文名",
    "name_en": "英文名（如果有）",
    "name_jp": "日文名（如果有）",
    "type": "anime/manga/game/novel",
    "summary_md": "简短介绍（50字以内）"
  },
  "characters": [
    {
      "name_cn": "角色中文名",
      "name_en": "角色英文名",
      "name_jp": "角色日文名",
      "avatar_url": "角色图片URL（从内容中提取）",
      "source_link": "角色百科页面链接"
    }
  ],
  "source_urls": {
    "moegirl": "萌娘百科链接",
    "wikipedia": "维基百科链接",
    "baike": "百度百科链接"
  }
}

只返回JSON，不要其他文字。如果某些信息缺失，使用null。`;

    const llmResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是ACGN内容提取专家，精通从百科内容中提取结构化信息。只返回JSON格式。'
          },
          {
            role: 'user',
            content: extractPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    const llmResult = await llmResponse.json();
    const content = llmResult.choices[0].message.content.trim();
    
    let jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    
    const extractedData = JSON.parse(jsonContent);

    // 3. 创建作品记录
    const { data: newWork, error: workError } = await supabaseClient
      .from('works')
      .insert([{
        name_cn: extractedData.workInfo.name_cn,
        name_en: extractedData.workInfo.name_en,
        name_jp: extractedData.workInfo.name_jp,
        type: extractedData.workInfo.type || 'anime',
        summary_md: extractedData.workInfo.summary_md,
        source_urls: extractedData.source_urls,
        created_by: userId
      }])
      .select()
      .single();

    if (workError) throw workError;

    // 4. 创建角色记录
    if (extractedData.characters && extractedData.characters.length > 0) {
      const charactersToInsert = extractedData.characters.map((char: any) => ({
        work_id: newWork.id,
        name_cn: char.name_cn,
        name_en: char.name_en,
        name_jp: char.name_jp,
        avatar_url: char.avatar_url,
        source_link: char.source_link
      }));

      const { error: charError } = await supabaseClient
        .from('characters')
        .insert(charactersToInsert);

      if (charError) console.error('Error inserting characters:', charError);
    }

    return res.status(200).json({
      success: true,
      work: newWork,
      charactersCount: extractedData.characters?.length || 0,
      sources: successfulScrapes.map(r => r.source)
    });

  } catch (error: any) {
    console.error('Scrape work info error:', error);
    return res.status(500).json({ error: error.message });
  }
}


