import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const EMPTY = { name: "", description: "", price: "", stock: "", category_id: "", is_active: true };
const MAX_IMAGES = 8;

/** Form tambah / edit produk lengkap dengan galeri foto (unggah banyak, pilih sampul, hapus). */
export default function ProductForm({ product, categories, onClose, onSaved, onChanged }) {
  const [form, setForm] = useState(() =>
    product ? { ...EMPTY, ...product, category_id: product.category?.id ?? "" } : EMPTY
  );
  const [images, setImages] = useState(() => galleryOf(product));
  const [pending, setPending] = useState([]); // [{file, url}] belum diunggah
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const room = MAX_IMAGES - images.length - pending.length;

  function addFiles(list) {
    const files = [...list].filter((f) => /^image\/(jpeg|png|webp|gif)$/.test(f.type)).slice(0, Math.max(0, room));
    if (list.length && !files.length) setError(room <= 0 ? `Maksimal ${MAX_IMAGES} foto per produk` : "File harus berupa gambar JPG, PNG, WEBP, atau GIF");
    setPending((p) => [...p, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  async function imageAction(fn) {
    setError("");
    setBusy("foto");
    try {
      const updated = await fn();
      setImages(galleryOf(updated));
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy("simpan");
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
      if (pending.length) {
        const fd = new FormData();
        pending.forEach((p) => fd.append("files", p.file));
        await api(`/api/products/${saved.id}/images`, { method: "POST", form: fd });
      }
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  async function remove() {
    if (!confirm(`Hapus "${product.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api(`/api/products/${product.id}`, { method: "DELETE" });
      onSaved(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="card form modal modal-lg" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{product ? "Edit Produk" : "Produk Baru"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className="form-split">
          <div className="form-col">
            <span className="label">Foto produk <span className="muted">({images.length + pending.length}/{MAX_IMAGES})</span></span>
            <div className="gallery-edit">
              {images.map((img, i) => (
                <figure key={img.id ?? img.url} className={`gallery-tile ${i === 0 ? "is-cover" : ""}`}>
                  <img src={img.url} alt="" />
                  {i === 0 && <span className="tile-badge">Sampul</span>}
                  {img.id && (
                    <div className="tile-actions">
                      {i !== 0 && (
                        <button type="button" disabled={!!busy} title="Jadikan sampul"
                          onClick={() => imageAction(() => api(`/api/products/${product.id}/images/${img.id}/cover`, { method: "PUT" }))}>
                          ★
                        </button>
                      )}
                      <button type="button" disabled={!!busy} title="Hapus foto"
                        onClick={() => confirm("Hapus foto ini?") &&
                          imageAction(() => api(`/api/products/${product.id}/images/${img.id}`, { method: "DELETE" }))}>
                        🗑
                      </button>
                    </div>
                  )}
                </figure>
              ))}
              {pending.map((p, i) => (
                <figure key={p.url} className={`gallery-tile is-pending ${images.length + i === 0 ? "is-cover" : ""}`}>
                  <img src={p.url} alt="" />
                  <span className="tile-badge tile-badge-new">Baru</span>
                  <div className="tile-actions">
                    <button type="button" title="Batal" onClick={() => setPending((list) => list.filter((x) => x !== p))}>✕</button>
                  </div>
                </figure>
              ))}
              {room > 0 && (
                <button
                  type="button"
                  className={`dropzone ${drag ? "drag" : ""}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                >
                  <span className="dz-icon">＋</span>
                  <span>Tambah foto</span>
                  <span className="muted tiny">klik / seret ke sini</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <p className="muted tiny">Foto otomatis dikompres ke WebP (maks 1200px). Foto pertama jadi sampul di katalog; klik ★ untuk mengganti.</p>
          </div>

          <div className="form-col">
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
            <label>Deskripsi<textarea className="input" rows={5} value={form.description} onChange={set("description")} /></label>
            <label className="check">
              <input type="checkbox" checked={form.is_active} onChange={set("is_active")} /> Tampilkan di katalog
            </label>
          </div>
        </div>

        {error && <p className="alert alert-error">{error}</p>}
        <div className="form-actions">
          {product && <button type="button" className="btn btn-danger mr-auto" onClick={remove}>Hapus produk</button>}
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" disabled={!!busy}>
            {busy === "simpan" ? (pending.length ? "Mengunggah foto…" : "Menyimpan…") : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Galeri produk; produk lama yang hanya punya image_url tetap tampil sebagai satu foto. */
export function galleryOf(product) {
  if (!product) return [];
  if (product.images?.length) return product.images;
  return product.image_url ? [{ id: null, url: product.image_url }] : [];
}
