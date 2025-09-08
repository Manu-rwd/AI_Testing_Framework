import sys
import os
from pathlib import Path
import importlib


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
        # 3) GITHUB_WORKSPACE hint (CI)
        ws = os.environ.get("GITHUB_WORKSPACE", "")
        if ws:
            candidate = (Path(ws) / "ADEF" / "framework").resolve()
            if (candidate / "src").exists():
                framework_root = candidate
    if framework_root is None:
        return
    src_path = framework_root / "src"
    # Prepend to sys.path and also export PYTHONPATH for any subprocess usage
    # Ensure 'src' is first so 'from src.*' works on CI
    sys.path.insert(0, str(src_path))
    sys.path.insert(0, str(framework_root))
    prev = os.environ.get("PYTHONPATH", "")
    os.environ["PYTHONPATH"] = os.pathsep.join([str(src_path), str(framework_root), prev]) if prev else os.pathsep.join([str(src_path), str(framework_root)])
    # Provide a lightweight namespace package shim for 'src' if missing
    if "src" not in sys.modules:
        import types
        ns = types.ModuleType("src")
        ns.__path__ = [str(src_path)]  # type: ignore[attr-defined]
        sys.modules["src"] = ns


def main() -> int:
    add_framework_to_sys_path()

    # Prevent auto file logging to project root by disabling auto-setup
    os.environ["TESTING"] = "true"

    # Resolve imports robustly across environments (with or without 'src.' prefix)
    try:
        logger_mod = importlib.import_module("src.infrastructure.monitoring.logger")
    except ModuleNotFoundError:
        logger_mod = importlib.import_module("infrastructure.monitoring.logger")
    try:
        env_mod = importlib.import_module("src.shared.config.environment")
    except ModuleNotFoundError:
        env_mod = importlib.import_module("shared.config.environment")

    get_logger = getattr(logger_mod, "get_logger")
    setup_logging = getattr(logger_mod, "setup_logging")
    load_config = getattr(env_mod, "load_config")

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
 

