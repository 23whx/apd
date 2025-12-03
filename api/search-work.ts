// Vercel Serverless Function: 数据库模糊查询
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 模糊查询数据库中的作品（name_cn, name_en, name_jp, alias）
    const { data: existingWorks, error } = await supabaseClient
      .from('works')
      .select('id, name_cn, name_en, name_jp, alias, type')
      .or(`name_cn.ilike.%${query}%,name_en.ilike.%${query}%,name_jp.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    // 如果找到相似作品，返回候选列表
    if (existingWorks && existingWorks.length > 0) {
      return res.status(200).json({
        found: true,
        candidates: existingWorks,
        message: 'Found similar works in database'
      });
    }

    // 没有找到相似作品
    return res.status(200).json({
      found: false,
      message: 'No similar works found, can proceed to LLM disambiguation'
    });

  } catch (error: any) {
    console.error('Search work error:', error);
    return res.status(500).json({ error: error.message });
  }
}


