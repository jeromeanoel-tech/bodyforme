#!/usr/bin/env python3
"""
One-time script to create all Wix Bookings services and recurring sessions.
Run: python3 scripts/setup-schedule.py
"""
import json, os, sys, subprocess

API_KEY  = os.environ["WIX_API_KEY"]
SITE_ID  = "79b367e3-1c81-43f9-adc2-397b7e830367"
BASE     = "https://www.wixapis.com"

def req(method, path, body=None):
    cmd = [
        "curl", "-s", "-X", method,
        f"{BASE}{path}",
        "-H", f"Authorization: {API_KEY}",
        "-H", f"wix-site-id: {SITE_ID}",
        "-H", "Content-Type: application/json",
    ]
    if body:
        cmd += ["-d", json.dumps(body)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if not result.stdout.strip():
        print(f"  ERROR empty response for {path}")
        return {}
    try:
        return json.loads(result.stdout)
    except Exception as e:
        print(f"  ERROR parsing response for {path}: {result.stdout[:100]}")
        return {}

# ── Staff resource IDs (from existing staff) ─────────────────────────────────
STAFF = {
    "Suzanne":   "752f790f-e3d1-41d0-b678-b3b7309b696e",
    "Jodie":     "e401a703-4b31-438e-ac7a-d9e095ea07ba",
    "Angie":     "27ca8152-a001-44f2-b64a-2112003a34fc",
    "Gabriel":   "f16aa2c0-e78b-46ea-8c34-602b8cf94725",
    "Mish":      "1dafc140-9e78-44c7-b602-9e932fd038e0",
    "Hiliory":   "8a210c5a-e5ac-4b27-b75e-dc846f87586d",
    "Sam":       "c35ef08e-7226-48c3-8394-d1f003ccfcae",
    "Stephanie": "c124bf69-1a90-4d46-a756-09607d3d9ca2",
}

# ── Existing service schedule IDs ─────────────────────────────────────────────
EXISTING_SCHEDULES = {
    "Arms Abs Ass":   "6566720f-8c2d-481b-be91-4ed9f8d1b70f",
    "Bikram Express": "a20d7652-5c18-4b53-9509-9c6a82150d57",
    "Bikram 90 Min":  "a0b3ed80-8947-40f8-a669-138d6c6b8349",
    "Hot Pilates":    "61f9cfba-2093-46b5-a286-e9895ba43d44",
}

CATEGORY_ID = "7a861e30-6a8a-4ca6-812d-afc19b037c7a"
POLICY_ID   = "7a0fdb27-9c4b-4911-9cbe-9f8cb07694d6"

# ── Services to create if missing ─────────────────────────────────────────────
MISSING_SERVICES = ["Hot HIIT", "Special Forces", "Yin Yoga", "Sculpt Yoga"]

def create_service(name):
    print(f"  Creating service: {name}")
    r = req("POST", "/bookings/v2/services", {
        "service": {
            "name": name,
            "type": "CLASS",
            "defaultCapacity": 25,
            "category": {"id": CATEGORY_ID},
            "bookingPolicy": {"id": POLICY_ID},
            "onlineBooking": {"enabled": True},
            "locations": [{"type": "BUSINESS"}],
            "payment": {
                "rateType": "FIXED",
                "fixed": {"price": {"value": "35", "currency": "AUD"}},
                "options": {"online": True, "pricingPlan": True},
            },
        }
    })
    svc = r.get("service", {})
    sid = svc.get("schedule", {}).get("id")
    print(f"    → scheduleId={sid}")
    return sid

def create_session(schedule_id, title, start, end, day, staff_name, capacity=25):
    resource_id = STAFF.get(staff_name)
    if not resource_id:
        print(f"  SKIP {title} {day} — unknown staff: {staff_name}")
        return
    r = req("POST", "/calendar/v3/events", {
        "event": {
            "scheduleId": schedule_id,
            "title": title,
            "type": "CLASS",
            "start": {"localDate": start},
            "end":   {"localDate": end},
            "capacity": capacity,
            "location": {"type": "BUSINESS"},
            "resources": [{"id": resource_id}],
            "recurrenceRule": {"frequency": "WEEKLY", "days": [day]},
        }
    })
    eid = r.get("event", {}).get("id", "ERROR")
    print(f"  ✓ {title:<20} {day:<10} {start[11:16]}–{end[11:16]}  {staff_name:<10} → {eid[:8] if eid != 'ERROR' else 'ERROR'}")

# ── Step 1: create missing services ──────────────────────────────────────────
print("\n── Creating missing services ───────────────────────────────────")
schedules = dict(EXISTING_SCHEDULES)
for name in MISSING_SERVICES:
    sid = create_service(name)
    if sid:
        schedules[name] = sid

# ── Step 2: create all recurring sessions ─────────────────────────────────────
# Format: (service_name, day, start_datetime, end_datetime, staff, capacity)
SESSIONS = [
    # Monday
    ("Arms Abs Ass",   "MONDAY",    "2026-04-27T06:30:00", "2026-04-27T07:30:00", "Jodie",    16),
    ("Hot Pilates",    "MONDAY",    "2026-04-27T09:30:00", "2026-04-27T10:30:00", "Suzanne",  25),
    ("Hot Pilates",    "MONDAY",    "2026-04-27T17:45:00", "2026-04-27T18:45:00", "Angie",    25),
    ("Bikram Express", "MONDAY",    "2026-04-27T19:00:00", "2026-04-27T20:00:00", "Angie",    25),
    # Tuesday
    ("Bikram Express", "TUESDAY",   "2026-04-28T06:30:00", "2026-04-28T07:30:00", "Gabriel",  25),
    ("Arms Abs Ass",   "TUESDAY",   "2026-04-28T09:30:00", "2026-04-28T10:30:00", "Suzanne",  25),
    ("Arms Abs Ass",   "TUESDAY",   "2026-04-28T17:30:00", "2026-04-28T18:30:00", "Suzanne",  25),
    ("Hot Pilates",    "TUESDAY",   "2026-04-28T18:45:00", "2026-04-28T19:30:00", "Suzanne",  25),
    # Wednesday
    ("Arms Abs Ass",   "WEDNESDAY", "2026-04-29T06:30:00", "2026-04-29T07:30:00", "Mish",     25),
    ("Hot Pilates",    "WEDNESDAY", "2026-04-29T09:30:00", "2026-04-29T10:30:00", "Suzanne",  25),
    ("Hot Pilates",    "WEDNESDAY", "2026-04-29T17:30:00", "2026-04-29T18:15:00", "Hiliory",  25),
    ("Hot HIIT",       "WEDNESDAY", "2026-04-29T18:30:00", "2026-04-29T19:15:00", "Hiliory",  25),
    # Thursday
    ("Special Forces", "THURSDAY",  "2026-04-30T09:30:00", "2026-04-30T10:30:00", "Suzanne",  25),
    ("Arms Abs Ass",   "THURSDAY",  "2026-04-30T17:30:00", "2026-04-30T18:15:00", "Mish",     25),
    ("Yin Yoga",       "THURSDAY",  "2026-04-30T18:30:00", "2026-04-30T19:30:00", "Angie",    25),
    # Friday
    ("Hot Pilates",    "FRIDAY",    "2026-05-01T09:30:00", "2026-05-01T10:30:00", "Suzanne",  25),
    ("Hot Pilates",    "FRIDAY",    "2026-05-01T17:00:00", "2026-05-01T18:00:00", "Sam",      25),
    ("Bikram Express", "FRIDAY",    "2026-05-01T18:15:00", "2026-05-01T19:15:00", "Gabriel",  25),
    # Saturday
    ("Special Forces", "SATURDAY",  "2026-05-02T07:00:00", "2026-05-02T08:00:00", "Jodie",    16),
    ("Sculpt Yoga",    "SATURDAY",  "2026-05-02T08:00:00", "2026-05-02T09:00:00", "Stephanie",25),
    # Sunday
    ("Hot Pilates",    "SUNDAY",    "2026-05-03T08:00:00", "2026-05-03T09:00:00", "Suzanne",  25),
    ("Bikram 90 Min",  "SUNDAY",    "2026-05-03T09:15:00", "2026-05-03T10:45:00", "Mish",     25),
    ("Yin Yoga",       "SUNDAY",    "2026-05-03T17:00:00", "2026-05-03T18:00:00", "Sam",      25),
]

print("\n── Creating recurring sessions ─────────────────────────────────")
for (svc, day, start, end, staff, cap) in SESSIONS:
    schedule_id = schedules.get(svc)
    if not schedule_id:
        print(f"  SKIP {svc} — no schedule ID (service not found)")
        continue
    create_session(schedule_id, svc, start, end, day, staff, cap)

print("\n✓ Done. Check manage.wix.com → Bookings → Calendar to verify.")
