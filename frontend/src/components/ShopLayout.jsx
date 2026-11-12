import { Link, Outlet } from "react-router-dom";
import { useCart } from "../lib/cart.jsx";
import { useStore } from "../lib/store.jsx";

export default function ShopLayout() {
  const { count } = useCart();
  const { store } = useStore();

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">🛍️</span>
            {store?.name || "Katalog UMKM"}
          </Link>
          <Link to="/keranjang" className="cart-link" aria-label="Keranjang">
            🛒 <span className="hide-sm">Keranjang</span>
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <strong>{store?.name}</strong>
          {store?.address && <span> · {store.address}</span>}
          {store?.whatsapp && (
            <span>
              {" "}
              · <a href={`https://wa.me/${store.whatsapp}`}>WhatsApp +{store.whatsapp}</a>
            </span>
          )}
        </div>
      </footer>
    </>
  );
}
