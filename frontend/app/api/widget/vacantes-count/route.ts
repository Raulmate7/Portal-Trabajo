import { NextResponse } from 'next/server';

// Placeholder data – in production replace with DB query
const vacancyCounts = {
  python: 123,
  react: 98,
  nodejs: 76,
  java: 54,
  php: 32,
};

export async function GET() {
  // Return JSON with counts per technology
  return NextResponse.json(vacancyCounts);
}
