import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth } from "../../lib/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token } = await api("/api/auth/login", { method: "POST", body: form });
      auth.set(access_token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card form login" onSubmit={submit}>
        <h1>🛍️ Masuk Admin</h1>
        <label>
          Email
          <input className="input" type="email" required autoComplete="username"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input className="input" type="password" required autoComplete="current-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
