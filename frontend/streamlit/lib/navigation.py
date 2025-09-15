from typing import List, Tuple, Union

# Static hall locations for now (will be updated to use database later)
HALL_LOCATIONS = {
    "Entrance": (0, 0),
    "Hall_A101": (1, 2),
    "Hall_B202": (3, 5),
    "Library": (5, 1),
}

def get_hall_locations_from_db():
    """Get hall locations from Django database (for future use)"""
    # This function can be called explicitly when needed
    # rather than at import time
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'hallnav_backend'))
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallnav_backend.settings')
        
        import django
        django.setup()
        
        from hallnav_backend.recognition.models import Hall
        
        halls = Hall.objects.all()
        locations = {}
        for hall in halls:
            locations[hall.name] = (hall.latitude, hall.longitude)
        # Add entrance as default if not in database
        if "Entrance" not in locations:
            locations["Entrance"] = (0, 0)
        return locations
    except Exception as e:
        print(f"Could not load from database: {e}")
        return HALL_LOCATIONS


def compute_route(start: str, end: str) -> List[str]:
    """
    Computes a simple route from start to end using static hall names.
    Args:
        start (str): Starting hall name.
        end (str): Destination hall name.
    Returns:
        List[str]: List of hall names representing the route.
    Raises:
        ValueError: If start or end is not in the map.
    """
    if start not in HALL_LOCATIONS or end not in HALL_LOCATIONS:
        raise ValueError("Invalid start or end location.")
    # For MVP, just return [start, end] (no real pathfinding)
    return [start, end]


def get_turn_by_turn(route: List[str]) -> List[str]:
    """
    Generates turn-by-turn directions for a given route.
    Args:
        route (List[str]): List of hall names.
    Returns:
        List[str]: List of text instructions.
    """
    if len(route) < 2:
        return ["You are already at your destination."]
    directions = [f"Start at {route[0]}."]
    for i in range(1, len(route)):
        directions.append(f"Proceed to {route[i]}.")
    directions.append("You have arrived at your destination.")
    return directions


def get_coordinates(route: List[str]) -> List[Tuple[int, int]]:
    """
    Returns coordinates for each hall in the route for mapping.
    Args:
        route (List[str]): List of hall names.
    Returns:
        List[Tuple[int, int]]: List of (x, y) coordinates.
    """
    return [HALL_LOCATIONS[hall] for hall in route if hall in HALL_LOCATIONS]

# Note: AR overlays and voice guidance are not implemented in this MVP.
# Future work: Integrate with AR frameworks and TTS engines for full navigation experience.
