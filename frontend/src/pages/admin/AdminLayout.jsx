import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";
import { useStore } from "../../lib/store.jsx";

const NAV = [
  ["/admin", "📊", "Dashboard", true],
  ["/admin/pesanan", "🧾", "Pesanan"],
  ["/admin/produk", "📦", "Produk"],
  ["/admin/kategori", "🏷️", "Kategori"],
  ["/admin/pengaturan", "⚙️", "Pengaturan"],
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, checking, logout } = useAuth();
  const { store } = useStore();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!admin) return;
    api("/api/orders", { params: { status: "pending", limit: 200 } })
      .then((o) => setPending(o.length))
      .catch(() => {});
  }, [admin, location.pathname]);

  if (checking) return <p className="muted center page">Memuat…</p>;
  if (!admin) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />;

  return (
    <div className="admin">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">🛍️</span>
          <span className="brand-name">{store?.name || "Toko"}</span>
        </Link>
        <nav>
          {NAV.map(([to, icon, label, end]) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <span>{icon}</span> <span className="side-label">{label}</span>
              {to === "/admin/pesanan" && pending > 0 && <span className="badge">{pending}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link to="/" className="side-link store-link">🏪 <span className="side-label">Lihat & edit toko</span></Link>
          <span className="muted small">{admin.email}</span>
          <button className="btn btn-sm btn-ghost-dark" onClick={() => { logout(); navigate("/"); }}>Keluar</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
