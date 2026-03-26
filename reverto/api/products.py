from __future__ import annotations

import re
import urllib.request
from typing import Any, Optional, TypedDict
from urllib.parse import parse_qs, urlparse

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
	latitude: Optional[float]
	longitude: Optional[float]
	location_url: Optional[str]


def _category_field_exists() -> bool:
	"""Check whether the category column has been created via bench migrate."""
	try:
		return frappe.db.has_column("Product", "category")
	except Exception:
		return False


def _location_fields_exist() -> bool:
	"""Check whether the location columns have been created via bench migrate."""
	try:
		return frappe.db.has_column("Product", "latitude")
	except Exception:
		return False


_SHORT_URL_HOSTS = ("maps.app.goo.gl", "goo.gl")


def _resolve_short_url(url: str) -> str:
	"""Follow HTTP redirects and return the final URL, or the original if it fails."""
	try:
		with urllib.request.urlopen(
			urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}),
			timeout=5,
		) as resp:
			return resp.url
	except Exception:
		return url


def _parse_coords_from_url(url: str) -> tuple[Optional[float], Optional[float]]:
	"""
	Extract (latitude, longitude) from a Google Maps or OpenStreetMap URL.
	Returns (None, None) if no coordinates can be parsed.

	Supported formats:
	  Google Maps short:   maps.app.goo.gl/... or goo.gl/maps/...
	  Google Maps place:   .../maps/place/.../@12.9716,77.5946,15z
	  Google Maps q=:      .../maps?q=12.9716,77.5946
	  Google Maps query=:  .../maps/search/?api=1&query=12.9716,77.5946
	  Google Maps ll=:     .../maps?ll=12.9716,77.5946
	  OpenStreetMap:       ...openstreetmap.org/#map=15/12.9716/77.5946
	  Bare decimal pair:   12.9716,77.5946
	"""
	if not url or not url.strip():
		return None, None

	url = url.strip()

	# Resolve short URLs (maps.app.goo.gl, goo.gl/maps) by following the redirect
	try:
		hostname = urlparse(url).hostname or ""
		if any(hostname == h or hostname.endswith("." + h) for h in _SHORT_URL_HOSTS):
			url = _resolve_short_url(url)
	except Exception:
		pass

	# Google Maps @lat,lng  (place / direction URLs)
	m = re.search(r"@(-?\d+\.?\d*),(-?\d+\.?\d*)", url)
	if m:
		return float(m.group(1)), float(m.group(2))

	# Query-string params: ?q= or ?ll= or ?center= or ?query=
	try:
		parsed = urlparse(url)
		qs = parse_qs(parsed.query)
		for key in ("q", "ll", "center", "query"):
			if key in qs:
				val = qs[key][0]
				parts = val.split(",")
				if len(parts) == 2:
					return float(parts[0].strip()), float(parts[1].strip())
	except Exception:
		pass

	# OpenStreetMap  #map=zoom/lat/lng
	m = re.search(r"#map=\d+/(-?\d+\.?\d*)/(-?\d+\.?\d*)", url)
	if m:
		return float(m.group(1)), float(m.group(2))

	# Bare decimal pair  "12.9716, 77.5946"
	m = re.match(r"^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$", url)
	if m:
		return float(m.group(1)), float(m.group(2))

	return None, None


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
	has_location = _location_fields_exist()

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
	if has_location:
		fields += ["latitude", "longitude", "location_url"]

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
			latitude=float(p["latitude"]) if p.get("latitude") else None,
			longitude=float(p["longitude"]) if p.get("longitude") else None,
			location_url=p.get("location_url"),
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
	has_location = _location_fields_exist()

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
	if has_location:
		fields += ["latitude", "longitude", "location_url"]

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
	location_url: Optional[str] = None,
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
	if location_url and _location_fields_exist():
		doc_data["location_url"] = location_url

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
	location_url: Optional[str] = None,
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
	if location_url is not None and _location_fields_exist():
		doc.location_url = location_url

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
