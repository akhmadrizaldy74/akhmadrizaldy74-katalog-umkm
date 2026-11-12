import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useStore } from "../lib/store.jsx";
import ProductCard from "../components/ProductCard.jsx";

const LIMIT = 12;

export default function Catalog() {
  const { store } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("kategori") || "";
  const page = Number(params.get("page") || 1);

  const [search, setSearch] = useState(q);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setError("");
    api("/api/products", { params: { q, category, page, limit: LIMIT } })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [q, category, page]);

  // debounce pencarian
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => update({ q: search, page: "" }), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <>
      <section className="hero">
        <h1>{store?.name || "Katalog UMKM"}</h1>
        <p>{store?.description}</p>
      </section>

      <div className="toolbar">
        <input
          className="input search"
          type="search"
          placeholder="Cari produk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari produk"
        />
        <div className="chips" role="tablist">
          <button className={`chip ${!category ? "active" : ""}`} onClick={() => update({ kategori: "", page: "" })}>
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${category === c.slug ? "active" : ""}`}
              onClick={() => update({ kategori: c.slug, page: "" })}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="alert alert-error">Gagal memuat produk: {error}</p>}
      {!data && !error && <p className="muted">Memuat produk…</p>}
      {data && data.items.length === 0 && <p className="empty">Produk tidak ditemukan.</p>}

      <div className="grid">
        {data?.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {pages > 1 && (
        <nav className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
            ← Sebelumnya
          </button>
          <span className="muted">
            Hal {page} / {pages}
          </span>
          <button className="btn" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>
            Berikutnya →
          </button>
        </nav>
      )}
    </>
  );
}
