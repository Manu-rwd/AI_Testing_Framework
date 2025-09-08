import sys
import os
from pathlib import Path


def add_framework_to_sys_path() -> None:
    """Add ADEF/framework and its 'src' to sys.path (and PYTHONPATH) robustly.

    Priority order:
    1) Direct path relative to this file: ADEF/framework/src
    2) Search upwards for .../ADEF/framework/src
    """
    here = Path(__file__).resolve()
    # 1) Direct relative probe from ADEF/scripts -> ADEF/framework/src
    direct_src = (here.parents[1] / "framework" / "src").resolve()
    framework_root: Path | None = None
    if direct_src.exists():
        framework_root = direct_src.parent
    else:
        # 2) Fallback search upwards
        for base in [here.parent, *here.parents][:6]:
            candidate = (base / "ADEF" / "framework" / "src").resolve()
            if candidate.exists():
                framework_root = candidate.parent
                break
    if framework_root is None:
        return
    src_path = framework_root / "src"
    # Prepend to sys.path and also export PYTHONPATH for any subprocess usage
    sys.path.insert(0, str(framework_root))
    sys.path.insert(0, str(src_path))
    os.environ["PYTHONPATH"] = os.pathsep.join(
        [str(src_path), str(framework_root), os.environ.get("PYTHONPATH", "")]
    )


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
 

