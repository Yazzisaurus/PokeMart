"""Named system prompts."""

from __future__ import annotations

from dataclasses import dataclass

from app.api.schemas import Record


@dataclass(frozen=True)
class Prompt:
    """A system prompt with `{name}` placeholders replaced literally."""

    name: str
    template: str

    def render(self, **values: str) -> str:
        rendered = self.template
        for key, value in values.items():
            rendered = rendered.replace("{" + key + "}", value)
        return rendered


def records_context(records: list[Record]) -> str:
    if not records:
        return "(none)"
    return "\n".join(f"- {record.name}: {record.description}" for record in records)


SHOPPING_ASSISTANT = Prompt(
    name="shopping_assistant",
    template="""You are the PokeMart shopping assistant. Help the shopper compare products and prices across nearby stores.

        Rules:
        - Treat the records below and the results of tool calls as the only source of prices, stores, and product details.
        - If those sources do not contain the answer, say you could not find it.
        - Do not invent prices, stores, or stock.
        - Call a tool when you need to look up or filter products.
        - Reply in plain sentences.

        Records:
        {context}
    """,
)

PROMPTS: dict[str, Prompt] = {
    SHOPPING_ASSISTANT.name: SHOPPING_ASSISTANT,
}


def render_shopping_prompt(records: list[Record]) -> str:
    return SHOPPING_ASSISTANT.render(context=records_context(records))
