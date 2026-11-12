import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { rupiah } from "../../lib/format.js";
import ProductImage from "../../components/ProductImage.jsx";

const EMPTY = { name: "", description: "", price: "", stock: "", category_id: "", is_active: true };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/api/products", { params: { include_inactive: true, limit: 100, q } })
      .then((d) => setProducts(d.items))
      .catch((e) => setError(e.message));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api("/api/categories").then(setCategories);
  }, []);

  async function toggle(p) {
    await api(`/api/products/${p.id}`, { method: "PUT", body: { is_active: !p.is_active } });
    load();
  }

  async function del(p) {
    if (!confirm(`Hapus "${p.name}"?`)) return;
    await api(`/api/products/${p.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="page-head">
        <h1>Produk</h1>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>+ Produk Baru</button>
      </div>
      <input className="input search" type="search" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="alert alert-error">{error}</p>}

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr><th></th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={p.is_active ? "" : "row-muted"}>
                <td><ProductImage product={p} className="thumb" /></td>
                <td><strong>{p.name}</strong></td>
                <td>{p.category?.name || "—"}</td>
                <td>{rupiah(p.price)}</td>
                <td className={p.stock <= 5 ? "text-warn" : ""}>{p.stock}</td>
                <td>
                  <button className={`status ${p.is_active ? "status-done" : "status-cancelled"}`} onClick={() => toggle(p)} title="Klik untuk ubah">
                    {p.is_active ? "Tampil" : "Disembunyikan"}
                  </button>
                </td>
                <td className="actions">
                  <button className="btn btn-sm" onClick={() => setEditing(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(p)}>Hapus</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={7} className="muted center">Belum ada produk.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(
    product ? { ...product, category_id: product.category?.id ?? "" } : EMPTY
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product?.image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      is_active: form.is_active,
      category_id: form.category_id ? Number(form.category_id) : null,
    };
    try {
      const saved = product
        ? await api(`/api/products/${product.id}`, { method: "PUT", body })
        : await api("/api/products", { method: "POST", body });
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        await api(`/api/products/${saved.id}/image`, { method: "POST", form: fd });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="card form modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2>{product ? "Edit Produk" : "Produk Baru"}</h2>
        <label>Nama<input className="input" required minLength={2} value={form.name} onChange={set("name")} /></label>
        <div className="form-row">
          <label>Harga (Rp)<input className="input" type="number" min={0} required value={form.price} onChange={set("price")} /></label>
          <label>Stok<input className="input" type="number" min={0} required value={form.stock} onChange={set("stock")} /></label>
        </div>
        <label>
          Kategori
          <select className="input" value={form.category_id} onChange={set("category_id")}>
            <option value="">— Tanpa kategori —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Deskripsi<textarea className="input" rows={4} value={form.description} onChange={set("description")} /></label>
        <label>
          Foto produk (otomatis dikompres ke WebP)
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files[0];
              setFile(f || null);
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        {preview && <img src={preview} alt="Pratinjau" className="preview" />}
        <label className="check">
          <input type="checkbox" checked={form.is_active} onChange={set("is_active")} /> Tampilkan di katalog
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</button>
        </div>
      </form>
    </div>
  );
}
