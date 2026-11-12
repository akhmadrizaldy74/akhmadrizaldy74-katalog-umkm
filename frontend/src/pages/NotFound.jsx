import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>404</h1>
      <p>Halaman tidak ditemukan.</p>
      <Link to="/" className="btn btn-primary">Ke Katalog</Link>
    </div>
  );
}
