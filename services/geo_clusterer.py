import math
import uuid
import datetime

def haversine_distance_meters(lat1, lng1, lat2, lng2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in meters.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

class GeoClusterer:
    RADIUS_THRESHOLD_METERS = 6000.0  # 6.0 km radius threshold around reported location

    def __init__(self):
        # In-memory incident group cache for Python microservice
        self.incident_groups = []
        print(f"[GeoClusterer] Initialized with {self.RADIUS_THRESHOLD_METERS}m Haversine radius threshold.")

    def process_complaint_location(self, lat: float, lng: float, category: str, complaint_id: str = None):
        if complaint_id is None:
            complaint_id = str(uuid.uuid4())

        matching_group = None
        min_distance = float('inf')

        # Check against active incident groups in the same category
        for group in self.incident_groups:
            if group["status"] == "Active" and group["category"].lower() == category.lower():
                c_lat = group["centerLocation"]["lat"]
                c_lng = group["centerLocation"]["lng"]
                dist = haversine_distance_meters(lat, lng, c_lat, c_lng)
                if dist <= self.RADIUS_THRESHOLD_METERS and dist < min_distance:
                    min_distance = dist
                    matching_group = group

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if matching_group:
            # Add to existing incident group
            matching_group["complaintIds"].append(complaint_id)
            matching_group["totalReports"] = len(matching_group["complaintIds"])
            
            # Recalculate average center location
            all_lats = matching_group.get("lats", [matching_group["centerLocation"]["lat"]]) + [lat]
            all_lngs = matching_group.get("lngs", [matching_group["centerLocation"]["lng"]]) + [lng]
            matching_group["lats"] = all_lats
            matching_group["lngs"] = all_lngs
            matching_group["centerLocation"] = {
                "lat": round(sum(all_lats) / len(all_lats), 6),
                "lng": round(sum(all_lngs) / len(all_lngs), 6)
            }
            matching_group["updatedAt"] = now_iso

            return {
                "isClustered": True,
                "incidentGroupId": matching_group["id"],
                "totalReports": matching_group["totalReports"],
                "centerLocation": matching_group["centerLocation"],
                "distanceMeters": round(min_distance, 1),
                "message": f"Clustered into active incident group {matching_group['id']} ({matching_group['totalReports']} reports nearby)."
            }
        else:
            # Create new incident group
            group_id = f"INC-{str(uuid.uuid4())[:8].upper()}"
            new_group = {
                "id": group_id,
                "category": category,
                "centerLocation": {"lat": round(lat, 6), "lng": round(lng, 6)},
                "lats": [lat],
                "lngs": [lng],
                "complaintIds": [complaint_id],
                "totalReports": 1,
                "status": "Active",
                "createdAt": now_iso,
                "updatedAt": now_iso
            }
            self.incident_groups.append(new_group)
            return {
                "isClustered": False,
                "incidentGroupId": group_id,
                "totalReports": 1,
                "centerLocation": new_group["centerLocation"],
                "distanceMeters": 0.0,
                "message": f"Created new area incident group {group_id}."
            }

    def get_all_groups(self):
        return self.incident_groups

# Global singleton instance helper
_clusterer_instance = None

def get_geo_clusterer():
    global _clusterer_instance
    if _clusterer_instance is None:
        _clusterer_instance = GeoClusterer()
    return _clusterer_instance
