import { useState } from "react";
import { CheckCircle2, Loader2, CreditCard, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/seperator";

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
  /** If provided, calls confirm_payment on the backend when confirming */
  enquiryId?: string;
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
  onSuccess,
}: PaymentModalProps) {
  const [phase, setPhase] = useState<"review" | "processing" | "success">("review");
  const [error, setError] = useState<string | null>(null);
  const [paidTotal, setPaidTotal] = useState<number>(0);

  const subtotal = lines.reduce((s, l) => s + l.pricePerKg * l.quantityKg, 0);
  const gst = subtotal * GST;
  const grandTotal = subtotal + gst;

  const handleConfirm = async () => {
    setError(null);
    setPhase("processing");

    try {
      if (enquiryId) {
        const csrf =
          document.cookie
            .split("; ")
            .find((r) => r.startsWith("X-Frappe-CSRF-Token="))
            ?.split("=")[1] ?? "";

        const res = await fetch("/api/method/reverto.api.enquiry.confirm_payment", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Frappe-CSRF-Token": csrf,
          },
          body: new URLSearchParams({ enquiry_id: enquiryId }).toString(),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.exception ?? data?._error_message ?? "Payment failed",
          );
        }
      }

      setPaidTotal(grandTotal);
      setPhase("success");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("review");
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setPhase("review");
    setError(null);
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
              <p className="text-2xl font-bold text-emerald-700">{fmt(paidTotal)}</p>
              <p className="text-xs text-gray-400 mt-0.5">incl. 18% GST</p>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Order Summary
              </DialogTitle>
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
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
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
