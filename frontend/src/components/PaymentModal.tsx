import { useState } from "react";
import { CheckCircle2, Loader2, CreditCard, IndianRupee } from "lucide-react";
import { useFrappePostCall } from "frappe-react-sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/seperator";
import { SellerRatingWidget } from "./SellerRatingWidget";

const GST = 0.18;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentLine {
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  image?: string;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  lines: PaymentLine[];
  /** Enquiry-based payment — provide this for the negotiation flow */
  enquiryId?: string;
  /** Direct purchase — provide this to skip negotiation and buy at listed price */
  directPurchase?: { productId: string; quantityKg: number };
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// PaymentModal
// ---------------------------------------------------------------------------

export function PaymentModal({
  open,
  onClose,
  lines,
  enquiryId,
  directPurchase,
  onSuccess,
}: PaymentModalProps) {
  const [phase, setPhase] = useState<"review" | "processing" | "success" | "rating">("review");
  const [error, setError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [resolvedEnquiryId, setResolvedEnquiryId] = useState<string | null>(null);

  const { call: confirmPayment } = useFrappePostCall<{ success: boolean }>(
    "reverto.api.enquiry.confirm_payment",
  );
  const { call: buyDirect } = useFrappePostCall<{ success: boolean; enquiry_id: string }>(
    "reverto.api.enquiry.direct_purchase",
  );

  const subtotal = lines.reduce((s, l) => s + l.pricePerKg * l.quantityKg, 0);
  const gst = subtotal * GST;
  const grandTotal = subtotal + gst;

  const handleConfirm = async () => {
    setError(null);
    setPhase("processing");
    const totalSnapshot = grandTotal;

    try {
      if (directPurchase) {
        const res = await buyDirect({
          product_id: directPurchase.productId,
          quantity_kg: directPurchase.quantityKg,
        });
        setResolvedEnquiryId(res?.enquiry_id ?? null);
      } else {
        if (!enquiryId) {
          throw new Error("No enquiry ID provided — cannot process payment.");
        }
        await confirmPayment({ enquiry_id: enquiryId });
        setResolvedEnquiryId(enquiryId);
      }
      setConfirmedTotal(totalSnapshot);
      setPhase("success");
      onSuccess?.();
    } catch (err: unknown) {
      let msg = "Payment failed. Please try again.";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        if (typeof e.exception === "string" && e.exception) {
          const lastLine = e.exception.split("\n").filter(Boolean).pop() ?? "";
          msg = lastLine || e.exception;
        } else if (typeof e.message === "string" && e.message) {
          msg = e.message;
        } else if (typeof e._server_messages === "string") {
          try {
            const parsed = JSON.parse(e._server_messages as string);
            const inner = JSON.parse(parsed[0]);
            msg = inner?.message ?? msg;
          } catch {
            // ignore parse errors
          }
        }
      }
      setError(msg);
      setPhase("review");
    }
  };

  const handleClose = () => {
    setPhase("review");
    setError(null);
    setConfirmedTotal(0);
    setResolvedEnquiryId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {phase === "success" ? (
          /* ── Success screen ── */
          <div className="flex flex-col items-center justify-center py-14 px-8 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Order Confirmed!</h2>
              <p className="text-sm text-gray-500">
                Your order has been placed successfully. The seller will be in touch.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-6 py-3 text-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-0.5">Total paid</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(confirmedTotal)}</p>
              <p className="text-xs text-gray-400 mt-0.5">incl. 18% GST</p>
            </div>
            {resolvedEnquiryId ? (
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 gap-2"
                onClick={() => setPhase("rating")}
              >
                Rate the Seller
              </Button>
            ) : null}
            <Button
              variant={resolvedEnquiryId ? "outline" : "default"}
              className={resolvedEnquiryId ? "w-full" : "w-full bg-emerald-600 hover:bg-emerald-700"}
              onClick={handleClose}
            >
              {resolvedEnquiryId ? "Skip, go to home" : "Done"}
            </Button>
          </div>
        ) : phase === "rating" ? (
          /* ── Rating screen ── */
          <div className="flex flex-col items-center py-10 px-8 gap-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-gray-900">How was the seller?</h2>
              <p className="text-sm text-gray-500">Your feedback helps others make better decisions.</p>
            </div>
            <SellerRatingWidget
              enquiryId={resolvedEnquiryId!}
              onSubmitted={handleClose}
              onSkip={handleClose}
              skipLabel="Skip, go to home"
            />
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Order Summary
              </DialogTitle>
              {directPurchase && (
                <p className="text-xs text-gray-500 mt-1">
                  Buying at listed price — no negotiation required
                </p>
              )}
            </DialogHeader>

            {/* Lines */}
            <div className="px-6 py-4 space-y-3 max-h-60 overflow-y-auto">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-3">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt={line.productName}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <IndianRupee className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {line.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {line.quantityKg} kg × {fmt(line.pricePerKg)}/kg
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {fmt(line.pricePerKg * line.quantityKg)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-2.5 bg-gray-50">
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
                <span>{fmt(gst)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-emerald-700 text-base">{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-4 space-y-3">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 break-words">
                  {error}
                </div>
              )}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                size="lg"
                onClick={handleConfirm}
                disabled={phase === "processing"}
              >
                {phase === "processing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {phase === "processing" ? "Processing…" : "Confirm & Pay"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClose}
                disabled={phase === "processing"}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
