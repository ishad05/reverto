import { useState } from "react";
import { MapPin, MessageSquare, Bookmark, ShoppingCart, Check, Minus, Plus, Zap } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useCart } from "../context/CartContext";
import { PaymentModal } from "./PaymentModal";
import type { PaymentLine } from "./PaymentModal";
import { ProductDetailsModal } from "./ProductDetailsModal";

interface WasteCardProps {
  productId: string;
  image: string;
  title: string;
  quantity?: string;
  rawQuantityKg?: number;
  pricePerQuantity?: string;
  rawPricePerKg?: number;
  status?: string;
  wasteType?: string;
  sellerType?: string;
  distance?: string;
  owner?: string;
  onPurchaseSuccess?: () => void;
  onEnquire?: (productId: string, quantityKg: number) => void;
}

export function WasteCard({
  productId,
  image,
  title,
  quantity,
  rawQuantityKg,
  pricePerQuantity,
  rawPricePerKg,
  status,
  wasteType,
  sellerType,
  distance,
  owner,
  onPurchaseSuccess,
  onEnquire,
}: WasteCardProps) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.id === productId);

  const maxQty = rawQuantityKg ?? 1;
  const [selectedQty, setSelectedQty] = useState(maxQty);
  const [buyOpen, setBuyOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isFree =
    !pricePerQuantity || pricePerQuantity.toLowerCase().includes("free");

  const canAddToCart =
    !isFree &&
    rawPricePerKg != null &&
    rawPricePerKg > 0 &&
    rawQuantityKg != null &&
    rawQuantityKg > 0;

  const changeQty = (delta: number) => {
    setSelectedQty((prev) => Math.min(Math.max(1, prev + delta), maxQty));
  };

  const handleQtyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setSelectedQty(Math.min(Math.max(1, val), maxQty));
  };

  const handleAddToCart = () => {
    if (!canAddToCart || inCart) return;
    addItem({
      id: productId,
      title,
      pricePerKg: rawPricePerKg!,
      quantityKg: selectedQty,
      availableKg: maxQty,
      wasteType: wasteType ?? "Other",
      image,
    });
  };

  const directPaymentLines: PaymentLine[] = canAddToCart
    ? [
        {
          productName: title,
          quantityKg: selectedQty,
          pricePerKg: rawPricePerKg!,
          image,
        },
      ]
    : [];

  return (
    <>
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
          {/* Live inventory badge */}
          {rawQuantityKg != null && rawQuantityKg > 0 && !isFree && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                {rawQuantityKg} kg left
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {wasteType ?? "E-waste"}
            </span>
            <span className="text-xs text-gray-500">{sellerType ?? "Industry"}</span>
          </div>

          <h3 className="text-gray-900 line-clamp-2 min-h-[3rem]">{title}</h3>

          {(quantity || status) && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-medium">
                {quantity ? `Available: ${quantity}` : "Quantity not specified"}
              </span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{distance ?? "2.3 km"}</span>
              </div>
            </div>
          )}

          {/* Quantity stepper — only shown when item can be added and is not yet in cart */}
          {canAddToCart && !inCart && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 mr-auto">Qty (kg)</span>
              <button
                onClick={() => changeQty(-1)}
                disabled={selectedQty <= 1}
                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={selectedQty}
                onChange={handleQtyInput}
                className="w-16 text-center text-sm font-medium border border-gray-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => changeQty(1)}
                disabled={selectedQty >= maxQty}
                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* In-cart indicator showing selected qty */}
          {inCart && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{selectedQty} kg added to cart</span>
            </div>
          )}

          {/* Primary CTA row — Buy Now + Enquire */}
          {canAddToCart && (
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                size="sm"
                onClick={() => setBuyOpen(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                onClick={() => onEnquire?.(productId, selectedQty)}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Enquire
              </Button>
            </div>
          )}

          {/* Secondary row */}
          <div className="flex items-center gap-2">
            <Button className="flex-1" size="sm" variant="outline" onClick={() => setDetailsOpen(true)}>
              View details
            </Button>
            {canAddToCart && !inCart && (
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={handleAddToCart}
                title="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" className="border-gray-300 text-gray-700">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Direct purchase modal */}
      {canAddToCart && (
        <PaymentModal
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
          lines={directPaymentLines}
          directPurchase={{ productId, quantityKg: selectedQty }}
          onSuccess={() => {
            setBuyOpen(false);
            onPurchaseSuccess?.();
          }}
        />
      )}

      {/* Product details modal */}
      <ProductDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        productId={productId}
        image={image}
        title={title}
        category={wasteType}
        rawQuantityKg={rawQuantityKg}
        rawPricePerKg={rawPricePerKg}
        status={status}
        owner={owner ?? ""}
        selectedQty={selectedQty}
        onBuyNow={() => setBuyOpen(true)}
      />
    </>
  );
}
