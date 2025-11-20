import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ClientOptions = Parameters<typeof createClient>[2];

const missingEnv = (key: string) =>
  new Error(`Missing required environment variable: ${key}`);

const getPublicConfig = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url) throw missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { url, anonKey };
};

const getServiceConfig = () => {
  if (typeof window !== "undefined") {
    throw new Error(
      "createSupabaseServerClient must only be called from the server.",
    );
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw missingEnv("SUPABASE_URL");
  if (!serviceRoleKey) throw missingEnv("SUPABASE_SERVICE_ROLE_KEY");

  return { url, serviceRoleKey };
};

let browserClient: SupabaseClient | undefined;

export const getSupabaseBrowserClient = (
  options?: ClientOptions,
): SupabaseClient => {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient must only be used in the browser/client.",
    );
  }

  if (!browserClient) {
    const { url, anonKey } = getPublicConfig();
    browserClient = createClient(url, anonKey, options);
  }

  return browserClient;
};

export const createSupabaseServerClient = (options?: ClientOptions) => {
  const { url, serviceRoleKey } = getServiceConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    ...options,
  });
};

export type SupabaseBrowserClient = ReturnType<
  typeof getSupabaseBrowserClient
>;
export type SupabaseServerClient = ReturnType<
  typeof createSupabaseServerClient
>;
