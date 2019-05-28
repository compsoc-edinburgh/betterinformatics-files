import time


def cache(validity):

    class PeopleCache:

        def __init__(self, fun):
            self.fun = fun
            self.cache = {}
            self.cache_time = {}

        def __call__(self, *item):
            if item not in self.cache or time.time() - self.cache_time[item] > validity:
                self.cache[item] = self.fun(*item)
                self.cache_time[item] = time.time()
            return self.cache[item]

    return PeopleCache
