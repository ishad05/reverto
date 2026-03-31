import { useEffect, useMemo, useState } from "react";
import { Grid3X3, MapPin, RefreshCcw } from "lucide-react";
import { useFrappeAuth, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { CategoryFilters, categories } from "./components/CategoryFilters";
import { WasteCard } from "./components/WasteCard";
import { CartDrawer } from "./components/CartDrawer";
import { SustainabilityWidget } from "./components/SustainabilityWidget";
import { Footer } from "./components/Footer";
import { ProfilePage } from "./components/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { SellerDashboard } from "./pages/SellerDashboard";
import { CartProvider } from "./context/CartContext";
import { BuyerEnquiriesDrawer } from "./components/BuyerEnquiriesDrawer";
import { MyOrdersDrawer } from "./components/MyOrdersDrawer";
import { ProductMap, type MapProduct } from "./components/ProductMap";
import { PaymentModal } from "./components/PaymentModal";

type AppPage = "home" | "login" | "signup" | "profile" | "seller-dashboard";

type ProductSummary = {
  name: string;
  product_name: string;
  category?: string | null;
  quantity?: number | null;
  price_per_quantity?: number | null;
  status?: string;
  product_image?: string | null;
  owner?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_url?: string | null;
};

type FrappeResponse<T> = {
  message: T;
};

// ---------------------------------------------------------------------------
// Marketplace (buyers + sellers browsing)
// ---------------------------------------------------------------------------

interface MarketplaceProps {
  onProfile: () => void;
  sellerTabs?: {
    onMyListings: () => void;
  };
}

function Marketplace({ onProfile, sellerTabs }: MarketplaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enquiriesOpen, setEnquiriesOpen] = useState(false);
  const [enquiryOpenChatId, setEnquiryOpenChatId] = useState<string | null>(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [mapBuyProduct, setMapBuyProduct] = useState<MapProduct | null>(null);

  const { call: createEnquiry } = useFrappePostCall<{ message: { enquiry_id: string } }>(
    "reverto.api.enquiry.create_enquiry",
  );

  const { data: enquiriesData } = useFrappeGetCall<
    FrappeResponse<{ status: string }[]>
  >("reverto.api.enquiry.get_buyer_enquiries", {}, undefined, {
    refreshInterval: 15000,
  });
  const enquiryBadge = (enquiriesData?.message ?? []).filter(
    (e) => e.status === "Open" || e.status === "Negotiating",
  ).length;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error, mutate: mutateProducts } = useFrappeGetCall<
    FrappeResponse<ProductSummary[]>
  >("reverto.api.products.list_products", {
    limit: 50,
    ...(selectedCategory ? { category: selectedCategory } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const productsRaw = data?.message;
  const products = useMemo(() => productsRaw ?? [], [productsRaw]);

  const listingCount = products.length;
  const sellerCount = useMemo(
    () =>
      new Set(
        products
          .map((p) => p.owner || "")
          .filter((o) => o && o !== "Guest"),
      ).size,
    [products],
  );

  const selectedCategoryLabel = selectedCategory
    ? (categories.find((c) => c.value === selectedCategory)?.name ??
      selectedCategory)
    : null;

  const headingLabel = (() => {
    if (debouncedSearch && selectedCategoryLabel)
      return `"${debouncedSearch}" in ${selectedCategoryLabel}`;
    if (debouncedSearch) return `Results for "${debouncedSearch}"`;
    if (selectedCategoryLabel) return `${selectedCategoryLabel} Listings`;
    return "Available Listings";
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <CartDrawer />
      <BuyerEnquiriesDrawer
        isOpen={enquiriesOpen}
        onClose={() => setEnquiriesOpen(false)}
        onPaymentSuccess={() => setOrdersRefreshKey((k) => k + 1)}
        openChatId={enquiryOpenChatId}
      />
      <MyOrdersDrawer
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        refreshKey={ordersRefreshKey}
      />
      {mapBuyProduct && (
        <PaymentModal
          open={!!mapBuyProduct}
          onClose={() => setMapBuyProduct(null)}
          lines={[{
            productName: mapBuyProduct.product_name,
            quantityKg: mapBuyProduct.quantity ?? 1,
            pricePerKg: mapBuyProduct.price_per_quantity ?? 0,
            image: mapBuyProduct.product_image ?? undefined,
          }]}
          directPurchase={{
            productId: mapBuyProduct.name,
            quantityKg: mapBuyProduct.quantity ?? 1,
          }}
          onSuccess={() => {
            setMapBuyProduct(null);
            mutateProducts();
            setOrdersRefreshKey((k) => k + 1);
          }}
        />
      )}
      <Navigation
        onProfileClick={onProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEnquiriesClick={() => setEnquiriesOpen(true)}
        enquiryBadge={enquiryBadge}
        onOrdersClick={() => setOrdersOpen(true)}
        sellerTabs={
          sellerTabs
            ? {
                currentTab: "marketplace",
                onListings: sellerTabs.onMyListings,
                onMarketplace: () => {},
              }
            : undefined
        }
      />
      <Hero listingCount={listingCount} sellerCount={sellerCount} />
      <CategoryFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">{headingLabel}</h2>

          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === "map"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {viewMode === "grid" ? (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse"
                      />
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-white rounded-xl border border-red-100 p-6 text-center text-sm text-red-700">
                    <p className="font-medium mb-1">
                      Unable to load listings from the server.
                    </p>
                    <p className="text-red-600/80">
                      {error.message ??
                        "Please check your Frappe backend URL and try again."}
                    </p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product, index) => {
                      const sellerType =
                        product.owner && product.owner !== "Guest"
                          ? "Industry"
                          : "Individual";
                      const distanceKm = 1.5 + (index % 7) * 0.9;
                      return (
                        <WasteCard
                          key={product.name}
                          productId={product.name}
                          image={product.product_image || ""}
                          title={product.product_name}
                          quantity={
                            product.quantity != null
                              ? `${product.quantity} kg`
                              : undefined
                          }
                          rawQuantityKg={product.quantity ?? undefined}
                          pricePerQuantity={
                            product.price_per_quantity != null
                              ? `₹${product.price_per_quantity}/kg`
                              : undefined
                          }
                          rawPricePerKg={product.price_per_quantity ?? undefined}
                          status={product.status}
                          wasteType={product.category ?? "Other"}
                          sellerType={sellerType}
                          distance={`${distanceKm.toFixed(1)} km`}
                          owner={product.owner}
                          onPurchaseSuccess={() => {
                            mutateProducts();
                            setOrdersRefreshKey((k) => k + 1);
                          }}
                          onEnquire={async (productId, quantityKg) => {
                            const result = await createEnquiry({ product_id: productId, quantity_kg: quantityKg });
                            const enquiryId = result?.message?.enquiry_id;
                            setEnquiriesOpen(true);
                            if (enquiryId) setEnquiryOpenChatId(enquiryId);
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <Grid3X3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      No listings found
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      {debouncedSearch && selectedCategoryLabel
                        ? `No ${selectedCategoryLabel.toLowerCase()} listings match "${debouncedSearch}". Try a different keyword or category.`
                        : debouncedSearch
                          ? `No listings match "${debouncedSearch}". Try a different keyword or clear the search.`
                          : selectedCategoryLabel
                            ? `There are no available ${selectedCategoryLabel.toLowerCase()} listings right now. Try another category or check back soon.`
                            : "Once sellers start listing their waste, you'll see available materials here."}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[600px]">
                <ProductMap
                  products={products}
                  onEnquire={async (productId, quantity) => {
                    await createEnquiry({ product_id: productId, quantity_kg: quantity });
                    setEnquiriesOpen(true);
                  }}
                  onBuyNow={(product) => setMapBuyProduct(product)}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <SustainabilityWidget />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export default function App() {
  const { currentUser, isLoading: authLoading } = useFrappeAuth();
  const [page, setPage] = useState<AppPage | null>(null);

  const isLoggedIn = Boolean(currentUser && currentUser !== "Guest");

  // Fetch account type once authenticated
  const { data: profileData, isLoading: profileLoading } =
    useFrappeGetCall<FrappeResponse<{ account_type: string; first_name: string }>>(
      "reverto.api.auth.get_user_profile",
      {},
      isLoggedIn ? undefined : null, // skip fetch for guests
    );

  // Show loading until both auth and profile are resolved
  const isLoading = authLoading || (isLoggedIn && profileLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-emerald-600">
          <RefreshCcw className="w-8 h-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  const accountType = profileData?.message?.account_type ?? "Buyer";
  const firstName = profileData?.message?.first_name ?? "";
  const isSeller = accountType === "Seller";

  const defaultPage: AppPage = isSeller ? "seller-dashboard" : "home";

  const effectivePage: AppPage = (() => {
    if (page === null) return isLoggedIn ? defaultPage : "login";
    if (!isLoggedIn && (page === "home" || page === "profile" || page === "seller-dashboard"))
      return "login";
    return page;
  })();

  if (effectivePage === "signup") {
    return <SignupPage onNavigateToLogin={() => setPage("login")} />;
  }

  if (effectivePage === "login") {
    return (
      <LoginPage
        onNavigateToSignup={() => setPage("signup")}
      />
    );
  }

  if (effectivePage === "profile") {
    return <ProfilePage onBack={() => setPage(defaultPage)} />;
  }

  return (
    <CartProvider>
      {effectivePage === "seller-dashboard" ? (
        <SellerDashboard
          firstName={firstName}
          onProfile={() => setPage("profile")}
          onBrowseMarketplace={() => setPage("home")}
        />
      ) : (
        <Marketplace
          onProfile={() => setPage("profile")}
          sellerTabs={
            isSeller ? { onMyListings: () => setPage("seller-dashboard") } : undefined
          }
        />
      )}
    </CartProvider>
  );
}
