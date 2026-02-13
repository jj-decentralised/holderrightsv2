import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, flow });
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          placeholder="you@decentralised.co"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          placeholder="••••••••"
          required
        />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? "..." : flow === "signIn" ? "Sign in" : "Create account"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        {flow === "signIn" ? "No account? " : "Already have one? "}
        <button type="button" onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")} className="text-indigo-600 hover:underline">
          {flow === "signIn" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
