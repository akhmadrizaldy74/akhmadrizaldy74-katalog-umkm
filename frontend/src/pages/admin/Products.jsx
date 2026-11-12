import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { useEditor } from "../../lib/editor.jsx";
import { rupiah } from "../../lib/format.js";
import ProductImage from "../../components/ProductImage.jsx";

export default function Products() {
  const editor = useEditor();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState(""); // "" | "low" | "hidden" | "nophoto"
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/api/products", { params: { include_inactive: true, limit: 100, q, category: cat, sort: "name" } })
      .then((d) => setProducts(d.items))
      .catch((e) => setError(e.message));
  }, [q, cat]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, editor.version]);
  useEffect(() => {
    api("/api/categories").then(setCategories).catch(() => {});
  }, [editor.version]);

  async function patch(p, body) {
    setError("");
    try {
      const updated = await api(`/api/products/${p.id}`, { method: "PUT", body });
      setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  const shown = (products || []).filter((p) =>
    filter === "low" ? p.stock <= 5 : filter === "hidden" ? !p.is_active : filter === "nophoto" ? !p.image_url : true
  );
  const counts = {
    low: products?.filter((p) => p.stock <= 5).length || 0,
    hidden: products?.filter((p) => !p.is_active).length || 0,
    nophoto: products?.filter((p) => !p.image_url).length || 0,
  };

  return (
    <>
      <div className="page-head">
        <h1>Produk</h1>
        <button className="btn btn-primary" onClick={editor.create}>+ Produk Baru</button>
      </div>
      <div className="filters">
        <input className="input search" type="search" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sort" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <div className="chips">
        {[["", "Semua"], ["low", `Stok menipis (${counts.low})`], ["hidden", `Disembunyikan (${counts.hidden})`], ["nophoto", `Tanpa foto (${counts.nophoto})`]].map(([v, l]) => (
          <button key={v} className={`chip ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      {error && <p className="alert alert-error">{error}</p>}

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr><th></th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className={p.is_active ? "" : "row-muted"}>
                <td>
                  <button className="thumb-edit" onClick={() => editor.edit(p)} title="Kelola foto">
                    <ProductImage product={p} className="thumb" />
                    {p.images?.length > 1 && <span className="thumb-count">{p.images.length}</span>}
                  </button>
                </td>
                <td>
                  <Link to={`/produk/${p.slug}`} className="row-title"><strong>{p.name}</strong></Link>
                  {!p.image_url && <div className="text-warn tiny">Belum ada foto</div>}
                </td>
                <td>{p.category?.name || "—"}</td>
                <td>{rupiah(p.price)}</td>
                <td>
                  <StockInput product={p} onSave={(stock) => patch(p, { stock })} />
                </td>
                <td>
                  <button className={`status ${p.is_active ? "status-done" : "status-cancelled"}`} onClick={() => patch(p, { is_active: !p.is_active })} title="Klik untuk ubah">
                    {p.is_active ? "Tampil" : "Disembunyikan"}
                  </button>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => editor.edit(p)}>Edit</button>
                </td>
              </tr>
            ))}
            {products && shown.length === 0 && <tr><td colSpan={7} className="muted center">Tidak ada produk.</td></tr>}
            {!products && <tr><td colSpan={7} className="muted center">Memuat…</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Ubah stok langsung di tabel: tombol −/+ atau ketik angka lalu Enter. */
function StockInput({ product, onSave }) {
  const [value, setValue] = useState(product.stock);
  useEffect(() => setValue(product.stock), [product.stock]);
  const commit = (v) => {
    const n = Math.max(0, Number(v) || 0);
    setValue(n);
    if (n !== product.stock) onSave(n);
  };
  return (
    <div className={`stock-input ${product.stock <= 5 ? "low" : ""}`}>
      <button onClick={() => commit(value - 1)} aria-label="Kurangi stok">−</button>
      <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} aria-label="Stok" />
      <button onClick={() => commit(Number(value) + 1)} aria-label="Tambah stok">+</button>
    </div>
  );
}
