import requests
from app.config.env import get_settings
settings = get_settings()

class PockityClient:
	def __init__(self):
		self.base_url = settings.POCKITY_API_URL
		self.session = requests.Session()
		self.session.headers.update({
			"x-access-key-id": settings.POCKITY_ACCESS_KEY_ID,
			"x-secret-key": settings.POCKITY_SECRET_KEY,
			"Accept": "application/json, multipart/form-data",
		})

	def request(self, method, endpoint, **kwargs):
		url = f"{self.base_url}{endpoint}"
		response = self.session.request(method, url, **kwargs)
		response.raise_for_status()
		return response.json()

pockityClient = PockityClient()