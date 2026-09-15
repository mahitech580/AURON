"""
AURON API Gateway Configuration Package.

Contains configuration and application settings for the API Gateway.
"""

from .settings import Settings, get_settings, settings

__version__ = "0.1.0"

__all__ = [
    "Settings",
    "get_settings",
    "settings",
]
