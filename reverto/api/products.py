from __future__ import annotations

from typing import Any, Optional, TypedDict

import frappe


class ProductSummary(TypedDict):
	name: str
	product_name: str
	category: Optional[str]
	quantity: Optional[int]
	price_per_quantity: Optional[float]
	status: str
	product_image: Optional[str]
	owner: str


def _category_field_exists() -> bool:
	"""Check whether the category column has been created via bench migrate."""
	try:
		return frappe.db.has_column("Product", "category")
	except Exception:
		return False


@frappe.whitelist(allow_guest=True)
def list_products(
	limit: int = 50,
	category: Optional[str] = None,
	search: Optional[str] = None,
) -> list[ProductSummary]:
	"""Return a concise list of Product docs for the marketplace frontend.

	Supports optional keyword search on product_name and optional category filter.
	Both filters are combined with AND logic.
	"""

	has_category = _category_field_exists()

	fields = [
		"name",
		"product_name",
		"quantity",
		"price_per_quantity",
		"status",
		"product_image",
		"owner",
	]
	if has_category:
		fields.append("category")

	filters: dict[str, Any] = {"status": "Available"}

	if category and has_category:
		filters["category"] = category

	if search and search.strip():
		filters["product_name"] = ["like", f"%{search.strip()}%"]

	products: list[dict[str, Any]] = frappe.get_all(
		"Product",
		fields=fields,
		filters=filters,
		limit=limit,
		order_by="creation desc",
		ignore_permissions=True,
	)

	return [
		ProductSummary(
			name=p.get("name", ""),
			product_name=p.get("product_name", ""),
			category=p.get("category"),
			quantity=p.get("quantity"),
			price_per_quantity=p.get("price_per_quantity"),
			status=p.get("status") or "Available",
			product_image=p.get("product_image"),
			owner=p.get("owner", ""),
		)
		for p in products
	]
