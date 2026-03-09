import { useMemo, useState } from "react";
import { Map, Grid3X3 } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { CategoryFilters } from "./components/CategoryFilters";
import { WasteCard } from "./components/WasteCard";
import { SustainabilityWidget } from "./components/SustainabilityWidget";
import { Footer } from "./components/Footer";
type ProductSummary = {
  name: string;
  product_name: string;
  quantity?: number | null;
  price_per_quantity?: number | null;
  status?: string;
  product_image?: string | null;
};

type FrappeResponse<T> = {
  message: T;
};

export default function App() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data, isLoading, error } = useFrappeGetCall<FrappeResponse<
    ProductSummary[]
  >>(
    "reverto.api.products.list_products",
    { limit: 50 },
  );

  const products = data?.message ?? [];

  const listingCount = products?.length ?? 0;
  const sellerCount = useMemo(
    () => (products ? new Set(products.map((p) => p.name)).size : 0),
    [products],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero listingCount={listingCount || undefined} sellerCount={sellerCount || undefined} />
      <CategoryFilters />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Available Listings</h2>

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
              <Map className="w-4 h-4" />
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
                      {error.message ?? "Please check your Frappe backend URL and try again."}
                    </p>
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <WasteCard
                        key={product.name}
                        image={product.product_image || ""}
                        title={product.product_name}
                        quantity={
                          product.quantity != null
                            ? `${product.quantity} kg`
                            : undefined
                        }
                        pricePerQuantity={
                          product.price_per_quantity != null
                            ? `₹${product.price_per_quantity}/kg`
                            : undefined
                        }
                        status={product.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                      <Grid3X3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      No listings yet
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      Once sellers start listing their waste, you’ll see
                      available materials here. Check back soon or create a
                      listing if you have waste to offer.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Map className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Map view coming soon</p>
                  <p className="text-sm mt-2">
                    Interactive map showing waste locations
                  </p>
                </div>
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
