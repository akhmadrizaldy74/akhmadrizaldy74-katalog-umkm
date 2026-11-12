export const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

export const dateTime = (iso) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export const STATUS_LABEL = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Dibatalkan",
};
