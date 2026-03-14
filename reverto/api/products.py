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


# ---------------------------------------------------------------------------
# Public marketplace API (guest-accessible)
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def list_products(
	limit: int = 50,
	category: Optional[str] = None,
	search: Optional[str] = None,
) -> list[ProductSummary]:
	"""Return available products for the marketplace, with optional filters."""

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


# ---------------------------------------------------------------------------
# Seller API (authenticated)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def my_products() -> list[dict]:
	"""Return all product listings owned by the current user."""
	has_category = _category_field_exists()

	fields = [
		"name",
		"product_name",
		"quantity",
		"price_per_quantity",
		"status",
		"product_image",
		"creation",
		"owner",
	]
	if has_category:
		fields.append("category")

	return frappe.get_all(
		"Product",
		fields=fields,
		filters={"owner": frappe.session.user},
		order_by="creation desc",
		ignore_permissions=True,
	)


@frappe.whitelist()
def create_product(
	product_name: str,
	quantity: float,
	price_per_quantity: float,
	category: Optional[str] = None,
	product_image: Optional[str] = None,
	status: str = "Available",
) -> dict:
	"""Create a new product listing for the logged-in seller."""
	doc_data: dict[str, Any] = {
		"doctype": "Product",
		"product_name": product_name,
		"quantity": int(quantity),
		"price_per_quantity": float(price_per_quantity),
		"status": status,
	}
	if product_image:
		doc_data["product_image"] = product_image
	if category and _category_field_exists():
		doc_data["category"] = category

	doc = frappe.get_doc(doc_data)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "message": "Listing created successfully."}


@frappe.whitelist()
def update_product(
	name: str,
	product_name: str,
	quantity: float,
	price_per_quantity: float,
	status: str,
	category: Optional[str] = None,
	product_image: Optional[str] = None,
) -> dict:
	"""Update an existing product listing (owner only)."""
	doc = frappe.get_doc("Product", name)
	if doc.owner != frappe.session.user:
		frappe.throw("You can only edit your own listings.", frappe.PermissionError)

	doc.product_name = product_name
	doc.quantity = int(quantity)
	doc.price_per_quantity = float(price_per_quantity)
	doc.status = status
	if product_image is not None:
		doc.product_image = product_image
	if category is not None and _category_field_exists():
		doc.category = category

	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"message": "Listing updated successfully."}


@frappe.whitelist()
def delete_product(name: str) -> dict:
	"""Delete a product listing (owner only)."""
	doc = frappe.get_doc("Product", name)
	if doc.owner != frappe.session.user:
		frappe.throw("You can only delete your own listings.", frappe.PermissionError)

	doc.delete(ignore_permissions=True)
	frappe.db.commit()
	return {"message": "Listing deleted successfully."}
