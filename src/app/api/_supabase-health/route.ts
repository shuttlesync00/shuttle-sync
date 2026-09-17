import { getMissingEnv } from '@/lib/env';

export async function GET() {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    return new Response(JSON.stringify({ ok: false, missing }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

  try {
    const res = await fetch(`${url}/auth/v1`, { method: 'GET' });
    return new Response(JSON.stringify({ ok: true, reachable: res.ok, status: res.status }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
