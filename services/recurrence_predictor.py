import datetime
from collections import defaultdict

def compute_recurrence_signals(complaints: list) -> list:
    """
    Identifies emerging spatial & departmental outbreak trends using rolling window analysis.
    1. Grid cell: round(lat, 3), round(lng, 3) (~500m resolution)
    2. Groups complaints into Current Week (last 7 days) and Trailing 4 Weeks (days 8 to 35).
    3. Calculates trailing_4_week_avg.
    4. Sets trendFlag = (current_week_count >= 1.5 * trailing_4_week_avg) and (current_week_count >= 3).
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    seven_days_ago = now - datetime.timedelta(days=7)
    thirty_five_days_ago = now - datetime.timedelta(days=35)

    # Group counts by (category, cell_lat, cell_lng)
    current_counts = defaultdict(int)
    trailing_counts = defaultdict(int)
    cell_names = {}

    for c in complaints:
        try:
            lat = float(c.get("latitude") or c.get("lat") or 13.0827)
            lng = float(c.get("longitude") or c.get("lng") or 80.2707)
        except (ValueError, TypeError):
            continue

        cat = c.get("category") or "General"
        location_name = c.get("location") or "Municipal Zone"
        # Round to 3 decimal places (~500 meters grid cell)
        cell_lat = round(lat, 3)
        cell_lng = round(lng, 3)
        key = (cat, cell_lat, cell_lng)

        if key not in cell_names:
            cell_names[key] = location_name

        # Parse date
        dt_val = c.get("createdAt") or c.get("created")
        if isinstance(dt_val, str):
            try:
                # Handle ISO format strings
                if dt_val.endswith("Z"):
                    dt = datetime.datetime.fromisoformat(dt_val[:-1] + "+00:00")
                else:
                    dt = datetime.datetime.fromisoformat(dt_val)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=datetime.timezone.utc)
            except Exception:
                dt = now
        elif isinstance(dt_val, datetime.datetime):
            dt = dt_val if dt_val.tzinfo else dt_val.replace(tzinfo=datetime.timezone.utc)
        else:
            dt = now

        if dt >= seven_days_ago:
            current_counts[key] += 1
        elif dt >= thirty_five_days_ago:
            trailing_counts[key] += 1

    all_keys = set(current_counts.keys()).union(set(trailing_counts.keys()))
    signals = []

    for key in all_keys:
        cat, cell_lat, cell_lng = key
        cur_count = current_counts[key]
        trailing_total = trailing_counts[key]
        trailing_avg = round(trailing_total / 4.0, 2)

        # Spike condition: >= 1.5x of trailing average and floor of >= 3 complaints
        is_trending = (cur_count >= 1.5 * max(trailing_avg, 0.5)) and (cur_count >= 3)

        signals.append({
            "category": cat,
            "geoCellLat": cell_lat,
            "geoCellLng": cell_lng,
            "lat": cell_lat,
            "lng": cell_lng,
            "location": cell_names.get(key, f"Grid ({cell_lat}, {cell_lng})"),
            "count": cur_count,
            "trailingAvg": trailing_avg,
            "trendFlag": bool(is_trending),
            "windowStart": seven_days_ago.isoformat(),
            "windowEnd": now.isoformat(),
            "spikeMultiplier": round(cur_count / max(trailing_avg, 0.5), 1) if is_trending else 1.0
        })

    # Sort so trending signals are first, then highest counts
    signals.sort(key=lambda s: (s["trendFlag"], s["count"]), reverse=True)
    return signals
