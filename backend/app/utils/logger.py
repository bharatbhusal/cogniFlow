import logging
from env_manager import EnvironmentManager

def logger():
    log = EnvironmentManager.get("LOG")
    if str(log).lower() == "true":
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            force=True
        )