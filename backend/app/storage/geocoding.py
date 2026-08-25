import httpx

async def geocode_address(address: str) -> tuple[float, float] | None:
    """Convert an address string to (latitude, longitude) using OpenStreetMap Nominatim.
    Returns None if geocoding fails or no results found."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "FieldForce-App/1.0"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, params=params, headers=headers)
            res.raise_for_status()
            data = res.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None
