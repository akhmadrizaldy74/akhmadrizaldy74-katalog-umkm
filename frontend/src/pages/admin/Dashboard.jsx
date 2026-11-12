import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { rupiah, STATUS_LABEL } from "../../lib/format.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats").then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!stats) return <p className="muted">Memuat…</p>;

  const maxQty = Math.max(1, ...stats.top_products.map((t) => t.quantity));

  return (
    <>
      <h1>Dashboard</h1>
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
