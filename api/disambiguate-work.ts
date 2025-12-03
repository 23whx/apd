// Vercel Serverless Function: DeepSeek AI 消歧
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { query, candidates } = req.body;
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const prompt = `你是一个ACGN作品消歧专家。用户输入了作品名："${query}"。

${candidates && candidates.length > 0 ? `数据库中已有以下相似作品：
${candidates.map((c: any, i: number) => `${i + 1}. ${c.name_cn} (${c.name_en || ''}) - ${c.type}`).join('\n')}

请判断用户输入的作品是否与上述任何作品是同一部作品（考虑别名、翻译名、简称等）。` : '数据库中没有找到相似作品。'}

请以JSON格式回复：
{
  "isDuplicate": true/false,
  "matchedWorkId": "作品ID（如果是重复）或null",
  "confidence": 0-1之间的数字,
  "reason": "判断理由",
  "suggestedNames": {
    "name_cn": "建议的中文名",
    "name_en": "建议的英文名",
    "name_jp": "建议的日文名"
  },
  "type": "anime/manga/game/novel"
}

只返回JSON，不要其他文字。`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
            content: '你是ACGN作品消歧专家，精通动漫、游戏、小说的中英日命名规则。只返回JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const result = await response.json();
    const content = result.choices[0].message.content.trim();
    
    // 尝试解析JSON（可能包含markdown代码块）
    let jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    
    const disambiguation = JSON.parse(jsonContent);

    return res.status(200).json(disambiguation);

  } catch (error: any) {
    console.error('Disambiguate work error:', error);
    return res.status(500).json({ error: error.message });
  }
}


