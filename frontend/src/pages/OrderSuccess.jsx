import { Link, useLocation, useParams } from "react-router-dom";
import { rupiah } from "../lib/format.js";

export default function OrderSuccess() {
  const { code } = useParams();
  const { state } = useLocation();

  return (
    <div className="card success">
      <div className="success-icon">✅</div>
      <h1>Pesanan dibuat!</h1>
      <p>
        Kode pesanan kamu: <strong className="code">{code}</strong>
      </p>
      {state?.order && <p>Total belanja: <strong>{rupiah(state.order.total)}</strong></p>}
      <p className="muted">
        Kirim pesan WhatsApp yang sudah terisi otomatis ke penjual untuk konfirmasi ongkir dan pembayaran.
      </p>
      {state?.whatsapp_url && (
        <a className="btn btn-wa" href={state.whatsapp_url}>
          Buka WhatsApp
        </a>
      )}
      <p>
        <Link to="/">← Kembali belanja</Link>
      </p>
    </div>
  );
}
