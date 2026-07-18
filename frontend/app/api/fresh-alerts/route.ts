import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywordsParam = searchParams.get('keywords') || '';
  
  const kws = keywordsParam.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  if (kws.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  try {
    // MySQL syntax: NOW() - INTERVAL 2 HOUR
    const keywordConditions = kws.map((_, i) => `title LIKE $${i + 1}`).join(' OR ');
    const query = `
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE created_at > NOW() - INTERVAL 2 HOUR 
        AND is_active = TRUE
        AND (${keywordConditions})
    `;
    
    const res = await pool.query(query, kws.map(k => `%${k}%`));
    const count = parseInt(res.rows[0]?.count || '0', 10);
    
    return NextResponse.json({ count });
  } catch (e: any) {
    console.error("Error in fresh-alerts API:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
