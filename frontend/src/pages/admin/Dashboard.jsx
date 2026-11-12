import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { useEditor } from "../../lib/editor.jsx";
import { dateTime, rupiah, STATUS_LABEL } from "../../lib/format.js";
import ProductImage from "../../components/ProductImage.jsx";

export default function Dashboard() {
  const editor = useEditor();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats").then(setStats).catch((e) => setError(e.message));
    api("/api/orders", { params: { limit: 5 } }).then(setRecent).catch(() => {});
  }, [editor.version]);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!stats) return <p className="muted">Memuat…</p>;

  const maxQty = Math.max(1, ...stats.top_products.map((t) => t.quantity));

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="actions">
          <Link to="/" className="btn">🏪 Lihat toko</Link>
          <button className="btn btn-primary" onClick={editor.create}>+ Produk Baru</button>
        </div>
      </div>
      <div className="stats">
        <Stat label="Pendapatan" value={rupiah(stats.revenue)} hint="dikonfirmasi, dikirim & selesai" />
        <Stat label="Pesanan baru" value={stats.orders_by_status.pending} hint={<Link to="/admin/pesanan">lihat →</Link>} />
        <Stat label="Produk aktif" value={`${stats.active_products} / ${stats.total_products}`} />
        <Stat label="Stok menipis" value={stats.low_stock} hint="≤ 5 unit" warn={stats.low_stock > 0} />
      </div>

      <div className="two-col">
        <section className="card pad">
          <h2>Status Pesanan</h2>
          <ul className="status-list">
            {Object.entries(stats.orders_by_status).map(([s, n]) => (
              <li key={s}>
                <span className={`status status-${s}`}>{STATUS_LABEL[s]}</span>
                <strong>{n}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="card pad">
          <h2>Produk Terlaris</h2>
          {stats.top_products.length === 0 && <p className="muted">Belum ada penjualan.</p>}
          <ul className="bars">
            {stats.top_products.map((t) => (
              <li key={t.product_name}>
                <span>{t.product_name}</span>
                <div className="bar"><div style={{ width: `${(t.quantity / maxQty) * 100}%` }} /></div>
                <strong>{t.quantity}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="two-col mt">
        <section className="card pad">
          <div className="section-head">
            <h2>Pesanan Terbaru</h2>
            <Link to="/admin/pesanan" className="small">Semua →</Link>
          </div>
          {recent.length === 0 && <p className="muted">Belum ada pesanan.</p>}
          <ul className="mini-list">
            {recent.map((o) => (
              <li key={o.id}>
                <div>
                  <strong className="code">{o.code}</strong> <span className="muted small">· {o.customer_name}</span>
                  <div className="muted tiny">{dateTime(o.created_at)}</div>
                </div>
                <div className="order-right">
                  <strong>{rupiah(o.total)}</strong>
                  <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card pad">
          <div className="section-head">
            <h2>Perlu Restok</h2>
            <Link to="/admin/produk" className="small">Kelola →</Link>
          </div>
          {stats.low_stock_products.length === 0 && <p className="muted">Semua stok aman 👍</p>}
          <ul className="mini-list">
            {stats.low_stock_products.map((p) => (
              <li key={p.id}>
                <div className="mini-prod">
                  <ProductImage product={p} className="thumb" />
                  <span>{p.name}</span>
                </div>
                <span className={p.stock === 0 ? "text-danger" : "text-warn"}>{p.stock === 0 ? "Habis" : `Sisa ${p.stock}`}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, hint, warn }) {
  return (
    <div className={`card stat ${warn ? "stat-warn" : ""}`}>
      <span className="muted small">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}
