"""End-to-end tests for Divr marketing API.

Covers:
- Health check
- Waitlist (divers) POST + admin GET
- Operators POST + admin GET
- Guides POST + admin GET
- Validation failures (422)
"""
import time
import requests
import pytest


# ---------- health ----------
class TestHealth:
    def test_root_health(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        assert body.get("service") == "divr-marketing"


# ---------- waitlist ----------
class TestWaitlist:
    def test_create_and_list_waitlist(self, api_client, base_url):
        marker = f"TEST_wl_{int(time.time()*1000)}@example.com"
        payload = {
            "first_name": "TEST_Ada",
            "email": marker,
            "country": "Egypt",
            "dive_region": "Red Sea",
        }
        r = api_client.post(f"{base_url}/api/waitlist", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["email"] == marker
        assert data["source"] == "waitlist"
        assert data["dive_region"] == "Red Sea"
        assert isinstance(data["id"], str) and len(data["id"]) > 0
        assert "created_at" in data and "T" in data["created_at"]

        lst = api_client.get(f"{base_url}/api/admin/waitlist?limit=50")
        assert lst.status_code == 200
        items = lst.json()
        assert isinstance(items, list)
        emails = [i["email"] for i in items]
        assert marker in emails
        match = next(i for i in items if i["email"] == marker)
        assert match["source"] == "waitlist"
        assert "_id" not in match

    def test_waitlist_validation_bad_region(self, api_client, base_url):
        bad = {
            "first_name": "X",
            "email": "x@example.com",
            "country": "Egypt",
            "dive_region": "Atlantis",
        }
        r = api_client.post(f"{base_url}/api/waitlist", json=bad)
        assert r.status_code == 422

    def test_waitlist_validation_bad_email(self, api_client, base_url):
        bad = {
            "first_name": "X",
            "email": "not-an-email",
            "country": "Egypt",
            "dive_region": "Red Sea",
        }
        r = api_client.post(f"{base_url}/api/waitlist", json=bad)
        assert r.status_code == 422


# ---------- operators ----------
class TestOperators:
    def test_create_and_list_operator(self, api_client, base_url):
        marker = f"TEST_op_{int(time.time()*1000)}@example.com"
        payload = {
            "full_name": "TEST_Sara",
            "dive_center_name": "Blue Coral",
            "country_destination": "Egypt — Sharm El Sheikh",
            "email": marker,
            "whatsapp": "+20 100 123 4567",
            "monthly_bookings": "30 to 100",
        }
        r = api_client.post(f"{base_url}/api/operators", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["source"] == "for-operators"
        assert data["dive_center_name"] == "Blue Coral"
        assert data["monthly_bookings"] == "30 to 100"
        assert "id" in data and "created_at" in data

        lst = api_client.get(f"{base_url}/api/admin/operators?limit=50")
        assert lst.status_code == 200
        items = lst.json()
        match = next((i for i in items if i["email"] == marker), None)
        assert match is not None
        assert match["source"] == "for-operators"
        assert "_id" not in match

    def test_operator_validation_bad_volume(self, api_client, base_url):
        bad = {
            "full_name": "X",
            "dive_center_name": "Y",
            "country_destination": "Z",
            "email": "x@example.com",
            "whatsapp": "+1 555 0100",
            "monthly_bookings": "lots",
        }
        r = api_client.post(f"{base_url}/api/operators", json=bad)
        assert r.status_code == 422


# ---------- guides ----------
class TestGuides:
    def test_create_and_list_guide(self, api_client, base_url):
        marker = f"TEST_g_{int(time.time()*1000)}@example.com"
        payload = {
            "full_name": "TEST_Ben",
            "specialty": "Underwater Photography",
            "country_base": "Indonesia — Bali",
            "certifications": "PADI Divemaster, Nitrox",
            "email": marker,
            "whatsapp": "+62 812 345 6789",
        }
        r = api_client.post(f"{base_url}/api/guides", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["source"] == "for-guides"
        assert data["specialty"] == "Underwater Photography"
        assert "id" in data and "created_at" in data

        lst = api_client.get(f"{base_url}/api/admin/guides?limit=50")
        assert lst.status_code == 200
        items = lst.json()
        match = next((i for i in items if i["email"] == marker), None)
        assert match is not None
        assert match["source"] == "for-guides"
        assert "_id" not in match

    def test_guide_validation_bad_specialty(self, api_client, base_url):
        bad = {
            "full_name": "X",
            "specialty": "Spearfishing",
            "country_base": "Z",
            "certifications": "C",
            "email": "x@example.com",
            "whatsapp": "+1 555 0100",
        }
        r = api_client.post(f"{base_url}/api/guides", json=bad)
        assert r.status_code == 422
