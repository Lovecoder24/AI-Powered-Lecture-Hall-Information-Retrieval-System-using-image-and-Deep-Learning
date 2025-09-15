# api.py (Django view)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import numpy as np
from PIL import Image
import io

# Mock TFLite inference (replace with real model in production)
def mock_tflite_inference(image_array):
    # Simulate recognition
    return "LT1", "9:00-10:00 CSC 510, 10:00-11:00 CSC 508"

@csrf_exempt
def recognize_hall(request):
    if request.method == "POST" and request.FILES.get("file"):
        image_file = request.FILES["file"]
        image = Image.open(image_file)
        image = image.resize((224, 224))
        image_array = np.array(image)
        hall_id, schedule = mock_tflite_inference(image_array)
        return JsonResponse({"hall_id": hall_id, "schedule": schedule})
    return JsonResponse({"error": "Invalid request"}, status=400)