import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, auth } from "../../lib/api.js";

const NAV = [
  ["/admin", "📊 Dashboard", true],
  ["/admin/pesanan", "🧾 Pesanan"],
  ["/admin/produk", "📦 Produk"],
  ["/admin/kategori", "🏷️ Kategori"],
  ["/admin/pengaturan", "⚙️ Pengaturan"],
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!auth.token) return;
    api("/api/auth/me")
      .then(setMe)
      .catch(() => navigate("/admin/login", { replace: true }));
  }, [navigate]);

  if (!auth.token) return <Navigate to="/admin/login" replace />;

  function logout() {
    auth.clear();
    navigate("/admin/login");
  }

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="brand">🛍️ Admin</div>
        <nav>
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer" className="side-link">↗ Lihat toko</a>
          {me && <span className="muted small">{me.email}</span>}
          <button className="btn btn-sm" onClick={logout}>Keluar</button>
        </div>
      </aside>
      <main className="admin-main">{me ? <Outlet /> : <p className="muted">Memuat…</p>}</main>
    </div>
  );
}
