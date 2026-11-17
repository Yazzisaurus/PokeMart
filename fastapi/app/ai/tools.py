"""Tool definitions sent to Ollama and executed here."""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, ConfigDict, ValidationError

from app.api.schemas import Record


class ToolContext(BaseModel):
    """Per-request data a tool may read."""

    model_config = ConfigDict(frozen=True)

    records: list[Record]


class Tool(ABC):
    """One function the model can call."""

    name: str
    description: str
    parameters: dict[str, Any]
    args_model: type[BaseModel]

    def schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }

    @abstractmethod
    async def run(self, arguments: BaseModel, context: ToolContext) -> str:
        """Return a JSON string the model can read."""


class SearchProductsArgs(BaseModel):
    model_config = ConfigDict(extra="ignore")

    query: str


class ListProductsArgs(BaseModel):
    model_config = ConfigDict(extra="ignore")


class SearchProducts(Tool):
    name = "search_products"
    description = "Find products whose name or description matches a query."
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Words to match against the product name and description.",
            },
        },
        "required": ["query"],
    }
    args_model = SearchProductsArgs

    async def run(self, arguments: BaseModel, context: ToolContext) -> str:
        query = arguments.query if isinstance(arguments, SearchProductsArgs) else ""
        needle = query.casefold().strip()
        matches = [
            record
            for record in context.records
            if needle and needle in f"{record.name} {record.description}".casefold()
        ]
        return _products_json(matches)


class ListProducts(Tool):
    name = "list_products"
    description = "List every product record available for this question."
    parameters = {"type": "object", "properties": {}}
    args_model = ListProductsArgs

    async def run(self, arguments: BaseModel, context: ToolContext) -> str:
        return _products_json(context.records)


def _products_json(records: list[Record]) -> str:
    return json.dumps(
        {
            "products": [
                {"name": record.name, "description": record.description} for record in records
            ]
        }
    )


class ToolRegistry:
    """The tools included with one chat request."""

    def __init__(self, context: ToolContext) -> None:
        self._context = context
        self._tools = {tool.name: tool for tool in (SearchProducts(), ListProducts())}

    def schemas(self) -> list[dict[str, Any]]:
        return [tool.schema() for tool in self._tools.values()]

    async def dispatch(self, name: str, arguments: dict[str, Any]) -> str:
        tool = self._tools.get(name)
        if tool is None:
            return json.dumps({"error": f"Unknown tool: {name}"})
        try:
            parsed = tool.args_model.model_validate(arguments)
        except ValidationError as exc:
            return json.dumps(
                {"error": "Invalid arguments", "details": exc.errors(include_url=False)},
                default=str,
            )
        return await tool.run(parsed, self._context)
