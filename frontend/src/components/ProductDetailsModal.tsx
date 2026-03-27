import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  MapPin,
  Star,
  Building2,
  User,
  Package,
  Tag,
  Scale,
  Zap,
  MessageSquare,
  BadgeCheck,
} from "lucide-react";

interface SellerPublicProfile {
  full_name: string;
  user_image: string;
  enterprise_name?: string;
  location?: string;
  about?: string;
  avg_rating?: number;
  rating_count?: number;
  profile_image?: string;
}

interface FrappeResp<T> {
  message: T;
}

interface ProductDetailsModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  image: string;
  title: string;
  category?: string;
  rawQuantityKg?: number;
  rawPricePerKg?: number;
  status?: string;
  owner: string;
  /** Set to false when the viewer is the seller (no buy CTA) */
  canBuy?: boolean;
  selectedQty?: number;
  onBuyNow?: () => void;
  onEnquire?: () => void;
}

function StarRating({ score, count }: { score: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= Math.round(score)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {score.toFixed(1)} ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

export function ProductDetailsModal({
  open,
  onClose,
  image,
  title,
  category,
  rawQuantityKg,
  rawPricePerKg,
  status,
  owner,
  canBuy = true,
  selectedQty,
  onBuyNow,
  onEnquire,
}: ProductDetailsModalProps) {
  const isGuest = !owner || owner === "Guest" || owner === "";
  const { data: sellerData, isLoading: sellerLoading } = useFrappeGetCall<
    FrappeResp<SellerPublicProfile>
  >(
    "reverto.api.profile.get_seller_public_profile",
    isGuest ? undefined : { seller: owner },
    isGuest ? null : `seller-profile-${owner}`,
  );

  const seller = sellerData?.message;

  const isSoldOut = status && status !== "Available";
  const isFree = !rawPricePerKg || rawPricePerKg === 0;
  const showBuyCTA = canBuy && !isSoldOut && !isFree;
  const showEnquireCTA = canBuy && !isSoldOut;

  const displayQty = selectedQty ?? rawQuantityKg;
  const totalPrice =
    displayQty && rawPricePerKg ? displayQty * rawPricePerKg : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">
        {/* Product image */}
        <div className="relative w-full h-56 bg-gray-100 flex-shrink-0">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-12 h-12" />
            </div>
          )}
          {/* Status badge overlay */}
          {status && status !== "Available" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="px-4 py-2 bg-white/90 rounded-full text-sm font-semibold text-gray-800">
                {status}
              </span>
            </div>
          )}
          {category && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                {category}
              </span>
            </div>
          )}
          {rawPricePerKg != null && rawPricePerKg > 0 && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 bg-white/90 text-gray-800 text-sm font-semibold rounded-full shadow-sm">
                ₹{rawPricePerKg}/kg
              </span>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Title */}
          <DialogHeader className="pb-0">
            <DialogTitle className="text-xl font-bold text-gray-900 leading-snug">
              {title}
            </DialogTitle>
          </DialogHeader>

          {/* Product Details */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Product Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {category && (
                <div className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                  <Tag className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-800">{category}</p>
                  </div>
                </div>
              )}
              {rawQuantityKg != null && (
                <div className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                  <Scale className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="text-sm font-medium text-gray-800">
                      {rawQuantityKg} kg
                    </p>
                  </div>
                </div>
              )}
              {rawPricePerKg != null && rawPricePerKg > 0 && (
                <div className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                  <span className="text-emerald-600 font-bold text-sm mt-0.5 flex-shrink-0">₹</span>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-medium text-gray-800">
                      ₹{rawPricePerKg} per kg
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                <BadgeCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p
                    className={`text-sm font-medium ${
                      status === "Available"
                        ? "text-emerald-700"
                        : "text-gray-600"
                    }`}
                  >
                    {status ?? "Available"}
                  </p>
                </div>
              </div>
            </div>
            {/* Selected quantity summary */}
            {displayQty && totalPrice && (
              <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
                <span className="text-sm text-emerald-800">
                  {displayQty} kg selected
                </span>
                <span className="text-sm font-semibold text-emerald-900">
                  Total: ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </section>

          {/* Seller Details */}
          {!isGuest && (
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Seller Information
              </h4>
              {sellerLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 animate-pulse h-20" />
              ) : seller ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {seller.profile_image || seller.user_image ? (
                      <img
                        src={seller.profile_image || seller.user_image}
                        alt={seller.enterprise_name || seller.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        {seller.enterprise_name ? (
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {seller.enterprise_name || seller.full_name || "Seller"}
                      </p>
                      {seller.enterprise_name && seller.full_name && (
                        <p className="text-xs text-gray-500 truncate">
                          {seller.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {seller.avg_rating != null && seller.rating_count != null && seller.rating_count > 0 && (
                    <StarRating score={seller.avg_rating} count={seller.rating_count} />
                  )}
                  {seller.location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{seller.location}</span>
                    </div>
                  )}
                  {seller.about && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {seller.about}
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          )}
        </div>

        {/* Sticky bottom CTA */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
          {!canBuy ? (
            <Button
              variant="outline"
              className="w-full text-gray-500 border-gray-200"
              disabled
            >
              Your Listing
            </Button>
          ) : isSoldOut ? (
            <Button
              className="w-full bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
              disabled
            >
              Sold Out
            </Button>
          ) : isFree ? (
            <Button
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              variant="outline"
              onClick={onEnquire}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enquire
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => {
                  onClose();
                  onBuyNow?.();
                }}
                disabled={!showBuyCTA}
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </Button>
              {showEnquireCTA && (
                <Button
                  variant="outline"
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
                  onClick={() => {
                    onClose();
                    onEnquire?.();
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Enquire
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
