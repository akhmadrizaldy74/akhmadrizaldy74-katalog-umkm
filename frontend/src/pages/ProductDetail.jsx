import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../lib/cart.jsx";
import { rupiah } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setProduct(null);
    api(`/api/products/${slug}`).then(setProduct).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="empty">{error}. <Link to="/">Kembali ke katalog</Link></p>;
  if (!product) return <p className="muted">Memuat…</p>;

  const soldOut = product.stock === 0;

  return (
    <div className="detail">
      <ProductImage product={product} className="detail-img" />
      <div>
        <Link to="/" className="muted small">← Katalog</Link>
        {product.category && <p><span className="chip chip-sm">{product.category.name}</span></p>}
        <h1>{product.name}</h1>
        <p className="price price-lg">{rupiah(product.price)}</p>
        <p className="muted">{soldOut ? "Stok habis" : `Stok tersedia: ${product.stock}`}</p>
        <p className="description">{product.description || "Belum ada deskripsi."}</p>

        {!soldOut && (
          <div className="buy-row">
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Tambah">+</button>
            </div>
            <button className="btn btn-primary" onClick={() => add(product, qty)}>
              + Keranjang
            </button>
            <button
              className="btn btn-wa"
              onClick={() => {
                add(product, qty);
                navigate("/keranjang");
              }}
            >
              Pesan Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
