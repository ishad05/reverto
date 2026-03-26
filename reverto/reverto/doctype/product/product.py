# Copyright (c) 2026, Isha Dewangan and contributors
# For license information, please see license.txt

from frappe.model.document import Document

from reverto.api.products import _parse_coords_from_url


class Product(Document):
	def before_save(self):
		if self.has_value_changed("location_url"):
			self._fetch_coords_from_location_url()

	def _fetch_coords_from_location_url(self):
		lat, lng = _parse_coords_from_url(self.location_url or "")
		self.latitude = lat
		self.longitude = lng
