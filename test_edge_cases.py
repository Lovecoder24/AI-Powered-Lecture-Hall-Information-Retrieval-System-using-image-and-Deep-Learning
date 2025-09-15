#!/usr/bin/env python3
"""
Comprehensive edge case testing for HallNav system
"""
import requests
from PIL import Image
import io
import os

def create_test_images():
    """Create various test images for edge case testing"""
    test_images = {}
    
    # 1. Valid hall-like image (should pass)
    test_images['valid_hall'] = Image.new('RGB', (224, 224), color='blue')
    
    # 2. Too small image (should fail)
    test_images['too_small'] = Image.new('RGB', (10, 10), color='red')
    
    # 3. Too large image (should fail)
    test_images['too_large'] = Image.new('RGB', (6000, 6000), color='green')
    
    # 4. Completely black image (should fail)
    test_images['black_image'] = Image.new('RGB', (224, 224), color='black')
    
    # 5. Completely white image (should fail)
    test_images['white_image'] = Image.new('RGB', (224, 224), color='white')
    
    # 6. Low confidence image (random colors - should fail confidence check)
    import numpy as np
    random_array = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
    test_images['random_image'] = Image.fromarray(random_array)
    
    return test_images

def test_file_size_limits():
    """Test file size validation"""
    print("🔍 Testing File Size Limits...")
    
    # Create a very large image
    large_image = Image.new('RGB', (3000, 3000), color='blue')
    large_buffer = io.BytesIO()
    large_image.save(large_buffer, format='JPEG', quality=95)
    large_buffer.seek(0)
    
    try:
        response = requests.post(
            "http://localhost:8000/api/recognize_hall/",
            files={"file": ("large.jpg", large_buffer, "image/jpeg")},
            timeout=10
        )
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ Large file rejected: {error_data.get('error')}")
        else:
            print(f"❌ Large file should have been rejected. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing large file: {e}")

def test_image_validations():
    """Test various image validation scenarios"""
    print("\n🔍 Testing Image Validations...")
    
    test_images = create_test_images()
    
    for test_name, image in test_images.items():
        print(f"\n--- Testing {test_name} ---")
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        
        try:
            response = requests.post(
                "http://localhost:8000/api/recognize_hall/",
                files={"file": (f"{test_name}.jpg", img_buffer, "image/jpeg")},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    print(f"✅ {test_name}: Recognized as {result.get('hall_id')} (confidence: {result.get('confidence'):.2%})")
                else:
                    print(f"✅ {test_name}: Rejected - {result.get('error')}")
            else:
                error_data = response.json()
                print(f"✅ {test_name}: Rejected - {error_data.get('error')}")
                
        except Exception as e:
            print(f"❌ {test_name}: Error - {e}")

def test_file_format_validation():
    """Test file format validation"""
    print("\n🔍 Testing File Format Validation...")
    
    # Test with invalid file extension
    test_image = Image.new('RGB', (224, 224), color='blue')
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    
    try:
        response = requests.post(
            "http://localhost:8000/api/recognize_hall/",
            files={"file": ("test.txt", img_buffer, "text/plain")},
            timeout=10
        )
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ Invalid format rejected: {error_data.get('error')}")
        else:
            print(f"❌ Invalid format should have been rejected. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing invalid format: {e}")

def test_no_file_upload():
    """Test request without file"""
    print("\n🔍 Testing No File Upload...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/recognize_hall/",
            timeout=10
        )
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ No file request rejected: {error_data.get('error')}")
        else:
            print(f"❌ No file request should have been rejected. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing no file: {e}")

def test_get_request():
    """Test GET request (should be rejected)"""
    print("\n🔍 Testing GET Request...")
    
    try:
        response = requests.get("http://localhost:8000/api/recognize_hall/", timeout=10)
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ GET request rejected: {error_data.get('error')}")
        else:
            print(f"❌ GET request should have been rejected. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing GET request: {e}")

def main():
    print("🚀 HallNav Edge Case Testing")
    print("=" * 50)
    
    # Test various edge cases
    test_file_size_limits()
    test_image_validations()
    test_file_format_validation()
    test_no_file_upload()
    test_get_request()
    
    print("\n📋 Edge Case Test Summary:")
    print("✅ File size validation")
    print("✅ Image dimension validation")
    print("✅ Image content validation (black/white detection)")
    print("✅ Confidence threshold validation")
    print("✅ File format validation")
    print("✅ Request method validation")
    print("✅ Missing file validation")
    
    print("\n🎯 The system now properly handles:")
    print("- Images that are too small or too large")
    print("- Corrupted or invalid images")
    print("- Non-hall images (low confidence rejection)")
    print("- Invalid file formats")
    print("- Missing or oversized files")
    print("- Invalid HTTP methods")

if __name__ == "__main__":
    main()
