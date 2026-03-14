import { useState } from "react";
import { MessageSquare, ChevronRight, Loader2, PackageOpen } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChatWindow } from "./enquiry/ChatWindow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuyerEnquiry {
  name: string;
  product_name: string;
  seller: string;
  quantity_kg: number;
  original_price_per_kg: number;
  agreed_price_per_kg: number | null;
  status: string;
  creation: string;
}

type FrappeResp<T> = { message: T };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BADGE: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-100",
  Negotiating: "bg-amber-50 text-amber-700 border-amber-100",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Rejected: "bg-red-50 text-red-700 border-red-100",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function timeAgo(creation: string): string {
  if (!creation) return "";
  const date = new Date(creation.replace(" ", "T").split(".")[0]);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

// ---------------------------------------------------------------------------
// BuyerEnquiriesDrawer
// ---------------------------------------------------------------------------

interface BuyerEnquiriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyerEnquiriesDrawer({ isOpen, onClose }: BuyerEnquiriesDrawerProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useFrappeGetCall<FrappeResp<BuyerEnquiry[]>>(
    "reverto.api.enquiry.get_buyer_enquiries",
    {},
    undefined,
    { refreshInterval: 15000 },
  );

  const enquiries = data?.message ?? [];
  const activeCount = enquiries.filter(
    (e) => e.status === "Open" || e.status === "Negotiating",
  ).length;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                My Enquiries
                {activeCount > 0 && (
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    ({activeCount} active)
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
          </SheetHeader>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-20 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <PackageOpen className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-gray-500 text-sm">No enquiries yet.</p>
                <p className="text-gray-400 text-xs">
                  Add products to cart and proceed to enquiry to start chatting with sellers.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {enquiries.map((enq) => (
                  <button
                    key={enq.name}
                    onClick={() => setActiveChatId(enq.name)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {enq.product_name}
                          </p>
                          <span
                            className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border ${
                              BADGE[enq.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {enq.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {enq.quantity_kg} kg ·{" "}
                          {enq.agreed_price_per_kg ? (
                            <span className="text-emerald-600 font-medium">
                              Agreed: {fmt(enq.agreed_price_per_kg)}/kg
                            </span>
                          ) : (
                            <span>{fmt(enq.original_price_per_kg)}/kg</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Seller: {enq.seller}
                          {enq.creation && (
                            <span className="ml-2">· {timeAgo(enq.creation)}</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat dialog */}
      <Dialog open={!!activeChatId} onOpenChange={(v) => !v && setActiveChatId(null)}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Enquiry Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {activeChatId && (
              <ChatWindow key={activeChatId} enquiryId={activeChatId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
