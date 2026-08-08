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
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 bg-[#000000] text-[#f2f2f7] relative overflow-hidden">

      {/* Mobile Hero Icon */}
      <div className="flex md:hidden flex-shrink-0 items-center justify-center w-full min-h-[120px] mb-6">
        <div className="w-16 h-16 rounded-[20px] bg-[#1c1c1e] border border-[#2c2c2e] shadow-xl flex items-center justify-center p-3">
          <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Signup Card — Apple Style */}
      <div className="w-full max-w-[390px] bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-8 md:p-9 shadow-2xl z-10 transition-all">
        <div className="flex items-center gap-2 mb-2">
          <img src="/img/branding.png" alt="Clarity" className="h-6 object-contain" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-white mt-4">Create account</h1>
        <p className="text-xs text-[#8e8e93] mt-1 mb-6">Your premium AI companion awaits</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">Username</label>
            <div className="relative">
              <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#636366]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] text-white placeholder-[#636366] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">Email</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#636366]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] text-white placeholder-[#636366] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#636366]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] text-white placeholder-[#636366] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#636366] hover:text-white transition-colors"
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
              </button>
            </div>
            {/* Strength Meter Bar */}
            {password.length > 0 && (
              <div className="h-[3px] bg-[#2c2c2e] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${strengthColors[score]} ${strengthWidths[score]} transition-all duration-300 rounded-full`}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-white hover:bg-[#e5e5ea] text-black font-semibold rounded-xl text-sm active:scale-98 transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-[1px] bg-[#2c2c2e]" />
          <p className="text-[10px] text-[#636366] uppercase font-semibold">or</p>
          <span className="flex-1 h-[1px] bg-[#2c2c2e]" />
        </div>

        <div className="text-center text-xs text-[#8e8e93]">
          Have an account?{" "}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
