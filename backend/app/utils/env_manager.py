import logging
import sys
import os
from dotenv import load_dotenv

class EnvironmentManager:
    REQUIRED_VARS = [
        "LOG",
    ]

    @staticmethod
    def load_and_validate():
        try:
            if load_dotenv():
                logging.info("Environment variables loaded successfully")
            else:
                logging.warning("No .env file found or loaded.")

            missing_vars = [var for var in EnvironmentManager.REQUIRED_VARS if not os.getenv(var)]
            if missing_vars:
                raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

        except Exception as e:
            logging.error(f"Environment load/validation failed: {e}")
            sys.exit(1)

    @staticmethod
    def get(var_name: str) -> str:
        value = os.getenv(var_name)
        if not value:
            logging.warning(f"Requested env var '{var_name}' is not set.")
        return value