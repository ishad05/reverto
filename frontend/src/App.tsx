import { useState } from "react";
import { Map, Grid3X3 } from "lucide-react";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { CategoryFilters } from "./components/CategoryFilters";
import { WasteCard } from "./components/WasteCard";
import { SustainabilityWidget } from "./components/SustainabilityWidget";
import { Footer } from "./components/Footer";

const wasteListings = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1606037150583-fb842a55bae7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwd2FzdGUlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY4MjMyMzUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Plastic",
    quantity: "250 kg",
    price: "₹15/kg",
    sellerType: "Industry" as const,
    distance: "2.3 km",
    title: "Clean HDPE plastic waste - Industrial grade",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1728610996980-bb247b031477?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwd2FzdGUlMjBld2FzdGV8ZW58MXx8fHwxNzY4MjMyMzUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "E-waste",
    quantity: "50 units",
    price: "Free",
    sellerType: "Individual" as const,
    distance: "4.1 km",
    title: "Old computer components and cables",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXRhbCUyMHNjcmFwJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2ODIzMjM1NHww&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Metal",
    quantity: "1.2 tons",
    price: "₹42/kg",
    sellerType: "Industry" as const,
    distance: "5.7 km",
    title: "Scrap metal from manufacturing - Aluminum & Steel",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1717667745830-de42bb75a4fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkYm9hcmQlMjBwYXBlciUyMHdhc3RlfGVufDF8fHx8MTc2ODIzMjM1NHww&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Paper",
    quantity: "500 kg",
    price: "₹8/kg",
    sellerType: "Industry" as const,
    distance: "1.8 km",
    title: "Cardboard boxes and office paper waste",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1752741177226-d4d595d8c517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwY29tcG9zdCUyMHdhc3RlfGVufDF8fHx8MTc2ODIzMjM1Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Organic",
    quantity: "80 kg",
    price: "Free",
    sellerType: "Individual" as const,
    distance: "0.9 km",
    title: "Garden waste and kitchen scraps for composting",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1653202143301-7fb80a90010c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBkZWJyaXMlMjB3YXN0ZXxlbnwxfHx8fDE3NjgyMzIzNTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Construction",
    quantity: "3 tons",
    price: "₹5/kg",
    sellerType: "Industry" as const,
    distance: "8.2 km",
    title: "Concrete debris and construction materials",
  },
  {
    id: 7,
    image:
      "https://images.unsplash.com/photo-1691430597864-46000b0549df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0aWxlJTIwZmFicmljJTIwd2FzdGV8ZW58MXx8fHwxNzY4MjMyMzU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Textile",
    quantity: "120 kg",
    price: "₹12/kg",
    sellerType: "Industry" as const,
    distance: "3.5 km",
    title: "Fabric scraps from garment manufacturing",
  },
  {
    id: 8,
    image:
      "https://images.unsplash.com/photo-1554208873-4292cf6c952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJvdHRsZXMlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY4MjMyMzU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Glass",
    quantity: "300 kg",
    price: "₹6/kg",
    sellerType: "Individual" as const,
    distance: "2.7 km",
    title: "Glass bottles and jars - Sorted and cleaned",
  },
  {
    id: 9,
    image:
      "https://images.unsplash.com/photo-1606037150583-fb842a55bae7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwd2FzdGUlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY4MjMyMzUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    wasteType: "Plastic",
    quantity: "180 kg",
    price: "Free",
    sellerType: "Individual" as const,
    distance: "6.4 km",
    title: "Mixed plastic containers from household",
  },
];

export default function App() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {wasteListings.map((listing) => (
                  <WasteCard key={listing.id} {...listing} />
                ))}
              </div>
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
