import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Loader2, PackageCheck, IndianRupee, Star } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/seperator";
import { Button } from "./ui/button";
import { SellerRatingWidget } from "./SellerRatingWidget";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Order {
  name: string;
  product: string;
  product_name: string;
  seller: string;
  quantity_kg: number;
  original_price_per_kg: number;
  agreed_price_per_kg: number | null;
  total_paid: number;
  product_image: string | null;
  creation: string;
}

type FrappeResp<T> = { message: T };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

function formatDate(creation: string): string {
  if (!creation) return "";
  const date = new Date(creation.replace(" ", "T").split(".")[0]);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// MyOrdersDrawer
// ---------------------------------------------------------------------------

interface MyOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Increment this from the parent to trigger an immediate refetch */
  refreshKey?: number;
}

export function MyOrdersDrawer({ isOpen, onClose, refreshKey = 0 }: MyOrdersDrawerProps) {
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useFrappeGetCall<FrappeResp<Order[]>>(
    "reverto.api.enquiry.get_my_orders",
    {},
    undefined,
    { refreshInterval: 15000 },
  );

  // Refetch when the drawer opens (skip initial mount when it's closed)
  useEffect(() => {
    if (isOpen) mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Refetch when a payment is confirmed — skip the initial value of 0
  const prevKeyRef = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== prevKeyRef.current) {
      prevKeyRef.current = refreshKey;
      mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const orders = data?.message ?? [];
  const lifetimeTotal = orders.reduce((sum, o) => sum + (o.total_paid || 0), 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              My Orders
              {orders.length > 0 && (
                <span className="ml-1 text-sm font-normal text-gray-500">
                  ({orders.length})
                </span>
              )}
            </SheetTitle>
            <button
              onClick={() => mutate()}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Lifetime spend summary */}
          {orders.length > 0 && (
            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Total Spent</p>
                <p className="text-xl font-bold text-emerald-700">{fmt(lifetimeTotal)}</p>
                <p className="text-xs text-gray-400">
                  incl. 18% GST · {orders.length} order{orders.length !== 1 ? "s" : ""}
                </p>
              </div>
              <PackageCheck className="w-8 h-8 text-emerald-300" />
            </div>
          )}
        </SheetHeader>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-20 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-emerald-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No orders yet</p>
              <p className="text-gray-400 text-xs max-w-xs">
                Once you confirm payment for an enquiry, your order history will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const effectivePrice =
                  order.agreed_price_per_kg || order.original_price_per_kg;
                const subtotal = effectivePrice * order.quantity_kg;
                const gst = subtotal * 0.18;
                const grandTotal = subtotal + gst;
                const isRating = ratingOrderId === order.name;

                return (
                  <div key={order.name} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Product image */}
                      {order.product_image ? (
                        <img
                          src={order.product_image}
                          alt={order.product_name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100 border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          <IndianRupee className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {order.product_name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px]"
                          >
                            Completed
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.quantity_kg} kg · {fmt(effectivePrice)}/kg
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Seller: {order.seller}
                          {order.creation && (
                            <span className="ml-2">· {formatDate(order.creation)}</span>
                          )}
                        </p>

                        {/* Price breakdown */}
                        <div className="mt-2 bg-white border border-gray-100 rounded-lg px-3 py-2 space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Subtotal</span>
                            <span>{fmt(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>GST (18%)</span>
                            <span>{fmt(gst)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-xs font-bold text-emerald-700">
                            <span>Total Paid</span>
                            <span>{fmt(grandTotal)}</span>
                          </div>
                        </div>

                        {/* Rate seller */}
                        {isRating ? (
                          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
                            <p className="text-xs font-medium text-amber-800 mb-2">Rate the seller</p>
                            <SellerRatingWidget
                              enquiryId={order.name}
                              onSubmitted={() => setRatingOrderId(null)}
                              onSkip={() => setRatingOrderId(null)}
                              skipLabel="Cancel"
                            />
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() => setRatingOrderId(order.name)}
                          >
                            <Star className="w-3.5 h-3.5" />
                            Rate Seller
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
