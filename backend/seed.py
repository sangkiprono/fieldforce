import requests

BASE = "http://127.0.0.1:8000"

def login(email, password):
    res = requests.post(f"{BASE}/auth/login", data={"username": email, "password": password})
    res.raise_for_status()
    return res.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

manager_token = login("manager@fieldforce.com", "test1234")
mh = auth_headers(manager_token)

technicians = [
    {"name": "Peter Mwangi", "email": "tech1@fieldforce.com", "phone": "0711223344", "password": "test1234", "role": "technician"},
    {"name": "Grace Achieng", "email": "tech2@fieldforce.com", "phone": "0722998877", "password": "test1234", "role": "technician"},
    {"name": "Samuel Kiptoo", "email": "tech3@fieldforce.com", "phone": "0733445566", "password": "test1234", "role": "technician"},
]

tech_ids = []
for t in technicians:
    res = requests.post(f"{BASE}/auth/register", json=t, headers=mh)
    if res.status_code == 200:
        tech_ids.append(res.json()["id"])
        print(f"Created technician: {t['name']}")
    elif res.status_code == 400:
        print(f"Technician {t['name']} already exists, fetching login to get id")
        tok = login(t["email"], t["password"])
        me = requests.get(f"{BASE}/auth/me", headers=auth_headers(tok)).json()
        tech_ids.append(me["id"])

customers = [
    {"name": "Jane Wanjiru", "phone": "0722334455", "address": "Kilimani, Nairobi"},
    {"name": "David Otieno", "phone": "0700112233", "address": "South B, Nairobi"},
    {"name": "Mercy Njoki", "phone": "0711998877", "address": "Kasarani, Nairobi"},
    {"name": "Ibrahim Hassan", "phone": "0733112244", "address": "Eastleigh, Nairobi"},
    {"name": "Faith Chebet", "phone": "0788556677", "address": "Ruaka, Kiambu"},
    {"name": "John Mutua", "phone": "0799887766", "address": "Rongai, Kajiado"},
]

customer_ids = []
for c in customers:
    res = requests.post(f"{BASE}/customers", json=c, headers=mh)
    if res.status_code == 200:
        customer_ids.append(res.json()["id"])
        print(f"Created customer: {c['name']}")

jobs = [
    {"customer_id": customer_ids[0], "issue_type": "no_connectivity", "priority": "high", "description": "Total loss of internet since 6am. Router lights are off."},
    {"customer_id": customer_ids[1], "issue_type": "slow_speed", "priority": "medium", "description": "Speeds dropped to under 2mbps over the past week."},
    {"customer_id": customer_ids[2], "issue_type": "new_installation", "priority": "medium", "description": "New customer, needs fresh line and router setup."},
    {"customer_id": customer_ids[3], "issue_type": "router_swap", "priority": "low", "description": "Old router overheating, needs replacement unit."},
    {"customer_id": customer_ids[4], "issue_type": "no_connectivity", "priority": "high", "description": "Fibre cable appears cut near the compound gate."},
    {"customer_id": customer_ids[5], "issue_type": "other", "priority": "low", "description": "Customer requesting static IP configuration."},
    {"customer_id": customer_ids[0], "issue_type": "slow_speed", "priority": "medium", "description": "Intermittent drops during evening peak hours."},
]

job_ids = []
for j in jobs:
    res = requests.post(f"{BASE}/jobs", json=j, headers=mh)
    if res.status_code == 200:
        job_ids.append(res.json()["id"])
        print(f"Created job: {res.json()['job_number']}")

assignments = [
    (job_ids[0], tech_ids[0]),
    (job_ids[1], tech_ids[1]),
    (job_ids[2], tech_ids[2]),
    (job_ids[3], tech_ids[0]),
    (job_ids[4], tech_ids[1]),
]

for job_id, tech_id in assignments:
    requests.patch(f"{BASE}/jobs/{job_id}/assign", json={"technician_id": tech_id}, headers=mh)
    print(f"Assigned job {job_id} to technician {tech_id}")

status_updates = [
    (job_ids[0], tech_ids[0], ["en_route", "on_site", "in_progress", "completed"]),
    (job_ids[1], tech_ids[1], ["en_route"]),
    (job_ids[4], tech_ids[1], ["en_route", "on_site"]),
]

for job_id, tech_id, statuses in status_updates:
    matching_tech = None
    for t, tid in zip(technicians, tech_ids):
        if tid == tech_id:
            matching_tech = t
            break
    tech_token = login(matching_tech["email"], matching_tech["password"])
    th = auth_headers(tech_token)
    for s in statuses:
        requests.patch(f"{BASE}/jobs/{job_id}/status", json={"status": s}, headers=th)
    print(f"Updated job {job_id} through statuses: {statuses}")

print("\nSeed complete.")
