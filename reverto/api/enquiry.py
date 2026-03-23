from __future__ import annotations

from typing import Optional

import frappe


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _assert_access(enquiry: "frappe.Document") -> None:
	if frappe.session.user not in (enquiry.buyer, enquiry.seller):
		frappe.throw("Access denied.", frappe.PermissionError)


def _push_realtime(enquiry: "frappe.Document", payload: dict) -> None:
	"""Notify the *other* party in real-time via Frappe socket."""
	other = enquiry.seller if frappe.session.user == enquiry.buyer else enquiry.buyer
	frappe.publish_realtime(
		event=f"enquiry_{enquiry.name}",
		message=payload,
		user=other,
	)


def _add_message(
	enquiry_name: str,
	message_type: str,
	text: str,
	sender: Optional[str] = None,
	proposed_price: Optional[float] = None,
) -> str:
	sender = sender or frappe.session.user
	sender_name = frappe.get_value("User", sender, "full_name") or sender
	doc = frappe.get_doc(
		{
			"doctype": "Reverto Message",
			"enquiry": enquiry_name,
			"sender": sender,
			"sender_name": sender_name,
			"message_text": text,
			"message_type": message_type,
			"proposed_price_per_kg": proposed_price,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


# ---------------------------------------------------------------------------
# Buyer APIs
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_enquiry(product_id: str, quantity_kg: int) -> dict:
	"""Open an enquiry for a product. Returns existing open enquiry if one exists."""
	product = frappe.get_doc("Product", product_id)
	buyer = frappe.session.user
	seller = product.owner

	if buyer == seller:
		frappe.throw("You cannot enquire about your own listing.")
	if seller == "Guest" or not seller:
		frappe.throw("This listing has no seller assigned.")

	# Re-use open / negotiating enquiry if it already exists
	existing = frappe.db.get_value(
		"Reverto Enquiry",
		{"product": product_id, "buyer": buyer, "status": ["in", ["Open", "Negotiating"]]},
		"name",
	)
	if existing:
		return {"enquiry_id": existing, "existing": True}

	enquiry = frappe.get_doc(
		{
			"doctype": "Reverto Enquiry",
			"product": product_id,
			"product_name": product.product_name,
			"buyer": buyer,
			"seller": seller,
			"quantity_kg": int(quantity_kg),
			"original_price_per_kg": float(product.price_per_quantity or 0),
			"status": "Open",
		}
	)
	enquiry.insert(ignore_permissions=True)

	price = product.price_per_quantity or 0
	_add_message(
		enquiry.name,
		"system",
		f"Enquiry opened for {int(quantity_kg)} kg of {product.product_name} at ₹{price}/kg.",
		sender=buyer,
	)

	frappe.db.commit()

	# Notify seller
	frappe.publish_realtime(
		event="new_enquiry",
		message={"enquiry_id": enquiry.name, "product_name": product.product_name},
		user=seller,
	)

	return {"enquiry_id": enquiry.name, "existing": False}


@frappe.whitelist()
def get_enquiry(enquiry_id: str) -> dict:
	"""Return enquiry details + all messages (access-controlled)."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)
	_assert_access(enquiry)

	messages = frappe.get_all(
		"Reverto Message",
		filters={"enquiry": enquiry_id},
		fields=[
			"name",
			"sender",
			"sender_name",
			"message_text",
			"message_type",
			"proposed_price_per_kg",
			"creation",
		],
		order_by="creation asc",
		ignore_permissions=True,
	)

	return {
		"enquiry": {
			"name": enquiry.name,
			"product": enquiry.product,
			"product_name": enquiry.product_name,
			"buyer": enquiry.buyer,
			"seller": enquiry.seller,
			"quantity_kg": enquiry.quantity_kg,
			"original_price_per_kg": float(enquiry.original_price_per_kg or 0),
			"agreed_price_per_kg": float(enquiry.agreed_price_per_kg or 0) or None,
			"status": enquiry.status,
		},
		"messages": messages,
	}


@frappe.whitelist()
def send_message(enquiry_id: str, message_text: str) -> dict:
	"""Send a plain text message."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)
	_assert_access(enquiry)

	msg_name = _add_message(enquiry_id, "message", message_text)

	if enquiry.status == "Open":
		enquiry.status = "Negotiating"
		enquiry.save(ignore_permissions=True)

	frappe.db.commit()
	_push_realtime(enquiry, {"type": "new_message", "enquiry_id": enquiry_id})

	return {"message_id": msg_name}


@frappe.whitelist()
def propose_price(enquiry_id: str, new_price_per_kg: float) -> dict:
	"""Seller proposes a new per-kg price."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)
	if frappe.session.user != enquiry.seller:
		frappe.throw("Only the seller can propose a price.", frappe.PermissionError)

	price = float(new_price_per_kg)
	msg_name = _add_message(
		enquiry_id,
		"price_offer",
		f"New price offer: ₹{price}/kg",
		proposed_price=price,
	)

	enquiry.status = "Negotiating"
	enquiry.save(ignore_permissions=True)
	frappe.db.commit()

	_push_realtime(enquiry, {"type": "price_offer", "price": price, "enquiry_id": enquiry_id})

	return {"message_id": msg_name}


@frappe.whitelist()
def respond_to_price(enquiry_id: str, accepted: int) -> dict:
	"""Buyer accepts (accepted=1) or rejects (accepted=0) the latest price offer."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)
	if frappe.session.user != enquiry.buyer:
		frappe.throw("Only the buyer can accept or reject a price.", frappe.PermissionError)

	offer = frappe.get_all(
		"Reverto Message",
		filters={"enquiry": enquiry_id, "message_type": "price_offer"},
		fields=["name", "proposed_price_per_kg"],
		order_by="creation desc",
		limit=1,
		ignore_permissions=True,
	)
	if not offer:
		frappe.throw("No price offer to respond to.")

	agreed_price = float(offer[0].proposed_price_per_kg or 0)

	if int(accepted):
		enquiry.agreed_price_per_kg = agreed_price
		enquiry.status = "Accepted"
		enquiry.save(ignore_permissions=True)
		_add_message(enquiry_id, "price_accepted", f"Price of ₹{agreed_price}/kg accepted! Deal confirmed.")
	else:
		enquiry.status = "Negotiating"
		enquiry.save(ignore_permissions=True)
		_add_message(enquiry_id, "price_rejected", "Price offer declined. Please propose a new price.")

	frappe.db.commit()
	_push_realtime(enquiry, {"type": "price_response", "accepted": bool(int(accepted)), "enquiry_id": enquiry_id})

	return {"status": "accepted" if int(accepted) else "rejected"}


@frappe.whitelist()
def get_buyer_enquiries() -> list:
	return frappe.get_all(
		"Reverto Enquiry",
		filters={"buyer": frappe.session.user},
		fields=[
			"name", "product", "product_name", "seller",
			"quantity_kg", "original_price_per_kg", "agreed_price_per_kg",
			"status", "creation",
		],
		order_by="creation desc",
		ignore_permissions=True,
	)


@frappe.whitelist()
def confirm_payment(enquiry_id: str) -> dict:
	"""Mark an accepted enquiry as paid/closed and the product as Sold."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)
	_assert_access(enquiry)

	if enquiry.status != "Accepted":
		frappe.throw("Payment can only be confirmed for an accepted enquiry.")

	enquiry.status = "Closed"
	enquiry.save(ignore_permissions=True)

	# Reduce product inventory; mark Sold only when stock reaches zero
	if frappe.db.exists("Product", enquiry.product):
		product = frappe.get_doc("Product", enquiry.product)
		new_qty = max(0, (product.quantity or 0) - (enquiry.quantity_kg or 0))
		product.quantity = new_qty
		if new_qty <= 0:
			product.status = "Sold"
		product.save(ignore_permissions=True)

	_add_message(enquiry_id, "system", "Payment confirmed. The deal is now complete.")
	frappe.db.commit()

	# Notify both parties
	frappe.publish_realtime(
		event=f"enquiry_{enquiry_id}",
		message={"type": "payment_confirmed"},
		user=enquiry.buyer,
	)
	frappe.publish_realtime(
		event=f"enquiry_{enquiry_id}",
		message={"type": "payment_confirmed"},
		user=enquiry.seller,
	)

	return {"success": True}


@frappe.whitelist()
def get_my_orders() -> list:
	"""Return all completed (Closed) enquiries for the current buyer, enriched with product image."""
	orders = frappe.get_all(
		"Reverto Enquiry",
		filters={"buyer": frappe.session.user, "status": "Closed"},
		fields=[
			"name", "product", "product_name", "seller",
			"quantity_kg", "original_price_per_kg", "agreed_price_per_kg",
			"status", "creation",
		],
		order_by="creation desc",
		ignore_permissions=True,
	)
	for order in orders:
		order["product_image"] = frappe.db.get_value("Product", order["product"], "product_image") or None
		price = float(order.get("agreed_price_per_kg") or order.get("original_price_per_kg") or 0)
		subtotal = price * (order.get("quantity_kg") or 0)
		order["total_paid"] = round(subtotal * 1.18, 2)
	return orders


def _load_co2_factors() -> tuple[dict[str, float], float]:
	"""
	Read all CO2 Factor records from the DB in a single query.
	Returns (factors_dict, default_fallback).
	Falls back to 1.0 if the DocType is empty or not yet migrated.
	"""
	rows = frappe.get_all(
		"CO2 Factor",
		fields=["category", "factor_kg_co2_per_kg"],
		ignore_permissions=True,
	)
	factors = {r["category"]: float(r["factor_kg_co2_per_kg"]) for r in rows if r.get("category")}
	default = factors.get("Other", 1.0)
	return factors, default


@frappe.whitelist()
def get_sustainability_stats() -> dict:
	"""
	Return CO₂ & waste-diversion stats for the current user (as buyer + seller)
	plus community-wide totals across all closed enquiries.
	CO₂ factors are loaded from the 'CO2 Factor' DocType — editable via Frappe desk.
	"""
	user = frappe.session.user

	# Load factors once — one DB round-trip for the entire calculation
	factors, default_factor = _load_co2_factors()

	# ── All closed enquiries in one pass ─────────────────────────────────────
	all_rows = frappe.get_all(
		"Reverto Enquiry",
		filters={"status": "Closed"},
		fields=["product", "quantity_kg", "buyer", "seller"],
		ignore_permissions=True,
	)

	# Collect unique product IDs and resolve categories in one query
	product_ids = list({r["product"] for r in all_rows if r.get("product")})
	category_map: dict[str, str] = {}
	if product_ids:
		product_rows = frappe.get_all(
			"Product",
			filters={"name": ["in", product_ids]},
			fields=["name", "category"],
			ignore_permissions=True,
		)
		category_map = {p["name"]: (p.get("category") or "") for p in product_rows}

	personal_waste_kg: float = 0.0
	personal_co2_kg: float = 0.0
	community_waste_kg: float = 0.0
	community_co2_kg: float = 0.0

	for row in all_rows:
		qty = float(row.get("quantity_kg") or 0)
		category = category_map.get(row.get("product") or "", "")
		factor = factors.get(category, default_factor)

		community_waste_kg += qty
		community_co2_kg += qty * factor

		if row.get("buyer") == user or row.get("seller") == user:
			personal_waste_kg += qty
			personal_co2_kg += qty * factor

	return {
		"personal_waste_kg": round(personal_waste_kg, 2),
		"personal_co2_kg": round(personal_co2_kg, 2),
		"community_waste_kg": round(community_waste_kg, 2),
		"community_co2_kg": round(community_co2_kg, 2),
	}


@frappe.whitelist()
def direct_purchase(product_id: str, quantity_kg: int) -> dict:
	"""
	Buy a product directly at the listed price — skips the negotiation flow.
	Creates a Closed enquiry and reduces inventory immediately.
	"""
	product = frappe.get_doc("Product", product_id)
	buyer = frappe.session.user
	seller = product.owner

	if buyer == seller:
		frappe.throw("You cannot buy your own listing.")
	if seller == "Guest" or not seller:
		frappe.throw("This listing has no seller assigned.")

	qty = int(quantity_kg)
	available = int(product.quantity or 0)
	if qty <= 0:
		frappe.throw("Quantity must be at least 1 kg.")
	if qty > available:
		frappe.throw(f"Only {available} kg available. Please reduce your quantity.")

	price = float(product.price_per_quantity or 0)
	if price <= 0:
		frappe.throw("This product has no listed price — use the enquiry flow to negotiate.")

	enquiry = frappe.get_doc(
		{
			"doctype": "Reverto Enquiry",
			"product": product_id,
			"product_name": product.product_name,
			"buyer": buyer,
			"seller": seller,
			"quantity_kg": qty,
			"original_price_per_kg": price,
			"agreed_price_per_kg": price,
			"status": "Closed",
		}
	)
	enquiry.insert(ignore_permissions=True)

	_add_message(
		enquiry.name,
		"system",
		f"Direct purchase: {qty} kg at ₹{price}/kg. Payment confirmed immediately.",
		sender=buyer,
	)

	# Reduce inventory; mark Sold only when stock reaches zero
	new_qty = max(0, available - qty)
	product.quantity = new_qty
	if new_qty <= 0:
		product.status = "Sold"
	product.save(ignore_permissions=True)

	frappe.db.commit()

	# Notify seller
	frappe.publish_realtime(
		event="new_enquiry",
		message={
			"enquiry_id": enquiry.name,
			"product_name": product.product_name,
			"type": "direct_purchase",
		},
		user=seller,
	)

	return {"success": True, "enquiry_id": enquiry.name}


@frappe.whitelist()
def get_seller_orders() -> list:
	"""Return all completed (Closed) enquiries where the current user is the seller."""
	orders = frappe.get_all(
		"Reverto Enquiry",
		filters={"seller": frappe.session.user, "status": "Closed"},
		fields=[
			"name", "product", "product_name", "buyer",
			"quantity_kg", "original_price_per_kg", "agreed_price_per_kg",
			"status", "creation",
		],
		order_by="creation desc",
		ignore_permissions=True,
	)
	for order in orders:
		order["product_image"] = frappe.db.get_value("Product", order["product"], "product_image") or None
		buyer_name = frappe.db.get_value("User", order["buyer"], "full_name") or order["buyer"]
		order["buyer_name"] = buyer_name
		price = float(order.get("agreed_price_per_kg") or order.get("original_price_per_kg") or 0)
		subtotal = price * (order.get("quantity_kg") or 0)
		order["net_revenue"] = round(subtotal, 2)          # pre-GST — what the seller earns
		order["total_billed"] = round(subtotal * 1.18, 2)  # incl. GST — what the buyer paid
	return orders


@frappe.whitelist()
def get_seller_enquiries() -> list:
	return frappe.get_all(
		"Reverto Enquiry",
		filters={"seller": frappe.session.user},
		fields=[
			"name", "product", "product_name", "buyer",
			"quantity_kg", "original_price_per_kg", "agreed_price_per_kg",
			"status", "creation",
		],
		order_by="creation desc",
		ignore_permissions=True,
	)
