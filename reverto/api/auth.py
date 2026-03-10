from __future__ import annotations

import frappe
from frappe.utils.password import update_password


@frappe.whitelist(allow_guest=True)
def signup(
    full_name: str,
    email: str,
    phone: str,
    account_type: str,
    password: str,
) -> dict:
    """Create a new Reverto user account."""

    if not full_name or not email or not password:
        frappe.throw("Full name, email, and password are required.")

    if frappe.db.exists("User", {"email": email}):
        frappe.throw("An account with this email already exists.")

    names = full_name.strip().split(" ", 1)
    user = frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": names[0],
            "last_name": names[1] if len(names) > 1 else "",
            "mobile_no": phone,
            "enabled": 1,
            "send_welcome_email": 0,
        }
    )
    user.flags.ignore_permissions = True
    user.flags.ignore_links = True
    user.insert(ignore_permissions=True)

    update_password(user=email, pwd=password)
    frappe.db.commit()

    return {"message": "Account created successfully. You can now sign in."}
