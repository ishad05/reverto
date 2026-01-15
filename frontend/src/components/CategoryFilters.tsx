import { useState } from "react";
import { 
  Droplet, 
  Laptop, 
  Hammer, 
  FileText, 
  Leaf, 
  Building2, 
  Shirt, 
  Wine,
  MapPin,
  DollarSign,
  Package,
  Truck
} from "lucide-react";

const categories = [
  { id: "plastic", name: "Plastic", icon: Droplet },
  { id: "ewaste", name: "E-waste", icon: Laptop },
  { id: "metal", name: "Metal", icon: Hammer },
  { id: "paper", name: "Paper", icon: FileText },
  { id: "organic", name: "Organic", icon: Leaf },
  { id: "construction", name: "Construction", icon: Building2 },
  { id: "textile", name: "Textile", icon: Shirt },
  { id: "glass", name: "Glass", icon: Wine },
];

const additionalFilters = [
  { id: "distance", name: "Distance", icon: MapPin },
  { id: "price", name: "Price", icon: DollarSign },
  { id: "quantity", name: "Quantity", icon: Package },
  { id: "pickup", name: "Pickup Type", icon: Truck },
];

export function CategoryFilters() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (filterId: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(filterId)) {
      newFilters.delete(filterId);
    } else {
      newFilters.add(filterId);
    }
    setSelectedFilters(newFilters);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Additional Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-gray-500 whitespace-nowrap mr-2">Filters:</span>
          {additionalFilters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedFilters.has(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{filter.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}