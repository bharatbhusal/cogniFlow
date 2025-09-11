import requests
from typing import List, Optional, Dict, Any

class WebSearchService:
    def __init__(self, serpapi_api_key: str):
        self.serpapi_api_key = serpapi_api_key
        self.base_url = "https://serpapi.com/search"

    def search(self, query: str, engine: str = "google", **kwargs) -> List[Dict[str, Any]]:
        params = {
            "q": query,
            "api_key": self.serpapi_api_key,
            "engine": engine,
            **kwargs
        }
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        data = response.json()
        # Extract relevant results (e.g., organic results)
        return data.get("organic_results", [])
