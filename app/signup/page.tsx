"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength checker helper
  const getPasswordStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const score = getPasswordStrength(password);
  const strengthColors = ["bg-[#27272a]", "bg-[#ef4444]", "bg-[#f97316]", "bg-[#eab308]", "bg-[#22c55e]"];
  const strengthWidths = ["w-0", "w-[25%]", "w-[50%]", "w-[75%]", "w-[100%]"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      router.push("/chat");
      router.refresh();

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 bg-gradient-to-br from-[#0c0d12] to-[#030303] text-[var(--text-primary)] relative overflow-hidden">


      {/* Mobile Hero Icon */}
      <div className="flex md:hidden flex-shrink-0 items-center justify-center w-full min-h-[120px] mb-6">
        <div className="relative w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center shadow-[0_12px_30px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)]">
          <img src="/img/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-[390px] glass-premium rounded-[28px] p-8 md:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.65)] z-10 border border-[rgba(255,255,255,0.08)] transition-all">
        <div className="flex items-center gap-2 mb-2">
          <img src="/img/branding.png" alt="Clarity" className="h-6 object-contain" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mt-4">Create account</h1>
        <p className="text-xs text-[#94a3b8] mt-1 mb-6">Your premium AI companion awaits</p>

        {error && (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] p-3 rounded-xl text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Username</label>
            <div className="relative">
              <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-[#f8fafc] placeholder-[#475569] outline-none input-premium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Email</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-[#f8fafc] placeholder-[#475569] outline-none input-premium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-[#f8fafc] placeholder-[#475569] outline-none input-premium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-white transition-colors"
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
              </button>
            </div>
            {/* Strength Meter Bar */}
            {password.length > 0 && (
              <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${strengthColors[score]} ${strengthWidths[score]} transition-all duration-300 rounded-full`}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-[#ffffff] hover:bg-[#e4e4e7] text-[#09090b] font-semibold rounded-xl text-sm active:scale-98 transition-all disabled:opacity-50 btn-shimmer shadow-sm"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-[1px] bg-[rgba(255,255,255,0.06)]" />
          <p className="text-[10px] text-[#475569] uppercase font-semibold">or</p>
          <span className="flex-1 h-[1px] bg-[rgba(255,255,255,0.06)]" />
        </div>

        <div className="text-center text-xs text-[#94a3b8]">
          Have an account?{" "}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
