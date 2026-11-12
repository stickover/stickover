import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { api } from "../../utils/api";
import BrandLogo from "../../components/BrandLogo";

// Shopify-style two-step login: email first ("Continue with email"), then a
// second screen asking for the password for that email (with a back link to
// edit the email). Visual language (dark gradient backdrop, white card,
// top-left logo lockup, dark "Continue" pill) matches Shopify's login page.
export default function AdminLogin() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google", { credential: response.credential });
      sessionStorage.setItem("stickover_admin_token", res.token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "email") return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !(window as any).google || !googleBtnRef.current) return;

    const width = Math.round(googleBtnRef.current.getBoundingClientRect().width) || 356;

    (window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });
    (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "filled_black",
      shape: "pill",
      size: "large",
      width,
      text: "continue_with",
      logo_alignment: "left",
    });
  }, [step]);

  const continueWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setStep("password");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      sessionStorage.setItem("stickover_admin_token", res.token);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(circle at 20% 75%, #4c3a9e 0%, rgba(76,58,158,0) 45%), radial-gradient(circle at 85% 20%, #0f766e 0%, rgba(15,118,110,0) 50%), #0b0b0d",
      }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
        <div className="mb-7">
          <BrandLogo markClassName="h-9 w-9" textClassName="text-xl" gap="gap-2" />
        </div>

        {step === "email" ? (
          <>
            <h1 className="text-[26px] font-black text-zinc-900 tracking-tight">Log in</h1>
            <p className="text-sm text-zinc-500 mt-1 mb-6">Continue to Stickover Admin</p>

            <form onSubmit={continueWithEmail} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl px-3.5 py-2.5">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="your-email@your-email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="w-full bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 rounded-xl px-3.5 py-3 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-liquid-dark w-full text-white font-bold py-3 rounded-xl"
              >
                Continue with email
              </button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <span className="text-xs text-zinc-400 font-medium">or</span>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>
                <div ref={googleBtnRef} className="flex justify-center [&>div]:!w-full" />
              </>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 mb-4 -ml-1 cursor-pointer"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <h1 className="text-[26px] font-black text-zinc-900 tracking-tight">Enter your password</h1>
            <p className="text-sm text-zinc-500 mt-1 mb-6 truncate">Signing in as <span className="font-semibold text-zinc-700">{email}</span></p>

            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl px-3.5 py-2.5">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    className="w-full bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 rounded-xl pl-10 pr-10 py-3 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-liquid-dark w-full text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Log in"}
              </button>
            </form>
          </>
        )}

        <p className="mt-7 flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium">
          <ShieldCheck size={14} /> Secure admin access only
        </p>
      </div>
    </div>
  );
}
