from __future__ import annotations

from typing import Optional

import frappe


# ---------------------------------------------------------------------------
# Seller Profile
# ---------------------------------------------------------------------------


def _get_or_create_profile(seller: str) -> "frappe.Document":
	"""Return existing profile or create an empty one for the given seller."""
	if frappe.db.exists("Reverto Seller Profile", seller):
		return frappe.get_doc("Reverto Seller Profile", seller)

	doc = frappe.get_doc(
		{
			"doctype": "Reverto Seller Profile",
			"seller": seller,
			"enterprise_name": "",
			"location": "",
			"about": "",
			"avg_rating": 0,
			"rating_count": 0,
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc


@frappe.whitelist()
def get_my_profile() -> dict:
	"""Return the current user's full profile including seller details."""
	user_id = frappe.session.user
	if user_id == "Guest":
		frappe.throw("Authentication required.", frappe.AuthenticationError)

	user = frappe.get_doc("User", user_id)
	account_type = user.bio or "Buyer"

	result: dict = {
		"account_type": account_type,
		"full_name": user.full_name or "",
		"first_name": user.first_name or "",
		"email": user.email or "",
		"mobile_no": user.mobile_no or "",
		"user_image": user.user_image or "",
	}

	if account_type == "Seller":
		profile = _get_or_create_profile(user_id)
		result.update(
			{
				"enterprise_name": profile.enterprise_name or "",
				"location": profile.location or "",
				"about": profile.about or "",
				"avg_rating": float(profile.avg_rating or 0),
				"rating_count": int(profile.rating_count or 0),
				"profile_image": profile.profile_image or user.user_image or "",
			}
		)

	return result


@frappe.whitelist()
def update_my_profile(
	full_name: Optional[str] = None,
	mobile_no: Optional[str] = None,
	enterprise_name: Optional[str] = None,
	location: Optional[str] = None,
	about: Optional[str] = None,
	profile_image: Optional[str] = None,
) -> dict:
	"""Update user and (for sellers) seller profile fields."""
	user_id = frappe.session.user
	if user_id == "Guest":
		frappe.throw("Authentication required.", frappe.AuthenticationError)

	user = frappe.get_doc("User", user_id)

	if full_name is not None:
		parts = full_name.strip().split(" ", 1)
		user.first_name = parts[0]
		user.last_name = parts[1] if len(parts) > 1 else ""
	if mobile_no is not None:
		user.mobile_no = mobile_no
	if profile_image is not None:
		user.user_image = profile_image

	user.flags.ignore_permissions = True
	user.save(ignore_permissions=True)

	account_type = user.bio or "Buyer"
	if account_type == "Seller":
		profile = _get_or_create_profile(user_id)
		if enterprise_name is not None:
			profile.enterprise_name = enterprise_name
		if location is not None:
			profile.location = location
		if about is not None:
			profile.about = about
		if profile_image is not None:
			profile.profile_image = profile_image
		profile.save(ignore_permissions=True)

	frappe.db.commit()
	return {"success": True}


@frappe.whitelist()
def get_seller_public_profile(seller: str) -> dict:
	"""Return public profile of a seller (for buyers to view)."""
	if not frappe.db.exists("User", seller):
		frappe.throw("Seller not found.")

	user = frappe.get_doc("User", seller)
	result: dict = {
		"full_name": user.full_name or "",
		"user_image": user.user_image or "",
	}

	if frappe.db.exists("Reverto Seller Profile", seller):
		profile = frappe.get_doc("Reverto Seller Profile", seller)
		result.update(
			{
				"enterprise_name": profile.enterprise_name or "",
				"location": profile.location or "",
				"about": profile.about or "",
				"avg_rating": float(profile.avg_rating or 0),
				"rating_count": int(profile.rating_count or 0),
				"profile_image": profile.profile_image or user.user_image or "",
			}
		)

	return result


# ---------------------------------------------------------------------------
# Ratings
# ---------------------------------------------------------------------------


@frappe.whitelist()
def rate_seller(enquiry_id: str, score: int, comment: Optional[str] = None) -> dict:
	"""Buyer rates seller after an accepted enquiry."""
	enquiry = frappe.get_doc("Reverto Enquiry", enquiry_id)

	if frappe.session.user != enquiry.buyer:
		frappe.throw("Only the buyer can rate this enquiry.", frappe.PermissionError)

	if enquiry.status not in ("Accepted", "Closed"):
		frappe.throw("You can only rate after the deal is accepted.")

	# Prevent duplicate ratings
	if frappe.db.exists(
		"Reverto Rating", {"enquiry": enquiry_id, "buyer": frappe.session.user}
	):
		frappe.throw("You have already rated this enquiry.")

	score = int(score)
	if score < 1 or score > 5:
		frappe.throw("Score must be between 1 and 5.")

	rating = frappe.get_doc(
		{
			"doctype": "Reverto Rating",
			"enquiry": enquiry_id,
			"buyer": frappe.session.user,
			"seller": enquiry.seller,
			"score": score,
			"comment": comment or "",
		}
	)
	rating.insert(ignore_permissions=True)

	# Recompute avg_rating on the seller profile
	profile = _get_or_create_profile(enquiry.seller)
	all_ratings = frappe.get_all(
		"Reverto Rating",
		filters={"seller": enquiry.seller},
		fields=["score"],
		ignore_permissions=True,
	)
	total = sum(r.score for r in all_ratings)
	count = len(all_ratings)
	profile.avg_rating = round(total / count, 2) if count else 0
	profile.rating_count = count
	profile.save(ignore_permissions=True)

	frappe.db.commit()
	return {"success": True, "avg_rating": profile.avg_rating, "rating_count": count}


@frappe.whitelist()
def get_my_rating_for_enquiry(enquiry_id: str) -> dict:
	"""Returns the current buyer's rating for an enquiry, if it exists."""
	existing = frappe.db.get_value(
		"Reverto Rating",
		{"enquiry": enquiry_id, "buyer": frappe.session.user},
		["score", "comment"],
		as_dict=True,
	)
	if existing:
		return {"rated": True, "score": existing.score, "comment": existing.comment or ""}
	return {"rated": False}
