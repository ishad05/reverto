import { useState } from "react";
import { Package, Loader2, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ChatWindow } from "./ChatWindow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnquiryEntry {
  enquiryId: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  productImage?: string;
}

interface EnquiryModalProps {
  open: boolean;
  onClose: () => void;
  enquiries: EnquiryEntry[];
}

// ---------------------------------------------------------------------------
// EnquiryModal
// ---------------------------------------------------------------------------

export function EnquiryModal({ open, onClose, enquiries }: EnquiryModalProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!enquiries.length) return null;

  const active = enquiries[activeIdx];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Enquiry Chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar — only shown when multiple enquiries */}
          {enquiries.length > 1 && (
            <div className="w-56 border-r border-gray-100 flex-shrink-0 overflow-y-auto">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">
                Products
              </p>
              {enquiries.map((e, i) => (
                <button
                  key={e.enquiryId}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    i === activeIdx
                      ? "bg-emerald-50 border-r-2 border-emerald-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {e.productImage ? (
                      <img
                        src={e.productImage}
                        alt={e.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {e.productName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.quantityKg} kg · ₹{e.pricePerKg}/kg
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 min-w-0">
            <ChatWindow key={active.enquiryId} enquiryId={active.enquiryId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EnquiryCreating — shown while creating enquiries
// ---------------------------------------------------------------------------

export function EnquiryCreating() {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-gray-700">Opening enquiry chat…</p>
      </div>
    </div>
  );
}
