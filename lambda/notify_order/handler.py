"""AWS Lambda: baca event order dari SQS lalu kirim notifikasi Telegram ke pemilik toko.

Tanpa dependensi eksternal (hanya standard library) supaya paket zip kecil & cold start cepat.

Env:
  TELEGRAM_BOT_TOKEN  token dari @BotFather
  TELEGRAM_CHAT_ID    chat id pemilik toko (cek lewat @userinfobot)
"""

import json
import logging
import os
import urllib.parse
import urllib.request

log = logging.getLogger()
log.setLevel(logging.INFO)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def format_message(evt: dict) -> str:
    items = "\n".join(f"• {i['name']} × {i['qty']}" for i in evt.get("items", []))
    return (
        f"🛒 Pesanan baru di {evt.get('store', 'toko')}!\n\n"
        f"Kode: {evt['code']}\n"
        f"Pembeli: {evt['customer_name']} (+{evt['customer_phone']})\n"
        f"Total: {evt['total_text']}\n\n"
        f"{items}\n\n"
        f"Balas pembeli: https://wa.me/{evt['customer_phone']}"
    )


def send_telegram(text: str) -> None:
    url = TELEGRAM_API.format(token=os.environ["TELEGRAM_BOT_TOKEN"])
    data = urllib.parse.urlencode({"chat_id": os.environ["TELEGRAM_CHAT_ID"], "text": text}).encode()
    with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10) as res:
        if res.status != 200:
            raise RuntimeError(f"Telegram API status {res.status}")


def handler(event, context):
    """Partial batch response: hanya pesan yang gagal yang diulang oleh SQS."""
    failures = []
    for record in event.get("Records", []):
        try:
            evt = json.loads(record["body"])
            if evt.get("type") == "order.created":
                send_telegram(format_message(evt))
                log.info("Notifikasi terkirim untuk %s", evt["code"])
        except Exception:
            log.exception("Gagal memproses pesan %s", record.get("messageId"))
            failures.append({"itemIdentifier": record["messageId"]})
    return {"batchItemFailures": failures}
