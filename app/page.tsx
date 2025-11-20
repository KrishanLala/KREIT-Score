"use client";

import { FormEvent, useState, type ReactNode } from "react";

const planOptions = [
  { id: "simple", label: "Simple", blurb: "Friendly rundown for quick checks." },
  {
    id: "pro",
    label: "Pro",
    blurb: "Investor tone with underwriting-ready talking points.",
  },
] as const;

type PlanId = (typeof planOptions)[number]["id"];

type ScoreResult = {
  kreit_score: number;
  simple_summary: string;
  pro_summary: string;
  premium_data: Record<string, unknown> | null;
  has_premium_data: boolean;
};

const premiumSections = [
  { key: "score_breakdown", title: "Score Breakdown" },
  { key: "rental_potential", title: "Rental Potential" },
  { key: "appreciation_forecast", title: "Appreciation Forecast" },
  { key: "neighborhood_indicators", title: "Neighborhood Indicators" },
] as const;

export default function Home() {
  const [address, setAddress] = useState("");
  const [summaryTier, setSummaryTier] = useState<PlanId>("simple");
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address.trim()) return;
    setIsLoadingScore(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/kreit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "Unable to fetch KREIT Score.");
      }

      const payload = (await response.json()) as ScoreResult;
      setScoreResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected error occurred.",
      );
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "Unable to start checkout.");
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Checkout URL missing from response.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const activeSummary =
    summaryTier === "simple"
      ? scoreResult?.simple_summary
      : scoreResult?.pro_summary;

  const renderPremiumValue = (value: unknown): ReactNode => {
    if (!value) return null;
    if (typeof value === "string" || typeof value === "number") {
      return <p className="text-sm text-white/80">{String(value)}</p>;
    }
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
          {value.map((item, index) => (
            <li key={index}>{String(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === "object") {
      return (
        <dl className="space-y-2 text-sm text-white/80">
          {Object.entries(value as Record<string, unknown>).map(
            ([key, val]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <dt className="text-xs uppercase tracking-wide text-white/50">
                  {key.replace(/_/g, " ")}
                </dt>
                <dd>{renderPremiumValue(val)}</dd>
              </div>
            ),
          )}
        </dl>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center sm:px-8">
        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm uppercase tracking-[0.3em] text-emerald-200">
          KREIT Score
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Real estate clarity starts with a single address.
          </h1>
          <p className="text-base text-white/70 sm:text-lg">
            Instantly benchmark a property&apos;s potential using ATTOM,
            Supabase, and AI-powered underwriting—all from one streamlined
            report.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-[0_40px_120px_rgba(8,15,40,.65)] backdrop-blur"
        >
          <label className="block space-y-3">
            <span className="text-sm uppercase tracking-wide text-white/65">
              Address
            </span>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Market Street, San Francisco, CA"
              required
              className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/60"
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm uppercase tracking-wide text-white/65">
              View mode
            </legend>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-2">
              {planOptions.map((option) => {
                const isActive = summaryTier === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={isActive}
                    onClick={() => setSummaryTier(option.id)}
                    className={`rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                        : "bg-transparent text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base font-semibold">
                      {option.label}
                    </span>
                    <p className="text-sm text-white/70">{option.blurb}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isLoadingScore}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoadingScore ? "Scoring..." : "Get KREIT Score"}
            <span aria-hidden className="text-xl">
              →
            </span>
          </button>

          <p className="text-center text-xs text-white/60">
            Simple and Pro summaries are free. Sign in to unlock premium data
            like rent comps, appreciation, and neighborhood analytics.
          </p>
        </form>

        {errorMessage && (
          <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-100">
            {errorMessage}
          </div>
        )}

        {scoreResult && (
          <section className="w-full space-y-6 rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-left shadow-[0_20px_90px_rgba(2,6,23,.9)]">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  KREIT Score
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-emerald-300">
                    {scoreResult.kreit_score}
                  </span>
                  <span className="text-sm text-white/60">/ 100</span>
                </div>
              </div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs text-white/70">
                Summary view: {summaryTier === "simple" ? "Simple" : "Pro"}
              </div>
            </header>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              {activeSummary}
            </div>

            {scoreResult.has_premium_data && !scoreResult.premium_data && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-200">
                    Unlock KREIT Score Premium
                  </h3>
                  <p className="text-sm text-amber-50/90">
                    Full breakdowns, rent comps, appreciation forecasts, and
                    neighborhood diligence for just $7.99/mo. Sign in, then tap
                    upgrade to continue.
                  </p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {checkoutLoading ? "Connecting..." : "Upgrade to Premium"}
                  </button>
                </div>
              </div>
            )}

            {scoreResult.premium_data && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-white/80">
                  Premium Intelligence
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {premiumSections.map((section) => {
                    const premiumValue =
                      scoreResult.premium_data &&
                      (scoreResult.premium_data as Record<string, unknown>)[
                        section.key
                      ];
                    if (!premiumValue) return null;
                    return (
                      <article
                        key={section.key}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                          {section.title}
                        </h4>
                        <div className="mt-3 text-left">
                          {renderPremiumValue(premiumValue)}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <p className="text-xs text-white/50">
                  These insights combine ATTOM fundamentals, Supabase data, and
                  OpenAI underwriting heuristics.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
