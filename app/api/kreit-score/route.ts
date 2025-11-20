import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getSupabaseUser, isUserPremium } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type PropertyCacheRow = {
  normalized_address: string;
  raw_address?: string | null;
  attom_data?: Record<string, unknown> | null;
  kreit_score?: number | null;
  simple_summary?: string | null;
  pro_summary?: string | null;
  premium_data?: Record<string, unknown> | null;
  last_fetched_at?: string | null;
};

type KreitScoreResponse = {
  kreit_score: number;
  simple_summary: string;
  pro_summary: string;
  premium_data: Record<string, unknown> | null;
  has_premium_data: boolean;
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_BASE_URL = process.env.ATTOM_BASE_URL;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const ensureEnv = (value: string | undefined | null, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const fetchAttomData = async (rawAddress: string) => {
  const baseUrl = ensureEnv(ATTOM_BASE_URL, "ATTOM_BASE_URL");
  const apiKey = ensureEnv(ATTOM_API_KEY, "ATTOM_API_KEY");

  const endpoint = new URL(baseUrl);
  endpoint.searchParams.set("address", rawAddress);

  const response = await fetch(endpoint.toString(), {
    headers: { apikey: apiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `ATTOM API error (${response.status}): ${await response.text()}`,
    );
  }

  return (await response.json()) as Record<string, unknown>;
};

const generateInsights = async (attomData: unknown) => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const truncatedData = JSON.stringify(attomData).slice(0, 12000);
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are KREIT Score, an AI real-estate underwriter. ",
          "Return JSON with: ",
          `- "kreit_score": integer 0-100.`,
          `- "simple_summary": 3-4 short sentences, plain language.`,
          `- "pro_summary": 3-4 short sentences, professional tone using the same facts.`,
          `- "premium_data": object containing sections such as score_breakdown, rental_potential, appreciation_forecast, neighborhood_indicators, each with concise insights.`,
        ].join("\n"),
      },
      {
        role: "user",
        content: `Property data:\n${truncatedData}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Partial<KreitScoreResponse> & { premium_data?: unknown } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Unable to parse OpenAI response.");
  }

  const kreitScore =
    typeof parsed.kreit_score === "number"
      ? Math.min(Math.max(Math.round(parsed.kreit_score), 0), 100)
      : 60;

  const simpleSummary =
    typeof parsed.simple_summary === "string"
      ? parsed.simple_summary.trim()
      : "We could not generate a simple summary for this property.";

  const proSummary =
    typeof parsed.pro_summary === "string"
      ? parsed.pro_summary.trim()
      : "We could not generate a pro summary for this property.";

  const premiumData =
    parsed.premium_data && typeof parsed.premium_data === "object"
      ? (parsed.premium_data as Record<string, unknown>)
      : null;

  return {
    kreit_score: kreitScore,
    simple_summary: simpleSummary,
    pro_summary: proSummary,
    premium_data: premiumData,
  };
};

const isCacheFresh = (cache?: PropertyCacheRow | null) => {
  if (!cache?.last_fetched_at) return false;
  const lastFetched = new Date(cache.last_fetched_at).getTime();
  if (Number.isNaN(lastFetched)) return false;
  return Date.now() - lastFetched <= NINETY_DAYS_MS;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      address?: string;
    };

    if (!body.address || typeof body.address !== "string") {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 },
      );
    }

    const rawAddress = body.address.trim();
    const normalizedAddress = rawAddress.toLowerCase();

    if (!normalizedAddress) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const user = await getSupabaseUser(request, supabase);
    const premium = await isUserPremium(supabase, user);

    const { data: cached, error: cacheError } = await supabase
      .from("property_cache")
      .select("*")
      .eq("normalized_address", normalizedAddress)
      .maybeSingle<PropertyCacheRow>();

    if (cacheError && cacheError.code !== "PGRST116") {
      console.error("Cache lookup error", cacheError);
    }

    let payload: PropertyCacheRow = cached ?? {
      normalized_address: normalizedAddress,
      raw_address: rawAddress,
    };

    if (!cached || !isCacheFresh(cached)) {
      const attomData = await fetchAttomData(rawAddress);
      const aiInsights = await generateInsights(attomData);

      payload = {
        normalized_address: normalizedAddress,
        raw_address: rawAddress,
        attom_data: attomData,
        kreit_score: aiInsights.kreit_score,
        simple_summary: aiInsights.simple_summary,
        pro_summary: aiInsights.pro_summary,
        premium_data: aiInsights.premium_data,
        last_fetched_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase.from("property_cache").upsert(
        payload,
        { onConflict: "normalized_address" },
      );

      if (upsertError) {
        console.error("Cache upsert error", upsertError);
      }
    }

    const hasPremiumData =
      !!payload.premium_data &&
      typeof payload.premium_data === "object" &&
      Object.keys(payload.premium_data).length > 0;

    const responseBody: KreitScoreResponse = {
      kreit_score: payload.kreit_score ?? 0,
      simple_summary:
        payload.simple_summary ??
        "We could not generate a summary for this property.",
      pro_summary:
        payload.pro_summary ??
        "We could not generate a professional summary for this property.",
      has_premium_data: hasPremiumData,
      premium_data: premium && hasPremiumData ? payload.premium_data : null,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("KREIT score error", error);
    return NextResponse.json(
      { error: "Unable to generate KREIT Score at this time." },
      { status: 500 },
    );
  }
}
