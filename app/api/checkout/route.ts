import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getSupabaseUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

const STRIPE_API_VERSION = "2024-09-30" as const;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 },
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID environment variable." },
        { status: 500 },
      );
    }

    const supabase = createSupabaseServerClient();
    const user = await getSupabaseUser(request, supabase);

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to upgrade." },
        { status: 401 },
      );
    }

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again shortly." },
      { status: 500 },
    );
  }
}
