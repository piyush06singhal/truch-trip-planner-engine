import threading
from typing import Any, Optional

class CacheService:
    """
    Thread-safe in-memory cache implementation designed to avoid redundant external 
    geocoding API lookups. Provides interface signatures ready for Redis migration.
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(CacheService, cls).__new__(cls, *args, **kwargs)
                cls._instance._cache = {}
                cls._instance._cache_lock = threading.Lock()
        return cls._instance

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a cached value for a given key string.
        """
        with self._cache_lock:
            return self._cache.get(key)

    def set(self, key: str, value: Any) -> None:
        """
        Store a value in memory cache under a unique key string.
        """
        with self._cache_lock:
            self._cache[key] = value

    def clear(self) -> None:
        """
        Reset cache storage.
        """
        with self._cache_lock:
            self._cache.clear()
