import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useCart } from "../lib/cart.jsx";
import { useStore } from "../lib/store.jsx";

export default function ShopLayout() {
  const { count } = useCart();
  const { store } = useStore();
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!admin) return;
    api("/api/orders", { params: { status: "pending", limit: 200 } })
      .then((o) => setPending(o.length))
      .catch(() => {});
  }, [admin, location.pathname]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <>
      {admin && (
        <div className="admin-strip">
          <div className="container admin-strip-inner">
            <span>
              <strong>Mode admin</strong>
              <span className="hide-sm"> · klik ✏️ di produk untuk edit langsung</span>
            </span>
            <nav>
              <Link to="/admin">📊 Dashboard</Link>
              <Link to="/admin/pesanan">
                🧾 Pesanan{pending > 0 && <span className="badge badge-light">{pending}</span>}
              </Link>
              <Link to="/admin/produk" className="hide-sm">📦 Produk</Link>
            </nav>
          </div>
        </div>
      )}
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">🛍️</span>
            <span className="brand-name">{store?.name || "Katalog UMKM"}</span>
          </Link>
          <div className="topbar-actions">
            <NavLink to="/keranjang" className="pill-link" aria-label="Keranjang">
              🛒 <span className="hide-sm">Keranjang</span>
              {count > 0 && <span className="badge">{count}</span>}
            </NavLink>
            {admin ? (
              <div className="account" ref={menuRef}>
                <button className="pill-link avatar-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                  <span className="avatar">{admin.email.charAt(0).toUpperCase()}</span>
                  <span className="hide-sm">Admin</span> ▾
                </button>
                {menu && (
                  <div className="menu card" onClick={() => setMenu(false)}>
                    <span className="menu-email muted small">{admin.email}</span>
                    <Link to="/admin">📊 Dashboard</Link>
                    <Link to="/admin/pesanan">🧾 Pesanan</Link>
                    <Link to="/admin/produk">📦 Produk</Link>
                    <Link to="/admin/kategori">🏷️ Kategori</Link>
                    <Link to="/admin/pengaturan">⚙️ Pengaturan toko</Link>
                    <button onClick={() => { logout(); navigate("/"); }}>↪ Keluar</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/masuk" className="pill-link ghost">
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>{store?.name}</strong>
            {store?.description && <p className="muted small">{store.description}</p>}
          </div>
          <div className="small">
            {store?.address && <div>📍 {store.address}</div>}
            {store?.whatsapp && <div>💬 <a href={`https://wa.me/${store.whatsapp}`}>WhatsApp +{store.whatsapp}</a></div>}
          </div>
        </div>
      </footer>
    </>
  );
}
