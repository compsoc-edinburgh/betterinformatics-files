import time

from django.conf import settings


def cache(validity):
    class FuncCache:
        def __init__(self, fun):
            self.fun = fun
            self.cache = {}
            self.cache_time = {}

        def __call__(self, *item):
            if (
                settings.TESTING
                or item not in self.cache
                or time.time() - self.cache_time[item] > validity
            ):
                self.cache[item] = self.fun(*item)
                self.cache_time[item] = time.time()
            return self.cache[item]

        def reset_cache(self, key):
            if key in self.cache:
                del self.cache[key]
                del self.cache_time[key]

    return FuncCache

