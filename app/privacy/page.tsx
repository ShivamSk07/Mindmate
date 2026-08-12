import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Clarity AI Workspace",
  description: "Privacy Policy for Clarity — the autonomous AI agentic workspace. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold">
              C
            </div>
            <span className="text-xl font-semibold text-white">Clarity</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: August 12, 2026</p>
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Clarity (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is an autonomous AI agentic workspace that connects your GitHub repositories,
              Google Workspace (Drive, Gmail, Calendar, Sheets), and other tools to help you execute complex multi-tool
              workflows and automate tasks. This Privacy Policy explains how we collect, use, and protect your
              information when you use our platform at{" "}
              <a href="https://theclarity.vercel.app" className="text-violet-400 hover:underline">
                https://theclarity.vercel.app
              </a>.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white font-medium">Account Information:</span> Username, email address, and encrypted password when you register.</li>
              <li><span className="text-white font-medium">Google Account Data:</span> When you connect Google, we store your email address and OAuth access tokens to call Google APIs on your behalf (Gmail, Drive, Calendar, Sheets).</li>
              <li><span className="text-white font-medium">GitHub Account Data:</span> When you connect GitHub, we store your GitHub username, avatar URL, and OAuth access token to interact with your repositories.</li>
              <li><span className="text-white font-medium">Workspace Data:</span> Chat messages, tasks, session history, and personas you create within the platform.</li>
              <li><span className="text-white font-medium">Usage Data:</span> Standard server logs including IP addresses, browser type, and pages visited for security and analytics.</li>
            </ul>
          </section>

          {/* 3. How We Use Google Data */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Google User Data</h2>
            <p className="mb-3">
              Clarity's use of information received from Google APIs adheres to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="mb-3">We access Google data <strong className="text-white">only</strong> for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white font-medium">Gmail (Read-only):</span> To search and display your inbox messages within the CoWork agent so you can analyze emails and plan responses.</li>
              <li><span className="text-white font-medium">Google Drive (Read-only):</span> To search and retrieve your Drive files so the agent can analyze documents and proposals.</li>
              <li><span className="text-white font-medium">Google Calendar (Read-only):</span> To check your upcoming events and find available time slots for scheduling.</li>
              <li><span className="text-white font-medium">Google Sheets (Read-only):</span> To read spreadsheet data for analysis and reporting within the workspace.</li>
            </ul>
            <p className="mt-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm">
              🔒 <strong className="text-white">We do not sell, share, or transfer your Google data to any third parties.</strong> Your Google data is used exclusively to provide the AI workspace features you request.
            </p>
          </section>

          {/* 4. Data Storage & Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage & Security</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All data is stored in a secure PostgreSQL database hosted on Neon.tech with SSL encryption.</li>
              <li>Passwords are hashed using PBKDF2 with 100,000 salt iterations — never stored in plain text.</li>
              <li>OAuth tokens are stored encrypted and are only used for API calls you explicitly initiate.</li>
              <li>You can disconnect your Google or GitHub account at any time, which deletes your stored tokens immediately.</li>
            </ul>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your account data as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at the email below. OAuth tokens are automatically invalidated and removed when you disconnect an integration.
            </p>
          </section>

          {/* 6. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p>Clarity integrates with the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><span className="text-white font-medium">Google (Gmail, Drive, Calendar, Sheets)</span> — <a href="https://policies.google.com/privacy" className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
              <li><span className="text-white font-medium">GitHub</span> — <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a></li>
              <li><span className="text-white font-medium">Cerebras AI</span> — Used to power the AI reasoning engine. No personal data is shared.</li>
              <li><span className="text-white font-medium">Vercel</span> — Hosts the web application. Standard hosting infrastructure.</li>
            </ul>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Revoke OAuth access at any time via your Google Account settings or our platform.</li>
              <li>Data portability — request an export of your data.</li>
            </ul>
          </section>

          {/* 8. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your data, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white font-medium">Clarity Support</p>
              <p className="text-violet-400">support@theclarity.vercel.app</p>
              <p className="text-gray-400 text-sm mt-1">https://theclarity.vercel.app</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>© 2026 Clarity AI Workspace. All rights reserved.</p>
          <a href="/cowork" className="text-violet-400 hover:underline mt-2 inline-block">← Back to CoWork</a>
        </div>
      </div>
    </main>
  );
}
