// Frontend API helper to call Supabase Edge Functions

import { supabase } from './supabase';

/**
 * 搜索作品（数据库模糊查询）
 */
export async function searchWork(query: string) {
  try {
    const { data, error } = await supabase.functions.invoke('search-work', {
      body: { query }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Search work error:', error);
    throw error;
  }
}

/**
 * 消歧作品（使用 DeepSeek AI）
 */
export async function disambiguateWork(query: string, candidates: any[]) {
  try {
    const { data, error } = await supabase.functions.invoke('disambiguate-work', {
      body: { query, candidates }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Disambiguate work error:', error);
    throw error;
  }
}

/**
 * 爬取作品信息（Firecrawl + DeepSeek）
 */
export async function scrapeWorkInfo(workName: string, userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-work-info', {
      body: { workName, userId }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Scrape work info error:', error);
    throw error;
  }
}

/**
 * 检查作品是否重复（旧方法，保留兼容）
 */
export async function checkWorkDuplicate(workName: string) {
  return searchWork(workName);
}

/**
 * 爬取作品（旧方法，保留兼容）
 */
export async function scrapeWork(workId: string, workName: string) {
  console.warn('scrapeWork is deprecated, use scrapeWorkInfo instead');
  return scrapeWorkInfo(workName, workId);
}

