import { MapPin, Eye, MessageSquare, Bookmark } from "lucide-react";

interface WasteCardProps {
  image: string;
  wasteType: string;
  quantity: string;
  price: string;
  sellerType: "Industry" | "Individual";
  distance: string;
  title: string;
}

export function WasteCard({
  image,
  wasteType,
  quantity,
  price,
  sellerType,
  distance,
  title,
}: WasteCardProps) {
  const isFree = price === "Free";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isFree 
              ? "bg-emerald-500 text-white" 
              : "bg-white/90 text-gray-800"
          }`}>
            {price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Waste Type Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded">
            {wasteType}
          </span>
          <span className="text-xs text-gray-500">{sellerType}</span>
        </div>

        {/* Title */}
        <h3 className="text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        {/* Quantity and Distance */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span className="font-medium">{quantity}</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{distance}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            View details
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
