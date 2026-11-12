import { Link } from "react-router-dom";
import { useCart } from "../lib/cart.jsx";
import { useEditor } from "../lib/editor.jsx";
import { rupiah } from "../lib/format.js";
import ProductImage from "./ProductImage.jsx";

export default function ProductCard({ product }) {
  const { add, items } = useCart();
  const editor = useEditor();
  const inCart = items.find((i) => i.id === product.id)?.quantity || 0;
  const soldOut = product.stock === 0;
  const second = product.images?.[1]?.url;
  const photos = product.images?.length || (product.image_url ? 1 : 0);

  return (
    <article className={`card product-card ${product.is_active ? "" : "is-hidden"}`}>
      <Link to={`/produk/${product.slug}`} className="product-link">
        <div className="media">
          <ProductImage product={product} />
          {second && <ProductImage product={product} src={second} className="media-alt" />}
          <div className="media-badges">
            {soldOut && <span className="pill pill-dark">Habis</span>}
            {!soldOut && product.stock <= 5 && <span className="pill pill-warn">Sisa {product.stock}</span>}
            {!product.is_active && <span className="pill pill-dark">Disembunyikan</span>}
          </div>
          {photos > 1 && <span className="pill pill-glass photo-count">📷 {photos}</span>}
        </div>
        <div className="product-body">
          {product.category && <span className="eyebrow">{product.category.name}</span>}
          <h3>{product.name}</h3>
          <p className="price">{rupiah(product.price)}</p>
        </div>
      </Link>
      <div className="product-actions">
        <button className="btn btn-primary btn-block" disabled={soldOut || !product.is_active || inCart >= product.stock} onClick={() => add(product)}>
          {soldOut ? "Stok habis" : inCart ? `✓ Di keranjang (${inCart})` : "+ Keranjang"}
        </button>
        {editor.enabled && (
          <button className="btn btn-edit" onClick={() => editor.edit(product)} title="Edit produk">✏️</button>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card product-card skeleton" aria-hidden="true">
      <div className="media shimmer" />
      <div className="product-body">
        <div className="sk-line shimmer" style={{ width: "40%" }} />
        <div className="sk-line shimmer" style={{ width: "85%" }} />
        <div className="sk-line shimmer" style={{ width: "50%" }} />
      </div>
    </div>
  );
}
