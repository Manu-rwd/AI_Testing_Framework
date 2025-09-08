import sys
import os
from pathlib import Path


def add_framework_to_sys_path() -> None:
    """Add ADEF/framework and its 'src' to sys.path reliably on CI and locally.

    We search upwards from this file for a directory that contains
    ADEF/framework/src to avoid assumptions about the working tree layout on CI.
    """
    start = Path(__file__).resolve()
    candidates = [start.parent, *start.parents]
    framework_root: Path | None = None
    for base in candidates[:6]:  # search up to repo root
        probe = base / ".." / "framework" if base.name == "ADEF" else base / "ADEF" / "framework"
        probe = probe.resolve()
        if (probe / "src").exists():
            framework_root = probe
            break
    if framework_root is None:
        # Fallback to two-levels-up heuristic
        project_root = Path(__file__).resolve().parents[2]
        probe = (project_root / "ADEF" / "framework").resolve()
        if (probe / "src").exists():
            framework_root = probe
    if framework_root is None:
        return
    sys.path.insert(0, str(framework_root))
    sys.path.insert(0, str(framework_root / "src"))


def main() -> int:
    add_framework_to_sys_path()

    # Prevent auto file logging to project root by disabling auto-setup
    os.environ["TESTING"] = "true"

    from src.infrastructure.monitoring.logger import get_logger, setup_logging
    from src.shared.config.environment import load_config

    # Setup root logging and also explicitly setup the environment module logger
    setup_logging(level="INFO", console_output=True, file_output=False)
    env_logger = get_logger("src.shared.config.environment")
    env_logger.setup(level="INFO", console_output=True, file_output=False)
    logger = get_logger(__name__)

    logger.info("Starting ADEF integration verification", operation="verify_integration")

    # Config now lives under ADEF/config/environments/development.yml
    project_root = Path(__file__).resolve().parents[2]
    config_path = project_root / "ADEF" / "config" / "environments" / "development.yml"
    result = load_config(env_override="development", config_file=str(config_path))
    if result.is_err():
        err = result.unwrap_err()
        # Avoid passing the exception object to exc_info due to logging API expectations
        logger.error(
            "Configuration load failed",
            operation="verify_integration",
            error_type=type(err).__name__,
            error_message=str(err),
        )
        print("FAILED:", err)
        return 1

    config = result.unwrap()
    logger.info(
        "Configuration loaded",
        operation="verify_integration",
        environment=config.environment.value,
        version=config.version,
    )

    # Emit a timed operation to verify the logger timer context
    with logger.timer("verify_integration_sample"):
        _ = sum(range(100_000))

    print("OK - ADEF integration works.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
 

