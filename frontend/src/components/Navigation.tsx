import { Search, MapPin, Bell, User } from "lucide-react";
import logo from "../../public/reverto_logo1.svg";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="ReVerto Logo" className="w-24" />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search waste by type or keyword"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Bangalore East</span>
            </button>

            {/* Notification Icon */}
            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <button className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
              <User className="w-5 h-5 text-emerald-700" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
