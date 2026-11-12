import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../lib/cart.jsx";
import { rupiah } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";

const EMPTY_FORM = { customer_name: "", customer_phone: "", customer_address: "", note: "" };

export default function Cart() {
  const { items, total, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Keranjang masih kosong.</p>
        <Link to="/" className="btn btn-primary">Lihat Produk</Link>
      </div>
    );
  }

  async function checkout(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await api("/api/orders", {
        method: "POST",
        body: { ...form, items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })) },
      });
      clear();
      navigate(`/pesanan/${res.order.code}`, { state: res });
      window.location.href = res.whatsapp_url; // buka WhatsApp dengan pesan otomatis
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  return (
    <div className="cart-layout">
      <section>
        <h1>Keranjang</h1>
        <ul className="cart-list">
          {items.map((i) => (
            <li key={i.id} className="cart-item card">
              <ProductImage product={i} className="cart-thumb" />
              <div className="cart-info">
                <Link to={`/produk/${i.slug}`}><strong>{i.name}</strong></Link>
                <span className="muted small">{rupiah(i.price)}</span>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Kurangi">−</button>
                <span>{i.quantity}</span>
                <button onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Tambah">+</button>
              </div>
              <strong className="cart-subtotal">{rupiah(i.price * i.quantity)}</strong>
              <button className="icon-btn" onClick={() => remove(i.id)} aria-label="Hapus">✕</button>
            </li>
          ))}
        </ul>
        <p className="cart-total">
          Total <strong>{rupiah(total)}</strong>
        </p>
        <p className="muted small">Ongkir dikonfirmasi penjual lewat WhatsApp.</p>
      </section>

      <form className="card form checkout" onSubmit={checkout}>
        <h2>Data Pemesan</h2>
        <label>
          Nama
          <input className="input" required minLength={2} {...field("customer_name")} />
        </label>
        <label>
          No. WhatsApp
          <input className="input" required inputMode="tel" placeholder="08xxxxxxxxxx" {...field("customer_phone")} />
        </label>
        <label>
          Alamat lengkap
          <textarea className="input" required minLength={5} rows={3} {...field("customer_address")} />
        </label>
        <label>
          Catatan (opsional)
          <textarea className="input" rows={2} {...field("note")} />
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-wa btn-block" disabled={sending}>
          {sending ? "Memproses…" : "Pesan via WhatsApp"}
        </button>
      </form>
    </div>
  );
}
