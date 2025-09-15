
from PIL import Image
import os

# Define paths and target size
dataset_dir = ''  # Your dataset folder
target_size = (224, 224)  # Resize to 224x224
output_dir = 'dataset_resized'  # New folder for resized images

# Create output directory structure
def create_output_dirs(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    for split in ['train', 'val', 'test']:
        for hall in ['LT1 & 2', 'LT3 & 4']:  # Update with your hall names
            input_path = os.path.join(input_dir, split, hall)
            output_path = os.path.join(output_dir, split, hall)
            if os.path.exists(input_path):
                if not os.path.exists(output_path):
                    os.makedirs(output_path)

# Resize images
def resize_images(input_dir, output_dir, target_size):
    create_output_dirs(input_dir, output_dir)
    for split in ['train', 'val', 'test']:
        for hall in ['LT1 & 2', 'LT3 & 4']:
            input_path = os.path.join(input_dir, split, hall)
            output_path = os.path.join(output_dir, split, hall)
            if os.path.exists(input_path):
                for filename in os.listdir(input_path):
                    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                        # Open image
                        img_path = os.path.join(input_path, filename)
                        img = Image.open(img_path)
                        # Resize (use LANCZOS for high-quality resizing)
                        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
                        # Save to output directory
                        output_file = os.path.join(output_path, filename)
                        img_resized.save(output_file, quality=95)
                        print(f'Resized: {img_path} -> {output_file}')

# Run resizing
resize_images(dataset_dir, output_dir, target_size)
