import json
from unittest import mock

import handler

EVENT = {
    "type": "order.created",
    "store": "Toko Kita",
    "code": "ORD-ABC123",
    "customer_name": "Budi",
    "customer_phone": "6281234567890",
    "total": 45000,
    "total_text": "Rp45.000",
    "items": [{"name": "Keripik", "qty": 3}],
}


def test_format_message():
    msg = handler.format_message(EVENT)
    assert "ORD-ABC123" in msg and "Rp45.000" in msg and "Keripik × 3" in msg


def test_partial_batch_failure():
    records = [
        {"messageId": "ok", "body": json.dumps(EVENT)},
        {"messageId": "rusak", "body": "bukan json"},
    ]
    with mock.patch.object(handler, "send_telegram") as send:
        result = handler.handler({"Records": records}, None)
    send.assert_called_once()
    assert result == {"batchItemFailures": [{"itemIdentifier": "rusak"}]}
