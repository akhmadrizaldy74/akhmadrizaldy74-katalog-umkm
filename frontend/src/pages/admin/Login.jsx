import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { useStore } from "../../lib/store.jsx";

/** Halaman masuk — tampil di dalam layout toko, jadi admin & pembeli memakai satu web yang sama. */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, login } = useAuth();
  const { store } = useStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const next = location.state?.from || "/admin";

  if (admin) return <Navigate to={next} replace />;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-art" aria-hidden="true">
        <span>🛍️</span>
        <h2>Kelola {store?.name || "toko"} dari satu tempat</h2>
        <ul>
          <li>Edit produk & foto langsung dari katalog</li>
          <li>Pantau pesanan masuk dan ubah statusnya</li>
          <li>Lihat pendapatan, produk terlaris & stok menipis</li>
        </ul>
      </div>
      <form className="card form login" onSubmit={submit}>
        <div>
          <h1>Masuk</h1>
          <p className="muted small">Khusus pemilik / admin toko.</p>
        </div>
        <label>
          Email
          <input className="input" type="email" required autoComplete="username" autoFocus
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <div className="input-group">
            <input className="input" type={show ? "text" : "password"} required autoComplete="current-password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="btn btn-sm" onClick={() => setShow((s) => !s)}>
              {show ? "Sembunyi" : "Lihat"}
            </button>
          </div>
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Memproses…" : "Masuk"}
        </button>
        <Link to="/" className="muted small center">← Kembali ke toko</Link>
      </form>
    </div>
  );
}
