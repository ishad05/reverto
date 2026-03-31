import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Button } from "./ui/button";

interface SellerRatingWidgetProps {
  enquiryId: string;
  onSubmitted?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

type RatingResp = { message: { rated: boolean; score: number; comment: string } };

export function SellerRatingWidget({
  enquiryId,
  onSubmitted,
  onSkip,
  skipLabel = "Skip",
}: SellerRatingWidgetProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingData } = useFrappeGetCall<RatingResp>(
    "reverto.api.profile.get_my_rating_for_enquiry",
    { enquiry_id: enquiryId },
  );
  const { call: rateSeller, loading: rating } = useFrappePostCall(
    "reverto.api.profile.rate_seller",
  );

  const alreadyRated = existingData?.message?.rated || submitted;
  const existingScore = existingData?.message?.score ?? 0;

  if (alreadyRated) {
    const displayScore = existingScore || selected;
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-5 h-5 ${s <= displayScore ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">Rating submitted — thank you!</p>
        {onSkip && (
          <Button variant="outline" className="w-full" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selected) return;
    await rateSeller({ enquiry_id: enquiryId, score: selected, comment });
    setSubmitted(true);
    onSubmitted?.();
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
            aria-label={`Rate ${s} star${s !== 1 ? "s" : ""}`}
          >
            <Star
              className={`w-7 h-7 transition-colors cursor-pointer ${
                s <= (hovered || selected)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 hover:text-amber-300"
              }`}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
        />
      )}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
        onClick={handleSubmit}
        disabled={!selected || rating}
      >
        {rating && <Loader2 className="w-4 h-4 animate-spin" />}
        {rating ? "Submitting…" : "Submit Review"}
      </Button>
      {onSkip && (
        <Button variant="ghost" className="w-full text-gray-400" onClick={onSkip}>
          {skipLabel}
        </Button>
      )}
    </div>
  );
}
