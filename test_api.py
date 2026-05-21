import requests
import io

url = "http://localhost:8000/api/resume/analyze"
files = {'file': ('test.pdf', io.BytesIO(b"%PDF-1.4\n%EOF\n"), 'application/pdf')}
data = {'target_role': 'Frontend Developer'}

try:
    response = requests.post(url, files=files, data=data)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
