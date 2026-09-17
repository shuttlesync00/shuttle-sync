import { getMissingEnv, getSupabaseAnonKey } from "@/lib/env";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/friendly-matches", "/tournaments", "/teams", "/players", "/live-scoring", "/points-table", "/profile"];
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Missing environment variables</title><meta name="viewport" content="width=device-width,initial-scale=1" /><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;margin:0;padding:40px;background:#111827;color:#e5e7eb} .card{max-width:800px;margin:0 auto;background:#0b1220;padding:24px;border-radius:12px;border:1px solid rgba(255,255,255,0.04)} h1{font-size:20px;margin:0 0 8px} p{margin:8px 0 16px;color:#9ca3af} ul{margin:0;padding-left:20px} code{background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:6px;color:#fff}</style></head><body><div class="card"><h1>Missing environment variables</h1><p>The application requires the following environment variables to be set for local development and authentication to work correctly.</p><ul>${missing.map(v=>`<li><code>${v}</code></li>`).join("")}</ul><p>Please create a <code>.env.local</code> file in the project root and add these keys. See <code>.env.example</code> for an example.</p></div></body></html>`;

    return new NextResponse(html, { status: 500, headers: { "content-type": "text/html" } });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const anonKey = getSupabaseAnonKey();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !anonKey) {
    return new NextResponse("Supabase public configuration is incomplete.", { status: 500 });
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthRoute = authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
