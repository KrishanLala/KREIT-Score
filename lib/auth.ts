import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  createSupabaseServerClient,
  type SupabaseServerClient,
} from "./supabaseClient";

const COOKIE_ACCESS_TOKEN_KEYS = [
  "sb-access-token",
  "supabase-access-token",
  "supabase-auth-token",
];

const parseCookieToken = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.access_token === "string"
      ) {
        return parsed.access_token;
      }
    } catch {
      // ignore JSON parse errors and fall through to return raw value
    }
  }

  return trimmed;
};

export const extractSupabaseAccessToken = (request: Request) => {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7);
  }

  const cookieStore = cookies();
  for (const key of COOKIE_ACCESS_TOKEN_KEYS) {
    const candidate = parseCookieToken(cookieStore.get(key)?.value);
    if (candidate) return candidate;
  }

  return null;
};

export const getSupabaseUser = async (
  request: Request,
  supabase?: SupabaseServerClient,
) => {
  const client = supabase ?? createSupabaseServerClient();
  const token = extractSupabaseAccessToken(request);

  if (!token) {
    return null;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
};

export const isUserPremium = async (
  supabase: SupabaseServerClient,
  user: User | null,
) => {
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return false;

  return Boolean(data.is_premium);
};
