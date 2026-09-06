import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Clarity",
  description: "Terms of Service for Clarity — Autonomous AI Agentic Workspace.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070709] text-[#f2f2f7]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/img/branding.png"
              alt="Clarity Logo"
              className="h-9 w-auto object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Terms of Service</h1>
          <p className="text-zinc-400 text-xs">Last updated: August 23, 2026</p>
        </div>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Clarity at{" "}
              <a href="https://theclarity.vercel.app" className="text-indigo-400 hover:underline">
                https://theclarity.vercel.app
              </a>{" "}
              (&quot;the Service&quot;), you agree to be bound by these Terms of Service and our{" "}
              <Link href="/privacy" className="text-indigo-400 hover:underline">
                Privacy Policy
              </Link>. If you do not agree, do not use the Service.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Description of the Service</h2>
            <p>
              Clarity is an autonomous AI workspace designed to assist professionals and developers by connecting with GitHub repositories and LinkedIn to execute codebase analysis, content planning, and social growth workflows.
            </p>
          </section>

          {/* 3. User Accounts & Security */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. User Accounts & Third-Party Integrations</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. When you connect third-party accounts (such as GitHub or LinkedIn), you authorize Clarity to access the requested data strictly in accordance with the permissions you grant and our Privacy Policy.
            </p>
          </section>

          {/* 4. Third-Party Data Limited Use */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Third-Party Data & Limited Use</h2>
            <p>
              Clarity accesses authorized third-party data solely to fulfill user-initiated assistant tasks. We do not sell, rent, or transfer your third-party account data to outside entities, nor do we use your data to train generalized AI models.
            </p>
          </section>

          {/* 5. Acceptable Use */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 text-zinc-400 text-xs">
              <li>Violate any local, national, or international law.</li>
              <li>Attempt to gain unauthorized access to any system, server, or data.</li>
              <li>Upload or distribute malicious code, viruses, or harmful scripts.</li>
              <li>Interfere with or disrupt the integrity or performance of the platform.</li>
            </ul>
          </section>

          {/* 6. Contact Information */}
          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Contact Information</h2>
            <p>For any questions regarding these Terms of Service, please contact us at:</p>
            <div className="mt-3 p-4 bg-[#101015] border border-[#222228] rounded-xl text-xs">
              <p className="text-white font-medium">Clarity Developer Support</p>
              <p className="text-indigo-400">skfatmosphere@gmail.com</p>
              <p className="text-zinc-500 mt-1">https://theclarity.vercel.app</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-[#1c1c1e] flex items-center justify-between text-xs text-zinc-500">
          <p>© 2026 Clarity. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-zinc-300">Home</Link>
            <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
