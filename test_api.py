#!/usr/bin/env python3
"""
Test script for the HallNav API
"""
import requests
from PIL import Image
import io

def test_api():
    # Create a test image
    test_image = Image.new('RGB', (224, 224), color='red')
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    
    # Test the API
    try:
        response = requests.post(
            "http://localhost:8000/api/recognize_hall/",
            files={"file": ("test.jpg", img_buffer, "image/jpeg")},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Hall ID: {data.get('hall_id')}")
            print(f"Confidence: {data.get('confidence')}")
            print(f"Schedule: {data.get('schedule')}")
        else:
            print("API Error:", response.text)
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to Django server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_api()
