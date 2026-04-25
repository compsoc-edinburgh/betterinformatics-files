from ninja import Schema
from typing import TypeVar, Generic

T = TypeVar("T")


class ValueWrapped(Schema, Generic[T]):
    value: T
