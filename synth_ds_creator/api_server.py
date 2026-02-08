from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import random
import string

load_dotenv()

app = Flask(__name__)
CORS(app)

MOCK_DATASETS = {
    "airline": {
        "schema": [
            {"name": "flight_id", "type": "string"},
            {"name": "passenger_name", "type": "string"},
            {"name": "route", "type": "string"},
            {"name": "departure_date", "type": "string"},
            {"name": "delay_minutes", "type": "integer"},
            {"name": "status", "type": "string"},
        ],
        "rows": [
            {"flight_id": "AA101", "passenger_name": "Jane Doe", "route": "JFK-LAX", "departure_date": "2025-03-15", "delay_minutes": 0, "status": "on_time"},
            {"flight_id": "UA205", "passenger_name": "John Smith", "route": "ORD-SFO", "departure_date": "2025-03-16", "delay_minutes": 45, "status": "delayed"},
            {"flight_id": "DL302", "passenger_name": "Alice Brown", "route": "ATL-MIA", "departure_date": "2025-03-17", "delay_minutes": 0, "status": "on_time"},
        ],
    },
    "ecommerce": {
        "schema": [
            {"name": "order_id", "type": "string"},
            {"name": "product", "type": "string"},
            {"name": "price", "type": "float"},
            {"name": "quantity", "type": "integer"},
            {"name": "status", "type": "string"},
        ],
        "rows": [
            {"order_id": "ORD-1001", "product": "Wireless Headphones", "price": 89.99, "quantity": 2, "status": "shipped"},
            {"order_id": "ORD-1002", "product": "USB-C Hub", "price": 45.50, "quantity": 1, "status": "delivered"},
            {"order_id": "ORD-1003", "product": "Mechanical Keyboard", "price": 129.00, "quantity": 1, "status": "processing"},
        ],
    },
    "social_media": {
        "schema": [
            {"name": "post_id", "type": "string"},
            {"name": "author", "type": "string"},
            {"name": "content_preview", "type": "string"},
            {"name": "likes", "type": "integer"},
            {"name": "comments", "type": "integer"},
        ],
        "rows": [
            {"post_id": "p_001", "author": "user_alpha", "content_preview": "Just launched our new feature...", "likes": 234, "comments": 18},
            {"post_id": "p_002", "author": "user_beta", "content_preview": "Weekend vibes only.", "likes": 89, "comments": 5},
            {"post_id": "p_003", "author": "user_gamma", "content_preview": "Thread on synthetic data.", "likes": 412, "comments": 32},
        ],
    },
    "healthcare": {
        "schema": [
            {"name": "patient_id", "type": "string"},
            {"name": "appointment_date", "type": "string"},
            {"name": "department", "type": "string"},
            {"name": "status", "type": "string"},
        ],
        "rows": [
            {"patient_id": "P-5501", "appointment_date": "2025-03-20", "department": "Cardiology", "status": "scheduled"},
            {"patient_id": "P-5502", "appointment_date": "2025-03-21", "department": "General", "status": "completed"},
            {"patient_id": "P-5503", "appointment_date": "2025-03-22", "department": "Radiology", "status": "scheduled"},
        ],
    },
}

DEFAULT_DATASET = "ecommerce"


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "running",
        "message": "Synth Data API",
        "endpoints": {
            "health": "/health",
            "generate": "/api/generate (POST)"
        }
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json() or {}
    prompt = data.get("prompt", "").strip()
    domain = (data.get("domain") or "").strip().lower() or DEFAULT_DATASET

    if not prompt:
        return jsonify({"error": "prompt missing"}), 400

    if domain not in MOCK_DATASETS:
        domain = DEFAULT_DATASET

    payload = MOCK_DATASETS[domain]
    return jsonify({
        "schema": payload["schema"],
        "rows": payload["rows"],
        "meta": {
            "model": "mock-llm",
            "note": "Temporary mock due to HF API change",
        },
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
