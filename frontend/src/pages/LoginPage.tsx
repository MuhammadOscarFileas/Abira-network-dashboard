import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginUser(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-secondary rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          {/* Logo Abira (placeholder inisial A) */}
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3">
            A
          </div>
          <h2 className="text-xl font-semibold text-textcharcoal">
            Abira Net
          </h2>
          <p className="text-sm text-textcharcoal/70 mt-1">
            Silakan login untuk masuk ke dashboard
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-secondary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-xs text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#121a5a] transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

