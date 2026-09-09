"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Github,
  ArrowRight,
  Check,
  ExternalLink,
  Laptop,
  Terminal,
  Monitor,
  Globe,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Minimal animated counter for social proof
────────────────────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = Math.ceil(target / 60);
        const interval = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(interval); }
          else setCount(start);
        }, 16);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function ClarityLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("scroll-root");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 24);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      id="scroll-root"
      style={{
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#000",
        color: "#ededed",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Inter, sans-serif",
        WebkitFontSmoothing: "antialiased",
        scrollBehavior: "smooth",
      }}
    >
      {/* ══════════════ NAV ══════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          background: scrolled ? "rgba(0,0,0,0.82)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 5,
              }}
            >
              <img src="/img/logo.png" alt="Clarity" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>Clarity</span>
            <span style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>in devs</span>
          </Link>

          {/* Nav links */}
          <nav
            style={{
              display: "flex",
              gap: 28,
              fontSize: 13,
              color: "#888",
              fontWeight: 500,
            }}
            className="hide-mobile"
          >
            <a href="#cowork" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#888")}>Cowork</a>
            <a href="#response" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#888")}>Response</a>
            <a href="#thought" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#888")}>Thought</a>
            <a href="#downloads" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#fff")} onMouseLeave={e => (e.currentTarget.style.color = "#888")}>Download</a>
          </nav>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#aaa",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#fff")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#aaa")}
            >
              Sign in
            </Link>
            <Link
              href="/chat"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#000",
                textDecoration: "none",
                padding: "7px 16px",
                borderRadius: 9,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#e0e0e0")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}
            >
              Try free <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section
        style={{
          paddingTop: "clamp(72px, 10vw, 130px)",
          paddingBottom: "clamp(64px, 9vw, 110px)",
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow behind headline */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 380,
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 11,
              fontWeight: 600,
              color: "#999",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
              }}
            />
            Agentic AI workspace for developers
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(44px, 7vw, 84px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              marginBottom: 24,
            }}
          >
            Clarity
            <br />
            <span style={{ color: "#555" }}>in devs.</span>
          </h1>

          {/* Subline */}
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "#666",
              fontWeight: 400,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: "0 auto 44px",
            }}
          >
            Pure thought. Pure response. An autonomous cowork
            AI built for developers who demand precision.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href="/api/download?type=installer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  borderRadius: 12,
                  background: "#fff",
                  color: "#000",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 16px rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#e0e0e0"; el.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#fff"; el.style.transform = "translateY(0)"; }}
              >
                <Download size={15} />
                Download for Windows
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    background: "#e5e5e5",
                    color: "#555",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  180 MB
                </span>
              </a>

              <Link
                href="/chat"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "13px 22px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ccc",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.09)"; el.style.color = "#fff"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.05)"; el.style.color = "#ccc"; }}
              >
                Open in browser <ExternalLink size={13} />
              </Link>
            </div>

            <p style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
              Also available for&nbsp;
              <a href="#downloads" style={{ color: "#666", textDecoration: "underline", textUnderlineOffset: 3 }}>macOS</a>
              &nbsp;and&nbsp;
              <a href="#downloads" style={{ color: "#666", textDecoration: "underline", textUnderlineOffset: 3 }}>Linux</a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ PRODUCT PREVIEW FRAME ══════════════ */}
      <section style={{ padding: "0 24px 100px", position: "relative" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Frame */}
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0a0a0c",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                height: 42,
                background: "#111115",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 8,
              }}
            >
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a3a3a", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a3a3a", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a3a3a", display: "inline-block" }} />
              <span style={{ marginLeft: 12, fontSize: 12, color: "#555", fontFamily: "monospace" }}>Clarity // Workspace</span>
              <span
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#4ade80",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
                Cowork agent active
              </span>
            </div>

            {/* Content area – two pane */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", minHeight: 380 }}>
              {/* Left – execution plan */}
              <div
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Execution Plan
                </div>
                {[
                  { done: true, text: "Clone & inspect codebase schema", sub: "Prisma schema + route handlers parsed" },
                  { done: true, text: "Decompose & synthesize architecture", sub: "Zero-overhead clean refactor" },
                  { done: false, text: "Code diff + live artifact", sub: "Awaiting one-click approval" },
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "14px 14px",
                      borderRadius: 10,
                      background: step.done ? "rgba(255,255,255,0.02)" : "rgba(74,222,128,0.04)",
                      border: `1px solid ${step.done ? "rgba(255,255,255,0.05)" : "rgba(74,222,128,0.2)"}`,
                    }}
                  >
                    {step.done ? (
                      <Check size={15} style={{ color: "#4ade80", flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#4ade80",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: step.done ? "#ccc" : "#4ade80" }}>{step.text}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{step.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right – code output */}
              <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 14,
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#aaa" }}>Clarity Output</span>
                  <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>verified · no hallucinations</span>
                </div>

                <div
                  style={{
                    background: "#000",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "16px 18px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ color: "#555", marginBottom: 8, fontSize: 10 }}>// agent/pipeline.ts</div>
                  <div style={{ color: "#4ade80" }}>+ export async function executePlan(task: CoworkTask) {"{"}</div>
                  <div style={{ color: "#4ade80" }}>+   const approval = await requireUserApproval(task);</div>
                  <div style={{ color: "#4ade80" }}>+   if (approval.granted) return task.deployToVercel();</div>
                  <div style={{ color: "#555" }}>{"}"}</div>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#666" }}>Artifacts: Mermaid Diagram + Git Branch</span>
                  <button
                    style={{
                      padding: "7px 16px",
                      borderRadius: 7,
                      background: "#fff",
                      color: "#000",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Approve & Merge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ STAT BAR ══════════════ */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "32px 24px",
          background: "#050507",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            textAlign: "center",
          }}
        >
          {[
            { n: 3, s: " pillars", label: "Core product pillars" },
            { n: 100, s: "%", label: "Local — your data stays yours" },
            { n: 0, s: " noise", label: "Zero hallucinated filler in output" },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
                <Counter target={item.n} suffix={item.s} />
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ PILLAR 1: COWORK ══════════════ */}
      <section id="cowork" style={{ padding: "100px 24px", background: "#000" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Autonomous Cowork Mode
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
              Your AI coworker.<br />Not a chatbot.
            </h2>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.75, marginBottom: 32 }}>
              Clarity integrates into your GitHub, Vercel, and MCP tool ecosystem to act as a true peer engineer — cloning, inspecting, refactoring, and shipping — while you retain full approval authority at every step.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Connect GitHub repos for autonomous PR generation",
                "Human-in-loop: approve before every write or deploy",
                "Extend with MCP servers and local browser agents",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#aaa" }}>
                  <Check size={15} style={{ color: "#4ade80", flexShrink: 0, marginTop: 2 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Visual: workflow steps */}
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0c0c0f",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Live workflow</div>
            {[
              { icon: "⬢", label: "GitHub connected", status: "synced", color: "#4ade80" },
              { icon: "⬡", label: "MCP tool query", status: "running", color: "#facc15" },
              { icon: "⬡", label: "Vercel preview deploy", status: "queued", color: "#555" },
              { icon: "⬢", label: "PR generated + approval", status: "waiting", color: "#a78bfa" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: row.color, fontSize: 14 }}>{row.icon}</span>
                  <span style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{row.label}</span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: `${row.color}18`,
                    color: row.color,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PILLAR 2: RESPONSE ══════════════ */}
      <section id="response" style={{ padding: "100px 24px", background: "#050507", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Visual: response sample */}
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0c0c0f",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>clarity_response.md</span>
              <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>no fluff</span>
            </div>
            <div style={{ padding: 24, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: "#aaa" }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 10 }}>## Architecture Decision</div>
              <div style={{ marginBottom: 6 }}>The bottleneck is at <span style={{ color: "#60a5fa" }}>db.query()</span> — here's why:</div>
              <div style={{ background: "#000", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
                <div style={{ color: "#a3e635" }}>graph TD</div>
                <div style={{ color: "#aaa" }}>{"  A[Request] --> B{Cache?}"}</div>
                <div style={{ color: "#aaa" }}>{"  B -->|miss| C[DB Query ⚠️]"}</div>
                <div style={{ color: "#4ade80" }}>{"  B -->|hit| D[Response < 1ms]"}</div>
              </div>
              <div style={{ color: "#555", fontSize: 11 }}>• 3-step fix below. No boilerplate. No padding text.</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Deterministic Precision
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
              Clarity in response.<br />Zero fluff.
            </h2>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.75, marginBottom: 32 }}>
              Traditional AI buries answers under paragraphs of filler. Clarity outputs structured, actionable responses — syntax-highlighted code, Mermaid diagrams, LaTeX, and Kanban boards, generated straight from context.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Mermaid.js sequence diagrams & flowcharts rendered live",
                "Document synthesis from multi-page PDFs & codebases",
                "Kanban boards generated from natural language tasks",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#aaa" }}>
                  <Check size={15} style={{ color: "#4ade80", flexShrink: 0, marginTop: 2 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ PILLAR 3: THOUGHT ══════════════ */}
      <section id="thought" style={{ padding: "100px 24px", background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Cognitive Foundation
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
              Clarity in thought.<br />First-principles logic.
            </h2>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.75, marginBottom: 32 }}>
              Clarity deconstructs problems to core axioms before generating a single character. Cross-chat memory persists your project structure and directives. A PIN-locked vault keeps sensitive context private and local.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Cross-session memory vault — remembers your codebase rules",
                "First-principles reasoning shown step by step",
                "PIN-encrypted confidential chat vault — stays on device",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#aaa" }}>
                  <Check size={15} style={{ color: "#4ade80", flexShrink: 0, marginTop: 2 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Visual: memory vault */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: "Memory Vault", desc: "Coding standards, directives & project schema retained across every session.", icon: "🧠", badge: "always-on" },
              { title: "PIN Lock Vault", desc: "Client-side 4-digit PIN encrypts sensitive chats. Never leaves your device.", icon: "🔒", badge: "private" },
              { title: "Context Isolation", desc: "Each reasoning chain is scoped. No cross-contamination between projects.", icon: "⬡", badge: "scoped" },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  padding: "18px 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "#0c0c0f",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ddd" }}>{card.title}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        color: "#777",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ DOWNLOAD ══════════════ */}
      <section id="downloads" style={{ padding: "100px 24px", background: "#050507", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Native app
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 16 }}>
            Get Clarity.
          </h2>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, marginBottom: 52 }}>
            Optimized native desktop executables. Fast startup, offline recovery, persistent window state.
          </p>

          {/* Windows — primary */}
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0d0d10",
              padding: 32,
              marginBottom: 16,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Monitor size={24} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Clarity for Windows</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Windows 10 / 11 (64-bit) · v1.0.0 · ~180 MB</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href="/api/download?type=installer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "11px 22px",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#e0e0e0")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}
              >
                <Download size={14} /> Download Setup (.exe)
              </a>
              <a
                href="/api/download?type=portable"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "11px 18px",
                  borderRadius: 10,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#aaa",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#fff"; el.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#aaa"; el.style.borderColor = "rgba(255,255,255,0.12)"; }}
              >
                Portable (.exe)
              </a>
            </div>
          </div>

          {/* Other platforms */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { icon: <Laptop size={16} />, name: "macOS Universal", link: ".dmg" },
              { icon: <Terminal size={16} />, name: "Linux Package", link: ".AppImage" },
              { icon: <Globe size={16} />, name: "Web App", link: "Launch" },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "#0d0d10",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#777" }}>
                  {p.icon}
                  <span style={{ fontSize: 13, color: "#bbb", fontWeight: 500 }}>{p.name}</span>
                </div>
                <Link href="/chat" style={{ fontSize: 12, color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}>{p.link}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ BUILDER QUOTE ══════════════ */}
      <section style={{ padding: "100px 24px", background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <blockquote
            style={{
              fontSize: "clamp(18px, 3vw, 26px)",
              fontWeight: 500,
              color: "#888",
              lineHeight: 1.6,
              letterSpacing: "-0.02em",
              marginBottom: 32,
              fontStyle: "normal",
            }}
          >
            "We built Clarity because modern AI tools were becoming
            too noisy, too cluttered, too distracted. Our mission is
            simple:&nbsp;
            <span style={{ color: "#fff", fontWeight: 600 }}>pure clarity in thought, pure clarity in response</span>
            , and real cowork capability for every developer."
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#1a1a1e",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#888",
              }}
            >
              S
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>Shivam Kothekar</div>
              <div style={{ fontSize: 11, color: "#555" }}>Builder of Clarity</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 40 }}>
            <Link
              href="/signup"
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                background: "#fff",
                color: "#000",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#e0e0e0")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}
            >
              Get started free
            </Link>
            <a
              href="https://github.com/ShivamSk07/Mindmate"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "12px 22px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#aaa",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#fff"; el.style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#aaa"; el.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <Github size={14} /> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer
        style={{
          padding: "28px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "#000",
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 3,
              }}
            >
              <img src="/img/logo.png" alt="Clarity" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>Clarity</span>
            <span style={{ fontSize: 12, color: "#333" }}>— by Shivam Kothekar</span>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#555" }}>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
            <Link href="/signup" style={{ color: "inherit", textDecoration: "none" }}>Sign up</Link>
          </div>

          <div style={{ fontSize: 11, color: "#333", fontFamily: "monospace" }}>
            © {new Date().getFullYear()} Shivam Kothekar
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { scroll-margin-top: 70px; }
      `}</style>
    </div>
  );
}
