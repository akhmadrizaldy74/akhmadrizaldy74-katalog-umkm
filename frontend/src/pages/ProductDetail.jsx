import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../lib/cart.jsx";
import { useEditor } from "../lib/editor.jsx";
import { rupiah } from "../lib/format.js";
import ProductImage from "../components/ProductImage.jsx";
import { galleryOf } from "../components/ProductForm.jsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const editor = useEditor();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setError("");
    api(`/api/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setActive((a) => Math.min(a, Math.max(0, galleryOf(p).length - 1)));
      })
      .catch((e) => setError(e.message));
  }, [slug, editor.version]);

  useEffect(() => setActive(0), [slug]);

  if (error) return <p className="empty">{error}. <Link to="/">Kembali ke katalog</Link></p>;
  if (!product) return <div className="detail"><div className="product-img shimmer detail-img" /><div /></div>;

  const soldOut = product.stock === 0;
  const gallery = galleryOf(product);
  const current = gallery[active];

  function addToCart() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <nav className="crumbs small">
        <Link to="/">Katalog</Link>
        {product.category && <> / <Link to={`/?kategori=${product.category.slug}`}>{product.category.name}</Link></>}
        <span className="muted"> / {product.name}</span>
      </nav>
      <div className="detail">
        <div className="gallery">
          <div className="gallery-main">
            <ProductImage product={product} src={current?.url} className="detail-img" eager />
            {gallery.length > 1 && (
              <>
                <button className="nav-arrow left" aria-label="Foto sebelumnya"
                  onClick={() => setActive((a) => (a - 1 + gallery.length) % gallery.length)}>‹</button>
                <button className="nav-arrow right" aria-label="Foto berikutnya"
                  onClick={() => setActive((a) => (a + 1) % gallery.length)}>›</button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="thumbs">
              {gallery.map((img, i) => (
                <button key={img.id ?? img.url} className={`thumb-btn ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                  <img src={img.url} alt={`${product.name} foto ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          {product.category && <span className="eyebrow">{product.category.name}</span>}
          <h1>{product.name}</h1>
          <p className="price price-lg">{rupiah(product.price)}</p>
          <p className={soldOut ? "text-danger" : product.stock <= 5 ? "text-warn" : "muted"}>
            {soldOut ? "Stok habis" : product.stock <= 5 ? `Tinggal ${product.stock} lagi!` : `Stok tersedia: ${product.stock}`}
          </p>
          {!product.is_active && <p className="alert alert-warn">Produk ini sedang disembunyikan dari katalog.</p>}
          <p className="description">{product.description || "Belum ada deskripsi."}</p>

          {!soldOut && (
            <div className="buy-row">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Tambah">+</button>
              </div>
              <button className="btn btn-primary" onClick={addToCart}>
                {added ? "✓ Ditambahkan" : "+ Keranjang"}
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
          <ul className="perks small">
            <li>💬 Pesanan dikonfirmasi langsung lewat WhatsApp</li>
            <li>🚚 Ongkir diinformasikan penjual</li>
          </ul>
          {editor.enabled && (
            <button className="btn btn-outline" onClick={() => editor.edit(product)}>✏️ Edit produk & foto</button>
          )}
        </div>
      </div>
    </>
  );
}
