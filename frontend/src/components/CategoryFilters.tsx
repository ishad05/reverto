/* eslint-disable react-refresh/only-export-components */
import {
  Droplet,
  Laptop,
  Hammer,
  FileText,
  Leaf,
  Building2,
  Shirt,
  Wine,
} from "lucide-react";

export const categories = [
  { id: "plastic", name: "Plastic", value: "Plastic", icon: Droplet },
  { id: "ewaste", name: "E-waste", value: "E-waste", icon: Laptop },
  { id: "metal", name: "Metal", value: "Metal", icon: Hammer },
  { id: "paper", name: "Paper", value: "Paper", icon: FileText },
  { id: "organic", name: "Organic", value: "Organic", icon: Leaf },
  { id: "construction", name: "Construction", value: "Construction", icon: Building2 },
  { id: "textile", name: "Textile", value: "Textile", icon: Shirt },
  { id: "glass", name: "Glass", value: "Glass", icon: Wine },
];


interface CategoryFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(isSelected ? null : category.value)}
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
      </div>
    </div>
  );
}
