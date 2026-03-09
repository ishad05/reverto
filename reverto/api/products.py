from __future__ import annotations

from typing import Any, TypedDict

import frappe


class ProductSummary(TypedDict):
	name: str
	product_name: str
	quantity: int | None
	price_per_quantity: float | None
	status: str
	product_image: str | None


@frappe.whitelist(allow_guest=True)
def list_products(limit: int = 50) -> list[ProductSummary]:
	"""Return a concise list of Product docs for the marketplace frontend."""

	fields = [
		"name",
		"product_name",
		"quantity",
		"price_per_quantity",
		"status",
		"product_image",
	]

	products: list[dict[str, Any]] = frappe.get_all(
		"Product",
		fields=fields,
		filters={"status": "Available"},
		limit=limit,
		order_by="creation desc",
		ignore_permissions=True,
	)

	return [
		ProductSummary(
			name=p.get("name", ""),
			product_name=p.get("product_name", ""),
			quantity=p.get("quantity"),
			price_per_quantity=p.get("price_per_quantity"),
			status=p.get("status") or "Available",
			product_image=p.get("product_image"),
		)
		for p in products
	]

