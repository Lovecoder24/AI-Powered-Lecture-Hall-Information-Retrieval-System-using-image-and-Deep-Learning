#!/usr/bin/env python3
"""
Script to add the missing halls to the Django database
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Add the Django project to the Python path
sys.path.append('backend/hallnav_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallnav_backend.settings')
django.setup()

from recognition.models import Hall, Schedule

def add_halls():
    # Add the two halls that the model can recognize
    halls_data = [
        {
            'name': 'LT1 & 2',
            'capacity': 150,
            'latitude': 1.0,
            'longitude': 2.0,
            'floor': 1
        },
        {
            'name': 'LT3 & 4',
            'capacity': 200,
            'latitude': 3.0,
            'longitude': 4.0,
            'floor': 2
        }
    ]
    
    for hall_data in halls_data:
        hall, created = Hall.objects.get_or_create(
            name=hall_data['name'],
            defaults=hall_data
        )
        if created:
            print(f"Created hall: {hall.name}")
        else:
            print(f"Hall already exists: {hall.name}")
    
    # Add some sample schedules
    try:
        lt1_2 = Hall.objects.get(name='LT1 & 2')
        lt3_4 = Hall.objects.get(name='LT3 & 4')
        
        # Sample schedules for LT1 & 2
        Schedule.objects.get_or_create(
            hall=lt1_2,
            start_time=datetime.now().replace(hour=9, minute=0, second=0, microsecond=0),
            end_time=datetime.now().replace(hour=10, minute=30, second=0, microsecond=0),
            defaults={'course_name': 'Computer Science 101'}
        )
        
        Schedule.objects.get_or_create(
            hall=lt1_2,
            start_time=datetime.now().replace(hour=11, minute=0, second=0, microsecond=0),
            end_time=datetime.now().replace(hour=12, minute=30, second=0, microsecond=0),
            defaults={'course_name': 'Mathematics 201'}
        )
        
        # Sample schedules for LT3 & 4
        Schedule.objects.get_or_create(
            hall=lt3_4,
            start_time=datetime.now().replace(hour=10, minute=0, second=0, microsecond=0),
            end_time=datetime.now().replace(hour=11, minute=30, second=0, microsecond=0),
            defaults={'course_name': 'Physics 301'}
        )
        
        Schedule.objects.get_or_create(
            hall=lt3_4,
            start_time=datetime.now().replace(hour=14, minute=0, second=0, microsecond=0),
            end_time=datetime.now().replace(hour=15, minute=30, second=0, microsecond=0),
            defaults={'course_name': 'Engineering 401'}
        )
        
        print("Sample schedules added successfully!")
        
    except Hall.DoesNotExist as e:
        print(f"Error: {e}")
    
    print("\nAll halls and schedules added!")

if __name__ == "__main__":
    add_halls()
