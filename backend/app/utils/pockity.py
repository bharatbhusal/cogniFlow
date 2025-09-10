from app.config.pockity import PockityClient
from typing import Dict, Any
import time

def upload_file_to_pockity(file, filename=None) -> Dict[str, Any]:
    """
    Upload a file to Pockity storage (sync version).
    Args:
        file: file-like object (e.g., from open() or FastAPI UploadFile.file)
        filename: Optional name for the uploaded file
    Returns:
        Uploaded file metadata (dict) or error response
    """
    try:
        client = PockityClient()
        default_filename = str(int(time.time()))
        files = {
            "file": (
                filename or getattr(file, "filename", default_filename),
                file if hasattr(file, "read") else file,
                getattr(file, "content_type", "application/pdf")
            )
        }
        data = {
            "fileName": filename or getattr(file, "filename", default_filename)
        }
        response_json = client.request(
            method="POST",
            endpoint="/upload",
            files=files,
            data=data,
            timeout=30,
        )

        return response_json
    except Exception as error:
        raise error