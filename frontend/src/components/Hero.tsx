interface HeroProps {
  listingCount?: number;
  sellerCount?: number;
}

export function Hero({ listingCount, sellerCount }: HeroProps) {
  const hasStats =
    typeof listingCount === "number" && typeof sellerCount === "number";

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-left space-y-3 max-w-xl">
            <h2 className="text-3xl text-gray-900">
              Waste available near you
            </h2>
            <p className="text-sm text-gray-600">
              Discover surplus and end‑of‑life materials from individuals and
              industries around you, and give them a second life instead of
              sending them to landfills.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-emerald-600">
                  {hasStats ? listingCount : "–"}
                </span>{" "}
                listings
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-emerald-600">
                  {hasStats ? sellerCount : "–"}
                </span>{" "}
                sellers
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">Updated in real time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
