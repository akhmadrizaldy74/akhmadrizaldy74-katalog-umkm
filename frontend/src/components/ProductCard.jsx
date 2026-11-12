import { Link } from "react-router-dom";
import { useCart } from "../lib/cart.jsx";
import { rupiah } from "../lib/format.js";
import ProductImage from "./ProductImage.jsx";

export default function ProductCard({ product }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.id === product.id)?.quantity || 0;
  const soldOut = product.stock === 0;

  return (
    <article className="card product-card">
      <Link to={`/produk/${product.slug}`} className="product-link">
        <ProductImage product={product} />
        <div className="product-body">
          {product.category && <span className="chip chip-sm">{product.category.name}</span>}
          <h3>{product.name}</h3>
          <p className="price">{rupiah(product.price)}</p>
          <p className="muted small">{soldOut ? "Stok habis" : `Stok ${product.stock}`}</p>
        </div>
      </Link>
      <div className="product-actions">
        <button className="btn btn-primary btn-block" disabled={soldOut || inCart >= product.stock} onClick={() => add(product)}>
          {soldOut ? "Habis" : inCart ? `+ Tambah (${inCart})` : "+ Keranjang"}
        </button>
      </div>
    </article>
  );
}
