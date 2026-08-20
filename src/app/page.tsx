import Link from "next/link";
import { Header } from "@/components/layout/header";
import { MapPin, ShieldCheck, Users, HandHeart, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-slate-950 to-slate-950 -z-10" />

          {/* Glowing accent background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              Empowering Hyper-Local Action
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Turn Local Problems Into <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
                Community Solutions
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Report street hazards, request neighborhood help, verify ground truth, and connect with local volunteers and authorities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/feed"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                Explore Nearby Problems
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/problems/create"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base transition-all border border-slate-700"
              >
                Report an Issue
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="py-16 px-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                How LocalLoop Works
              </h2>
              <p className="text-slate-400 text-sm">
                Built with privacy-first geolocation, community reputation, and verification workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Privacy-Controlled Map</h3>
                <p className="text-sm text-slate-400">
                  Discover problems in your exact neighborhood. Exact pin locations are safely fuzzed to protect citizen privacy.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Ground-Truth Verification</h3>
                <p className="text-sm text-slate-400">
                  Neighbors confirm or dispute reported issues, ensuring high signal and eliminating spam or fake reports.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <HandHeart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Direct Support Matching</h3>
                <p className="text-sm text-slate-400">
                  Offer expertise, volunteer hours, equipment, or connect the author to municipal authorities and local NGOs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-2xl font-bold text-white">Solving Every Type of Local Challenge</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Roads & Potholes",
                "Sanitation & Garbage",
                "Street Lighting",
                "Water & Plumbing",
                "Public Safety",
                "Park Cleanup",
                "Sidewalk Accessibility",
                "Senior Assistance",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-slate-800 text-center text-xs text-slate-500">
        LocalLoop © 2026 — Location-Based Community Problem Solving MVP.
      </footer>
    </div>
  );
}
