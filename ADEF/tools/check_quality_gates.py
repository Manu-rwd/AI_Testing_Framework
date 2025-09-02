import sys
import json
from pathlib import Path

import yaml


def fail(message: str) -> None:
    print(json.dumps({"status": "fail", "message": message}))
    sys.exit(1)


def ok(message: str) -> None:
    print(json.dumps({"status": "ok", "message": message}))
    sys.exit(0)


def main() -> None:
    # Minimal gate: ensure the quality_gates file exists and is parseable
    gates_path = Path("ADEF/framework/config/quality_gates.yml")
    if not gates_path.exists():
        fail("Missing ADEF/framework/config/quality_gates.yml")

    try:
        with gates_path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    except Exception as e:
        fail(f"Invalid YAML in quality_gates.yml: {e}")

    # Basic sanity checks
    required_top = [
        "code_quality",
        "data_quality",
        "performance",
        "security",
        "operational",
        "features",
        "business",
        "process",
        "illumination_compliance",
        "enforcement",
        "validation_schedule",
        "reporting",
    ]
    missing = [k for k in required_top if k not in data]
    if missing:
        fail(f"quality_gates.yml missing sections: {missing}")

    ok("Quality gates file present and valid.")


if __name__ == "__main__":
    main()


