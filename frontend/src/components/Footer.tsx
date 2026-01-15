import logo from "../../public/reverto_logo1.svg";

export function Footer() {
  const links = [
    { name: "About", href: "#" },
    { name: "How it works", href: "#" },
    { name: "Safety guidelines", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Terms", href: "#" },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <img src={logo} alt="ReVerto Logo" className="w-24" />
            <span className="text-gray-500 text-sm">
              Sustainable Waste Marketplace
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © 2026 Reverto. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
