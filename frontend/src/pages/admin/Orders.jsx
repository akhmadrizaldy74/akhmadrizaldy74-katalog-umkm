import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { dateTime, rupiah, STATUS_LABEL } from "../../lib/format.js";

const FLOW = ["pending", "confirmed", "shipped", "done", "cancelled"];

export default function Orders() {
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/api/orders", { params: { status } })
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order, next) {
    if (next === "cancelled" && !confirm("Batalkan pesanan? Stok akan dikembalikan.")) return;
    setError("");
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", body: { status: next } });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Pesanan</h1>
      <div className="chips">
        <button className={`chip ${!status ? "active" : ""}`} onClick={() => setStatus("")}>Semua</button>
        {FLOW.map((s) => (
          <button key={s} className={`chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      {!orders && <p className="muted">Memuat…</p>}
      {orders?.length === 0 && <p className="empty">Belum ada pesanan.</p>}

      <div className="orders">
        {orders?.map((o) => (
          <article key={o.id} className="card order">
            <header className="order-head" onClick={() => setOpen(open === o.id ? null : o.id)}>
              <div>
                <strong className="code">{o.code}</strong>
                <span className="muted small"> · {dateTime(o.created_at)}</span>
                <div>{o.customer_name}</div>
              </div>
              <div className="order-right">
                <strong>{rupiah(o.total)}</strong>
                <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>
            </header>
            {open === o.id && (
              <div className="order-body">
                <ul className="order-items">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.product_name} × {it.quantity} <span className="muted">= {rupiah(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  📱 <a href={`https://wa.me/${o.customer_phone}`} target="_blank" rel="noreferrer">+{o.customer_phone}</a>
                  <br />📍 {o.customer_address}
                  {o.note && <><br />📝 {o.note}</>}
                </p>
                {o.status !== "cancelled" && (
                  <div className="actions">
                    {FLOW.filter((s) => s !== o.status).map((s) => (
                      <button key={s} className={`btn btn-sm ${s === "cancelled" ? "btn-danger" : ""}`} onClick={() => changeStatus(o, s)}>
                        → {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
