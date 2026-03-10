import { MapPin, MessageSquare, Bookmark } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface WasteCardProps {
  image: string;
  title: string;
  quantity?: string;
  pricePerQuantity?: string;
  status?: string;
  wasteType?: string;
  sellerType?: string;
  distance?: string;
}

export function WasteCard({
  image,
  quantity,
  title,
  pricePerQuantity,
  status,
  wasteType,
  sellerType,
  distance,
}: WasteCardProps) {
  const isFree =
    !pricePerQuantity || pricePerQuantity.toLowerCase().includes("free");

  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
        {pricePerQuantity && (
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isFree
                  ? "bg-emerald-500 text-white"
                  : "bg-white/90 text-gray-800"
              }`}
            >
              {pricePerQuantity}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            {wasteType ?? "E-waste"}
          </span>
          <span className="text-xs text-gray-500">
            {sellerType ?? "Industry"}
          </span>
        </div>

        <h3 className="text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        {(quantity || status) && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">
              {quantity ? quantity : "Quantity not specified"}
            </span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{distance ?? "2.3 km"}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button className="flex-1" size="sm">
            View details
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-gray-300 text-gray-700"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-gray-300 text-gray-700"
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
