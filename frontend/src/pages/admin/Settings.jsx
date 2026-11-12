import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { useStore } from "../../lib/store.jsx";

export default function Settings() {
  const { store, refresh } = useStore();
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (store) setForm(store);
  }, [store]);

  if (!form) return <p className="muted">Memuat…</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/api/store", { method: "PUT", body: form });
      await refresh();
      setMsg({ ok: true, text: "Tersimpan ✔" });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  return (
    <>
      <h1>Pengaturan Toko</h1>
      <form className="card form narrow" onSubmit={submit}>
        <label>Nama toko<input className="input" required value={form.name} onChange={set("name")} /></label>
        <label>
          Nomor WhatsApp penerima pesanan
          <input className="input" required value={form.whatsapp} onChange={set("whatsapp")} placeholder="0812xxxx atau 62812xxxx" />
        </label>
        <label>Deskripsi singkat<textarea className="input" rows={3} value={form.description} onChange={set("description")} /></label>
        <label>Alamat<textarea className="input" rows={2} value={form.address} onChange={set("address")} /></label>
        {msg && <p className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`}>{msg.text}</p>}
        <button className="btn btn-primary">Simpan</button>
      </form>
    </>
  );
}
