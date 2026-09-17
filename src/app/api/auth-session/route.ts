import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const cookieHeader = request.headers.get("cookie");

    return new Response(
      JSON.stringify({
        hasCookie: Boolean(cookieHeader),
        cookieHeader,
        user,
        error: error ? { message: error.message, status: error.status } : null,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
}
