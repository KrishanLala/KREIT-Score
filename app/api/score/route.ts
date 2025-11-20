import { NextResponse } from "next/server";

import { generateMockScore, type PlanId } from "@/lib/score";

type ScoreRequest = {
  address?: string;
  plan?: PlanId;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ScoreRequest;
  const address = body.address?.trim();
  const plan: PlanId = body.plan === "pro" ? "pro" : "simple";

  if (!address) {
    return NextResponse.json(
      { error: "Address is required to calculate a KREIT Score." },
      { status: 400 },
    );
  }

  const score = generateMockScore(address, plan);

  return NextResponse.json({
    address,
    plan,
    score,
    generatedAt: new Date().toISOString(),
  });
}
