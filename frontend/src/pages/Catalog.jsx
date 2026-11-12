import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useEditor } from "../lib/editor.jsx";
import { useStore } from "../lib/store.jsx";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard.jsx";

const LIMIT = 12;
const SORTS = [
  ["newest", "Terbaru"],
  ["price_asc", "Harga termurah"],
  ["price_desc", "Harga termahal"],
  ["name", "Nama A–Z"],
];

export default function Catalog() {
  const { store } = useStore();
  const editor = useEditor();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("kategori") || "";
  const sort = params.get("urut") || "newest";
  const page = Number(params.get("page") || 1);

  const [search, setSearch] = useState(q);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [showcase, setShowcase] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/categories").then(setCategories).catch(() => {});
    api("/api/products", { params: { limit: 4, sort: "newest" } })
      .then((d) => setShowcase(d.items.filter((p) => p.image_url).slice(0, 3)))
      .catch(() => {});
  }, [editor.version]);

  useEffect(() => {
    setError("");
    setData(null);
    api("/api/products", {
      params: { q, category, page, limit: LIMIT, sort, include_inactive: editor.enabled },
    })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [q, category, page, sort, editor.enabled, editor.version]);

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
        <div className="hero-text">
          <span className="eyebrow eyebrow-light">Produk lokal · pesan via WhatsApp</span>
          <h1>{store?.name || "Katalog UMKM"}</h1>
          <p>{store?.description}</p>
          <div className="hero-cta">
            <a href="#produk" className="btn btn-light">Lihat produk ↓</a>
            {store?.whatsapp && (
              <a href={`https://wa.me/${store.whatsapp}`} className="btn btn-wa" target="_blank" rel="noreferrer">
                💬 Tanya penjual
              </a>
            )}
          </div>
        </div>
        {showcase.length > 0 && (
          <div className={`hero-collage n${showcase.length}`} aria-hidden="true">
            {showcase.map((p) => (
              <img key={p.id} src={p.image_url} alt="" />
            ))}
          </div>
        )}
      </section>

      <div className="toolbar" id="produk">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="input search"
            type="search"
            placeholder="Cari keripik, kopi, batik…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari produk"
          />
        </div>
        <select className="input sort" value={sort} onChange={(e) => update({ urut: e.target.value === "newest" ? "" : e.target.value, page: "" })} aria-label="Urutkan">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
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

      {data && (
        <p className="muted small result-info">
          {data.total} produk{q && <> untuk “{q}”</>}
          {editor.enabled && <> · termasuk yang disembunyikan</>}
        </p>
      )}
      {error && <p className="alert alert-error">Gagal memuat produk: {error}</p>}
      {data && data.items.length === 0 && !editor.enabled && (
        <div className="empty">
          <div className="empty-icon">🔎</div>
          <p>Produk tidak ditemukan.</p>
          {(q || category) && <button className="btn" onClick={() => { setSearch(""); update({ q: "", kategori: "", page: "" }); }}>Reset filter</button>}
        </div>
      )}

      <div className="grid">
        {editor.enabled && (
          <button className="card add-tile" onClick={editor.create}>
            <span className="dz-icon">＋</span>
            <strong>Produk baru</strong>
            <span className="muted small">Tambah foto, harga & stok</span>
          </button>
        )}
        {!data && !error && Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
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
