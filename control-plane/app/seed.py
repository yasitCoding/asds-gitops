import os
from sqlmodel import SQLModel, create_engine, Session, select
from app.models import PolicyRule

# Read connection string from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Check your .env file.")


engine = create_engine(DATABASE_URL, echo=True)

SEED_POLICIES = [
    {
        "rule_name": "Unit Test Policy",
        "rego_code": """package main

default allow = false

allow {
    input.test_status == "passed"
}""",
        "description": "ผลลัพธ์ Unit Test ต้องเป็น passed",
        "enabled": True
    },
    {
        "rule_name": "CVE Threshold Policy",
        "rego_code": """package main

default allow = false

allow {
    count(deny_cve) == 0
}

deny_cve[cve] {
    some i
    cve := input.scan_results[i]
    cve.severity == "CRITICAL"
}

deny_cve[cve] {
    some i
    cve := input.scan_results[i]
    cve.severity == "HIGH"
}""",
        "description": "ห้ามมีช่องโหว่ระดับ CRITICAL หรือ HIGH จาก Trivy Scan",
        "enabled": True
    },
    {
        "rule_name": "RunAsNonRoot Policy",
        "rego_code": """package main

default allow = false

allow {
    input.manifest.spec.template.spec.securityContext.runAsNonRoot == true
}""",
        "description": "คอนเทนเนอร์ในไฟล์ Manifest ต้องกำหนด runAsNonRoot: true",
        "enabled": True
    },
    {
        "rule_name": "Resource Limits Policy",
        "rego_code": """package main

default allow = false

allow {
    some i
    container := input.manifest.spec.template.spec.containers[i]
    container.resources.limits.cpu
    container.resources.limits.memory
}""",
        "description": "คอนเทนเนอร์ทุกตัวต้องกำหนด resources.limits.cpu และ memory",
        "enabled": True
    },
    {
        "rule_name": "Trusted Registry Policy",
        "rego_code": """package main

default allow = false

allow {
    some i
    container := input.manifest.spec.containers[i]
    startswith(container.image, "docker.io/")
}""",
        "description": "อิมเมจต้องดึงมาจาก Container Registry ที่อนุญาตเท่านั้น",
        "enabled": True
    }
]

def init_db_and_seed():
    print("Creating tables on PostgreSQL (Supabase)...")
    SQLModel.metadata.create_all(engine)

    print("Seeding initial policy_rules...")
    with Session(engine) as session:
        for seed_data in SEED_POLICIES:
            statement = select(PolicyRule).where(PolicyRule.rule_name == seed_data["rule_name"])
            existing_rule = session.exec(statement).first()
            if not existing_rule:
                rule = PolicyRule(**seed_data)
                session.add(rule)
                print(f"  + Added seed policy: {seed_data['rule_name']}")
            else:
                print(f"  - Policy already exists: {seed_data['rule_name']}")
        session.commit()
    print("Database initialization and seeding completed successfully!")

if __name__ == "__main__":
    init_db_and_seed()
