import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import json
from app import app

def run_tests():
    print("\n" + "="*60)
    print(" TESTING CITIZEN CALL INTELLIGENCE LOCAL MICROSERVICE")
    print("="*60)

    # Use Flask test client
    with app.test_client() as client:
        # Test 1: Health Check
        res = client.get("/health")
        print(f"\n[Test 1] GET /health -> Status: {res.status_code}")
        print(json.dumps(res.get_json(), indent=2))
        assert res.status_code == 200, "Health check failed!"

        # Test 2: Metrics
        res = client.get("/metrics")
        print(f"\n[Test 2] GET /metrics -> Status: {res.status_code}")
        print(json.dumps(res.get_json(), indent=2))
        assert res.status_code == 200, "Metrics endpoint failed!"

        # Test 3: Predict Endpoint
        sample_transcript = "Main water supply pipeline burst near Green Park metro station. Water is overflowing into residential houses!"
        res = client.post("/predict", json={"transcript": sample_transcript})
        print(f"\n[Test 3] POST /predict -> Status: {res.status_code}")
        predict_data = res.get_json()
        print(json.dumps(predict_data, indent=2))
        assert res.status_code == 200, "Predict endpoint failed!"

        # Test 4: Summarize Endpoint
        res = client.post("/summarize", json={
            "transcript": sample_transcript,
            "category": predict_data["category"],
            "urgency": predict_data["urgency"]
        })
        print(f"\n[Test 4] POST /summarize -> Status: {res.status_code}")
        summary_data = res.get_json()
        print(json.dumps(summary_data, indent=2))
        assert res.status_code == 200, "Summarize endpoint failed!"

        # Test 5: Check Duplicate Endpoint
        res1 = client.post("/check-duplicate", json={
            "transcript": sample_transcript,
            "category": predict_data["category"],
            "urgency": predict_data["urgency"]
        })
        print(f"\n[Test 5] POST /check-duplicate -> Status: {res1.status_code}")
        dup_data = res1.get_json()
        print(json.dumps(dup_data, indent=2))
        assert res1.status_code == 200, "Check duplicate failed!"

        # Test 6: Geo-Cluster Endpoint (Complaint 1 in Sector 4)
        res_geo1 = client.post("/geo-cluster", json={
            "lat": 28.6139,
            "lng": 77.2090,
            "category": "Water",
            "complaintId": "CMP-1001"
        })
        print(f"\n[Test 6a] POST /geo-cluster (First Water complaint in Sector 4) -> Status: {res_geo1.status_code}")
        geo_data1 = res_geo1.get_json()
        print(json.dumps(geo_data1, indent=2))
        assert res_geo1.status_code == 200, "Geo-cluster call 1 failed!"

        # Test 6b: Geo-Cluster Endpoint (Complaint 2 within 200m in Sector 4)
        res_geo2 = client.post("/geo-cluster", json={
            "lat": 28.6142,  # ~150 meters away
            "lng": 77.2095,
            "category": "Water",
            "complaintId": "CMP-1002"
        })
        print(f"\n[Test 6b] POST /geo-cluster (Second Water complaint within 150m) -> Status: {res_geo2.status_code}")
        geo_data2 = res_geo2.get_json()
        print(json.dumps(geo_data2, indent=2))
        assert res_geo2.status_code == 200, "Geo-cluster call 2 failed!"
        assert geo_data2["isClustered"] is True, "Second complaint should be geo-clustered!"
        assert geo_data2["totalReports"] >= 2, "Incident group should have >= 2 reports!"

        # Test 7: Pipeline Endpoint
        res_pipe = client.post("/pipeline", json={
            "transcript": "Frequent voltage fluctuations damaging home electronics and refrigerator in Ward 9.",
            "language": "en",
            "lat": 28.5355,
            "lng": 77.3910
        })
        print(f"\n[Test 7] POST /pipeline -> Status: {res_pipe.status_code}")
        pipe_data = res_pipe.get_json()
        print(json.dumps(pipe_data, indent=2))
        assert res_pipe.status_code == 200, "Pipeline endpoint failed!"

    print("\n" + "="*60)
    print(" ALL 7 LOCAL MICROSERVICE TESTS PASSED SUCCESSFULLY! ")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_tests()
