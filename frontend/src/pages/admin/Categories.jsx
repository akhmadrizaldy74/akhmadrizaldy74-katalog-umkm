import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = () => api("/api/categories").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function run(fn) {
    setError("");
    try {
      await fn();
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Kategori</h1>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api("/api/categories", { method: "POST", body: { name } });
            setName("");
          });
        }}
      >
        <input className="input" placeholder="Nama kategori baru" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary">Tambah</button>
      </form>
      {error && <p className="alert alert-error">{error}</p>}

      <ul className="card list">
        {items.map((c) => (
          <li key={c.id}>
            <span>{c.name} <span className="muted small">/{c.slug}</span></span>
            <span className="actions">
              <button
                className="btn btn-sm"
                onClick={() => {
                  const n = prompt("Nama baru", c.name);
                  if (n) run(() => api(`/api/categories/${c.id}`, { method: "PUT", body: { name: n } }));
                }}
              >
                Ubah
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => confirm(`Hapus kategori "${c.name}"? Produk di dalamnya tidak ikut terhapus.`) &&
                  run(() => api(`/api/categories/${c.id}`, { method: "DELETE" }))}
              >
                Hapus
              </button>
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="muted">Belum ada kategori.</li>}
      </ul>
    </>
  );
}
