# Copyright (c) 2026, Isha Dewangan and Contributors
# See license.txt

import unittest
from unittest.mock import patch

from frappe.tests import IntegrationTestCase

from reverto.api.products import _parse_coords_from_url, _resolve_short_url


EXTRA_TEST_RECORD_DEPENDENCIES = []
IGNORE_TEST_RECORD_DEPENDENCIES = []


# ---------------------------------------------------------------------------
# Pure-function unit tests — no database needed
# ---------------------------------------------------------------------------

class TestParseCoordsFromUrl(unittest.TestCase):
	"""Unit tests for _parse_coords_from_url."""

	# ── Full Google Maps URLs ────────────────────────────────────────────────

	def test_google_maps_place_url(self):
		url = "https://www.google.com/maps/place/Bangalore/@12.9715987,77.5945627,11z"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, 12.9715987, places=4)
		self.assertAlmostEqual(lng, 77.5945627, places=4)

	def test_google_maps_q_param(self):
		url = "https://maps.google.com/?q=12.9716,77.5946"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, 12.9716, places=4)
		self.assertAlmostEqual(lng, 77.5946, places=4)

	def test_google_maps_query_param(self):
		"""Newer Google Maps search URLs use ?query= instead of ?q=."""
		url = "https://www.google.com/maps/search/?api=1&query=12.9716,77.5946"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, 12.9716, places=4)
		self.assertAlmostEqual(lng, 77.5946, places=4)

	def test_google_maps_ll_param(self):
		url = "https://maps.google.com/?ll=12.9716,77.5946&z=15"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, 12.9716, places=4)
		self.assertAlmostEqual(lng, 77.5946, places=4)

	def test_openstreetmap(self):
		url = "https://www.openstreetmap.org/#map=15/12.9716/77.5946"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, 12.9716, places=4)
		self.assertAlmostEqual(lng, 77.5946, places=4)

	def test_bare_coordinates(self):
		lat, lng = _parse_coords_from_url("12.9716, 77.5946")
		self.assertAlmostEqual(lat, 12.9716, places=4)
		self.assertAlmostEqual(lng, 77.5946, places=4)

	def test_negative_coordinates(self):
		url = "https://www.google.com/maps/place/Sydney/@-33.8688197,151.2092955,14z"
		lat, lng = _parse_coords_from_url(url)
		self.assertAlmostEqual(lat, -33.8688197, places=4)
		self.assertAlmostEqual(lng, 151.2092955, places=4)

	def test_empty_url(self):
		self.assertEqual(_parse_coords_from_url(""), (None, None))

	def test_whitespace_url(self):
		self.assertEqual(_parse_coords_from_url("   "), (None, None))

	def test_unrecognised_url(self):
		self.assertEqual(_parse_coords_from_url("https://example.com/no/coords/here"), (None, None))

	# ── Short URL handling ───────────────────────────────────────────────────

	def test_short_url_calls_resolver(self):
		"""_parse_coords_from_url must call _resolve_short_url for goo.gl links."""
		resolved = "https://www.google.com/maps/place/Bengaluru/@12.9715987,77.5945627,11z/data=abc"
		with patch("reverto.api.products._resolve_short_url", return_value=resolved) as mock_resolve:
			lat, lng = _parse_coords_from_url("https://maps.app.goo.gl/2SEWhzhxNhCrb9cC8")
			mock_resolve.assert_called_once()
			self.assertAlmostEqual(lat, 12.9715987, places=4)
			self.assertAlmostEqual(lng, 77.5945627, places=4)

	def test_short_url_goo_gl(self):
		resolved = "https://www.google.com/maps/place/London/@51.5074,0.1278,12z"
		with patch("reverto.api.products._resolve_short_url", return_value=resolved):
			lat, lng = _parse_coords_from_url("https://goo.gl/maps/abc123")
			self.assertAlmostEqual(lat, 51.5074, places=3)
			self.assertAlmostEqual(lng, 0.1278, places=3)

	def test_short_url_resolution_failure_returns_none(self):
		"""If resolution fails (network error), return None gracefully — don't crash."""
		# Simulate resolution failure: URL unchanged so no pattern matches
		with patch("reverto.api.products._resolve_short_url", return_value="https://maps.app.goo.gl/2SEWhzhxNhCrb9cC8"):
			lat, lng = _parse_coords_from_url("https://maps.app.goo.gl/2SEWhzhxNhCrb9cC8")
			self.assertIsNone(lat)
			self.assertIsNone(lng)


# ---------------------------------------------------------------------------
# Diagnostic / integration tests — require network access
# ---------------------------------------------------------------------------

class TestResolveShortUrl(unittest.TestCase):
	"""Diagnostic tests that actually hit the network to verify redirect resolution."""

	def test_resolve_maps_app_goo_gl(self):
		"""Follow the redirect for the real example URL and print the result."""
		short = "https://maps.app.goo.gl/2SEWhzhxNhCrb9cC8"
		resolved = _resolve_short_url(short)
		print(f"\n[diagnostic] resolved URL: {resolved}")
		# Resolution should return something different from the input
		self.assertNotEqual(
			resolved,
			short,
			"Resolution returned the original URL — the HTTP redirect was not followed",
		)

	def test_full_pipeline_short_url(self):
		"""End-to-end: short URL → resolve → parse coordinates."""
		lat, lng = _parse_coords_from_url("https://maps.app.goo.gl/2SEWhzhxNhCrb9cC8")
		print(f"\n[diagnostic] parsed coords: lat={lat}, lng={lng}")
		self.assertIsNotNone(lat, "lat should not be None — check _resolve_short_url output above")
		self.assertIsNotNone(lng, "lng should not be None — check _resolve_short_url output above")


class IntegrationTestProduct(IntegrationTestCase):
	"""Integration tests for Product."""
	pass
