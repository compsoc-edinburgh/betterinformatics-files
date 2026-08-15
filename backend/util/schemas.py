from typing import TypeVar

from ninja import Schema

T = TypeVar("T")


class ValueWrapped[T](Schema):
    value: T
