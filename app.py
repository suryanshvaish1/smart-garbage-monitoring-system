from datetime import datetime, timezone
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="/static")

bins = {
    "BIN-01": {"fill_level": 35.0},
    "BIN-02": {"fill_level": 85.0},
}


def get_bin_status(fill_level):
    if fill_level >= 80:
        return "Almost Full"
    if fill_level >= 50:
        return "Half Full"
    return "Has Space"


@app.get("/")
def dashboard():
    return send_from_directory(".", "index.html")


@app.get("/api/bins")
def get_bins():
    result = []

    for bin_id, data in bins.items():
        fill = data["fill_level"]

        result.append({
            "device_id": bin_id,
            "fill_level": fill,
            "status": get_bin_status(fill),
            "sensor_distance_cm": round(40 * (1 - fill / 100), 2),
        })

    return jsonify({
        "bins": result,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })


@app.post("/api/bins/<bin_id>")
def update_bin(bin_id):
    if bin_id not in bins:
        return jsonify({"error": "Unknown bin ID"}), 404

    payload = request.get_json(silent=True) or {}
    fill = payload.get("fill_level")

    if (
        isinstance(fill, bool)
        or not isinstance(fill, (int, float))
        or not 0 <= fill <= 100
    ):
        return jsonify({
            "error": "fill_level must be a number between 0 and 100"
        }), 400

    bins[bin_id]["fill_level"] = float(fill)

    return jsonify({
        "device_id": bin_id,
        "fill_level": float(fill),
        "status": get_bin_status(float(fill)),
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)