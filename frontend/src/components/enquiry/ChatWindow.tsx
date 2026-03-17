import { useEffect, useRef, useState } from "react";
import { Send, IndianRupee, Check, X, Loader2, Star, CreditCard } from "lucide-react";
import {
  useFrappeAuth,
  useFrappeGetCall,
  useFrappePostCall,
  useFrappeEventListener,
} from "frappe-react-sdk";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PaymentModal } from "../PaymentModal";

const GST = 0.18;

// ---------------------------------------------------------------------------
// RateSellerWidget — shown to buyer after deal accepted
// ---------------------------------------------------------------------------

function RateSellerWidget({ enquiryId }: { enquiryId: string }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingData } = useFrappeGetCall<{ message: { rated: boolean; score: number; comment: string } }>(
    "reverto.api.profile.get_my_rating_for_enquiry",
    { enquiry_id: enquiryId },
  );
  const { call: rateSeller, loading: rating } = useFrappePostCall(
    "reverto.api.profile.rate_seller",
  );

  const alreadyRated = existingData?.message?.rated || submitted;
  const existingScore = existingData?.message?.score ?? 0;

  if (alreadyRated) {
    return (
      <div className="flex items-center justify-center gap-2 py-1 text-xs text-amber-700">
        {[1,2,3,4,5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= (existingScore || selected) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-gray-500">You rated this seller</span>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selected) return;
    await rateSeller({ enquiry_id: enquiryId, score: selected, comment });
    setSubmitted(true);
  };

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs font-medium text-amber-800">Rate the seller</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                s <= (hovered || selected) ? "fill-amber-400 text-amber-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            className="w-full text-xs border border-amber-200 bg-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs"
            onClick={handleSubmit}
            disabled={rating}
          >
            {rating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit Rating"}
          </Button>
        </div>
      )}
    </div>
  );
}
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnquiryDetails {
  name: string;
  product: string;
  product_name: string;
  buyer: string;
  seller: string;
  quantity_kg: number;
  original_price_per_kg: number;
  agreed_price_per_kg: number | null;
  status: string;
}

interface Message {
  name: string;
  sender: string;
  sender_name: string;
  message_text: string;
  message_type: string;
  proposed_price_per_kg: number | null;
  creation: string;
}

type FrappeResp<T> = { message: T };

// ---------------------------------------------------------------------------
// ChatWindow
// ---------------------------------------------------------------------------

export function ChatWindow({ enquiryId }: { enquiryId: string }) {
  const { currentUser } = useFrappeAuth();
  const [text, setText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, mutate, isLoading } = useFrappeGetCall<
    FrappeResp<{ enquiry: EnquiryDetails; messages: Message[] }>
  >(
    "reverto.api.enquiry.get_enquiry",
    { enquiry_id: enquiryId },
    undefined,
    { refreshInterval: 4000 }, // poll every 4 s as fallback
  );

  // Real-time: re-fetch whenever socket event fires
  useFrappeEventListener(`enquiry_${enquiryId}`, () => mutate());

  const { call: sendMsg, loading: sending } = useFrappePostCall(
    "reverto.api.enquiry.send_message",
  );
  const { call: proposePrice, loading: proposing } = useFrappePostCall(
    "reverto.api.enquiry.propose_price",
  );
  const { call: respondToPrice, loading: responding } = useFrappePostCall(
    "reverto.api.enquiry.respond_to_price",
  );

  const enquiry = data?.message?.enquiry;
  const messages = data?.message?.messages ?? [];

  const isSeller = currentUser === enquiry?.seller;
  const isBuyer = currentUser === enquiry?.buyer;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    await sendMsg({ enquiry_id: enquiryId, message_text: t });
    mutate();
  };

  const handlePropose = async () => {
    const p = parseFloat(priceInput);
    if (!p || p <= 0) return;
    setPriceInput("");
    setShowPriceInput(false);
    await proposePrice({ enquiry_id: enquiryId, new_price_per_kg: p });
    mutate();
  };

  const handleRespond = async (accepted: boolean) => {
    await respondToPrice({ enquiry_id: enquiryId, accepted: accepted ? 1 : 0 });
    mutate();
  };

  if (isLoading || !enquiry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading chat…
      </div>
    );
  }

  // Current effective price for the total
  const effectivePrice =
    enquiry.agreed_price_per_kg ?? enquiry.original_price_per_kg;
  const subtotal = effectivePrice * enquiry.quantity_kg;
  const gst = subtotal * GST;
  const total = subtotal + gst;

  // Latest unresponded price offer (only relevant for buyer)
  const latestOffer =
    enquiry.status === "Negotiating"
      ? [...messages]
          .reverse()
          .find((m) => m.message_type === "price_offer")
      : null;

  const statusColors: Record<string, string> = {
    Open: "bg-blue-50 text-blue-700 border-blue-100",
    Negotiating: "bg-amber-50 text-amber-700 border-amber-100",
    Accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Rejected: "bg-red-50 text-red-700 border-red-100",
    Closed: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header: product + price summary */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{enquiry.product_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {enquiry.quantity_kg} kg ·{" "}
              {enquiry.agreed_price_per_kg ? (
                <span className="text-emerald-600 font-medium">
                  Agreed: ₹{enquiry.agreed_price_per_kg}/kg
                </span>
              ) : (
                <span>Original: ₹{enquiry.original_price_per_kg}/kg</span>
              )}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              statusColors[enquiry.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {enquiry.status}
          </span>
        </div>

        {/* Price breakdown */}
        <div className="flex items-center gap-4 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
          <span>
            Subtotal:{" "}
            <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
          </span>
          <span>·</span>
          <span>
            GST (18%):{" "}
            <span className="font-medium text-gray-800">{fmt(gst)}</span>
          </span>
          <span>·</span>
          <span className="font-semibold text-emerald-700">
            Total: {fmt(total)}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender === currentUser;

          if (msg.message_type === "system") {
            return (
              <div key={msg.name} className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                  {msg.message_text}
                </span>
              </div>
            );
          }

          if (msg.message_type === "price_offer") {
            const offerPrice = msg.proposed_price_per_kg ?? 0;
            const newSub = offerPrice * enquiry.quantity_kg;
            const newGst = newSub * GST;
            const newTotal = newSub + newGst;
            const isLatest = latestOffer?.name === msg.name;

            return (
              <div
                key={msg.name}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-xs w-full bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium text-sm">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Price Offer from {isMine ? "you" : msg.sender_name}
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{offerPrice}/kg
                  </p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>
                      Subtotal: <span className="font-medium">{fmt(newSub)}</span>
                    </div>
                    <div>
                      GST (18%): <span className="font-medium">{fmt(newGst)}</span>
                    </div>
                    <div className="font-semibold text-emerald-700 text-sm">
                      New Total: {fmt(newTotal)}
                    </div>
                  </div>
                  {/* Accept / Decline — only for buyer on latest offer */}
                  {isBuyer && isLatest && enquiry.status !== "Accepted" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
                        onClick={() => handleRespond(true)}
                        disabled={responding}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs gap-1"
                        onClick={() => handleRespond(false)}
                        disabled={responding}
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (
            msg.message_type === "price_accepted" ||
            msg.message_type === "price_rejected"
          ) {
            const isAccepted = msg.message_type === "price_accepted";
            return (
              <div key={msg.name} className="flex justify-center">
                <div
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border ${
                    isAccepted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {isAccepted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  {msg.message_text}
                </div>
              </div>
            );
          }

          // Regular message
          return (
            <div
              key={msg.name}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-xs">
                {!isMine && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">
                    {msg.sender_name}
                  </p>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {msg.message_text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {enquiry.status !== "Accepted" && enquiry.status !== "Closed" ? (
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {/* Seller: propose price panel */}
          {isSeller && (
            <div>
              {showPriceInput ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="New price per kg"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="pl-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handlePropose()}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handlePropose}
                    disabled={proposing || !priceInput}
                  >
                    {proposing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Offer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPriceInput(false);
                      setPriceInput("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPriceInput(true)}
                  className="flex items-center gap-1.5 text-xs text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <IndianRupee className="w-3 h-3" />
                  Propose New Price
                </button>
              )}
            </div>
          )}

          {/* Message input */}
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 text-sm"
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
            />
            <Button
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {enquiry.status === "Accepted" ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-2">
                <p className="text-sm text-emerald-800 font-semibold text-center">
                  Deal Agreed
                </p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{enquiry.quantity_kg} kg × ₹{enquiry.agreed_price_per_kg}/kg</span>
                  <span>Subtotal: {fmt((enquiry.agreed_price_per_kg ?? 0) * enquiry.quantity_kg)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>GST (18%)</span>
                  <span>{fmt((enquiry.agreed_price_per_kg ?? 0) * enquiry.quantity_kg * GST)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-700 pt-1 border-t border-emerald-200">
                  <span>Total</span>
                  <span>{fmt((enquiry.agreed_price_per_kg ?? 0) * enquiry.quantity_kg * (1 + GST))}</span>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={() => setPayOpen(true)}
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Pay
              </Button>

              {isBuyer && <RateSellerWidget enquiryId={enquiry.name} />}
            </>
          ) : (
            <p className="text-sm text-gray-500 font-medium text-center">
              This enquiry is closed.
            </p>
          )}
        </div>
      )}

      {/* Payment modal */}
      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        enquiryId={enquiry.name}
        lines={[{
          productName: enquiry.product_name,
          quantityKg: enquiry.quantity_kg,
          pricePerKg: enquiry.agreed_price_per_kg ?? enquiry.original_price_per_kg,
        }]}
        onSuccess={() => { mutate(); }}
      />
    </div>
  );
}
