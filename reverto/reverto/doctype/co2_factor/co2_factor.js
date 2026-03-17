// Copyright (c) 2026, Isha Dewangan and contributors
// For license information, please see license.txt

frappe.ui.form.on("CO2 Factor", {
	refresh(frm) {
		frm.set_intro(
			"This factor determines how many kg of CO₂ is considered saved per kg of waste recycled " +
			"for this category. Update it here whenever new research is published — no code change needed.",
			"blue"
		);
	},
});
