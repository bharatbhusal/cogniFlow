from typing import List, Dict, Any
import serpapi

class WebSearchService:
    def __init__(self, serpapi_api_key: str):
        self.serpapi_api_key = serpapi_api_key
        self.engine = "google"  # Default search engine
        self.client = serpapi.Client(api_key=serpapi_api_key)

    def search(self, query: str) -> List[Dict[str, Any]]:
        search = self.client.search({
            "q": query,
            "engine": self.engine,
        })
        return search["organic_results"]
