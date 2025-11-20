"use client";

import { FormEvent, useState } from "react";

const planOptions = [
  { id: "simple", label: "Simple", blurb: "Fast estimate for quick checks." },
  {
    id: "pro",
    label: "Pro",
    blurb: "Enriched data for investor-grade diligence.",
  },
] as const;

type PlanId = (typeof planOptions)[number]["id"];

export default function Home() {
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState<PlanId>("simple");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info(`[KREIT Score] Request`, { address, plan });
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
              Plan
            </legend>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-2">
              {planOptions.map((option) => {
                const isActive = plan === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={isActive}
                    onClick={() => setPlan(option.id)}
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          >
            Get KREIT Score
            <span aria-hidden className="text-xl">
              →
            </span>
          </button>

          <p className="text-center text-xs text-white/60">
            We&apos;ll email you a detailed score with comps, risk factors, and
            strategy ideas.
          </p>
        </form>
      </main>
    </div>
  );
}
