"""Kirim event 'order dibuat' ke AWS SQS.

Lambda `notify_order` membaca antrian ini dan mengirim notifikasi Telegram ke pemilik toko.
Kalau SQS_QUEUE_URL kosong, fungsi ini tidak melakukan apa-apa (aman untuk development).
"""

import json
import logging

from app.config import settings
from app.utils import rupiah

log = logging.getLogger(__name__)


def order_event(order, store_name: str) -> dict:
    return {
        "type": "order.created",
        "store": store_name,
        "code": order.code,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "total": order.total,
        "total_text": rupiah(order.total),
        "items": [{"name": i.product_name, "qty": i.quantity} for i in order.items],
    }


def publish_order_created(event: dict) -> None:
    if not settings.sqs_queue_url:
        return
    try:
        import boto3

        boto3.client("sqs", region_name=settings.aws_region).send_message(
            QueueUrl=settings.sqs_queue_url, MessageBody=json.dumps(event)
        )
    except Exception:  # notifikasi gagal tidak boleh menggagalkan order
        log.exception("Gagal mengirim event order ke SQS")
