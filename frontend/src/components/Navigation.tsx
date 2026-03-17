import { Search, MapPin, Bell, User, X, ShoppingCart, MessageSquare, ShoppingBag } from "lucide-react";
import logo from "../../public/reverto_logo1.svg";
import { useCart } from "../context/CartContext";

interface SellerTabsProps {
  currentTab: "listings" | "marketplace";
  onListings: () => void;
  onMarketplace: () => void;
}

interface NavigationProps {
  onProfileClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sellerTabs?: SellerTabsProps;
  onEnquiriesClick?: () => void;
  enquiryBadge?: number;
  onOrdersClick?: () => void;
  ordersBadge?: number;
}

export function Navigation({
  onProfileClick,
  searchQuery = "",
  onSearchChange,
  sellerTabs,
  onEnquiriesClick,
  enquiryBadge = 0,
  onOrdersClick,
  ordersBadge = 0,
}: NavigationProps) {
  const { totalItems, openCart } = useCart();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="ReVerto Logo" className="w-24" />
          </div>

          {/* Center: seller tabs OR buyer search bar */}
          {sellerTabs ? (
            <div className="flex items-center gap-1">
              <button
                onClick={sellerTabs.onListings}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sellerTabs.currentTab === "listings"
                    ? "text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                My Listings
              </button>
              <button
                onClick={sellerTabs.onMarketplace}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sellerTabs.currentTab === "marketplace"
                    ? "text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search waste by name"
                  className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span className="text-sm">Bangalore East</span>
            </button>

            <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            {onEnquiriesClick && (
              <button
                onClick={onEnquiriesClick}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="My enquiries"
              >
                <MessageSquare className="w-6 h-6" />
                {enquiryBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold px-1">
                    {enquiryBadge > 99 ? "99+" : enquiryBadge}
                  </span>
                )}
              </button>
            )}

            {onOrdersClick && (
              <button
                onClick={onOrdersClick}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="My orders"
              >
                <ShoppingBag className="w-6 h-6" />
                {ordersBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold px-1">
                    {ordersBadge > 99 ? "99+" : ordersBadge}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold px-1">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
              title="View profile"
            >
              <User className="w-5 h-5 text-emerald-700" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
