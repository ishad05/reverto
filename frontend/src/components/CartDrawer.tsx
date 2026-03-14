import { useState } from "react";
import { ShoppingCart, Trash2, X, PackageOpen, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Separator } from "./ui/seperator";
import { EnquiryModal, EnquiryCreating, type EnquiryEntry } from "./enquiry/EnquiryModal";
import { PaymentModal, type PaymentLine } from "./PaymentModal";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    gstAmount,
    grandTotal,
  } = useCart();

  const [enquiryState, setEnquiryState] = useState<{
    phase: "idle" | "creating" | "open";
    enquiries: EnquiryEntry[];
  }>({ phase: "idle", enquiries: [] });

  const [payOpen, setPayOpen] = useState(false);

  const cartLines: PaymentLine[] = items.map((item) => ({
    productName: item.title,
    quantityKg: item.quantityKg,
    pricePerKg: item.pricePerKg,
    image: item.image,
  }));

  const handleProceedToEnquiry = async () => {
    if (!items.length) return;
    setEnquiryState({ phase: "creating", enquiries: [] });
    closeCart();

    try {
      const csrf =
        document.cookie
          .split("; ")
          .find((r) => r.startsWith("X-Frappe-CSRF-Token="))
          ?.split("=")[1] ?? "";

      const results: EnquiryEntry[] = [];

      for (const item of items) {
        const body = new URLSearchParams({
          product_id: item.id,
          quantity_kg: String(item.quantityKg),
        });
        const res = await fetch(
          "/api/method/reverto.api.enquiry.create_enquiry",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Frappe-CSRF-Token": csrf,
            },
            body: body.toString(),
          },
        );

        const data = await res.json();

        if (!res.ok) {
          const msg =
            data?.exception ?? data?.exc_type ?? data?._error_message ?? "Server error";
          console.error("create_enquiry failed:", data);
          throw new Error(msg);
        }

        if (data.message?.enquiry_id) {
          results.push({
            enquiryId: data.message.enquiry_id,
            productName: item.title,
            quantityKg: item.quantityKg,
            pricePerKg: item.pricePerKg,
            productImage: item.image,
          });
        }
      }

      if (results.length) {
        clearCart();
        setEnquiryState({ phase: "open", enquiries: results });
      } else {
        setEnquiryState({ phase: "idle", enquiries: [] });
        alert(
          "Could not create enquiries. If this is your first time, make sure you ran `bench migrate`.",
        );
      }
    } catch (err) {
      setEnquiryState({ phase: "idle", enquiries: [] });
      alert(
        `Enquiry error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Your Cart
                {items.length > 0 && (
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                )}
              </SheetTitle>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>
          </SheetHeader>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <PackageOpen className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-gray-500 text-sm">Your cart is empty.</p>
                <p className="text-gray-400 text-xs">
                  Browse listings and add waste products to get started.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const lineTotal = item.pricePerKg * item.quantityKg;
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-3"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </div>

                      {/* Title + type */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                        <span className="inline-block mt-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                          {item.wasteType}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">
                          Available: {item.availableKg} kg
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Qty stepper + line total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Qty:</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantityKg - 1)}
                          disabled={item.quantityKg <= 1}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="min-w-[3rem] text-center text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                          {item.quantityKg} kg
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantityKg + 1)}
                          disabled={item.quantityKg >= item.availableKg}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {fmt(item.pricePerKg)}/kg
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {fmt(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Price Summary */}
          {items.length > 0 && (
            <div className="px-6 py-5 border-t border-gray-100 space-y-3 bg-white">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  GST
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 font-medium">
                    18%
                  </span>
                </span>
                <span>{fmt(gstAmount)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="text-emerald-700 text-base">{fmt(grandTotal)}</span>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Inclusive of 18% GST on all waste materials
              </p>

              <Button
                className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                size="lg"
                onClick={() => { closeCart(); setPayOpen(true); }}
              >
                Proceed to Pay
              </Button>

              <Button
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                size="lg"
                onClick={handleProceedToEnquiry}
              >
                Negotiate with Seller
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Enquiry loading overlay */}
      {enquiryState.phase === "creating" && <EnquiryCreating />}

      {/* Enquiry chat modal */}
      {enquiryState.phase === "open" && (
        <EnquiryModal
          open
          onClose={() => setEnquiryState({ phase: "idle", enquiries: [] })}
          enquiries={enquiryState.enquiries}
        />
      )}

      {/* Direct payment modal */}
      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        lines={cartLines}
        onSuccess={() => { clearCart(); }}
      />
    </>
  );
}
