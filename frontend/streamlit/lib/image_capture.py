import numpy as np
from PIL import Image


def process_uploaded_image(uploaded_file):
    """
    Accepts an uploaded image file, resizes to 224x224, normalizes pixel values,
    and returns a numpy array suitable for ML recognition.
    Args:
        uploaded_file: A file-like object (e.g., from Streamlit uploader or Django request.FILES)
    Returns:
        np.ndarray: Preprocessed image array (shape: 224x224x3, dtype: float32)
    Raises:
        ValueError: If the file is not a valid image.
    """
    try:
        image = Image.open(uploaded_file).convert('RGB')
        image = image.resize((224, 224))
        image_array = np.array(image).astype(np.float32) / 255.0  # Normalize to [0, 1]
        return image_array
    except Exception as e:
        raise ValueError(f"Invalid image file: {e}")
