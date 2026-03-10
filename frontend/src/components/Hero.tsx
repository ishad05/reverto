interface HeroProps {
  listingCount?: number;
  sellerCount?: number;
}

export function Hero({ listingCount, sellerCount }: HeroProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl text-gray-900">Waste available near you</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-emerald-600">
                {listingCount ?? 0}
              </span>{" "}
              listings
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-emerald-600">
                {sellerCount ?? 0}
              </span>{" "}
              sellers
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">Updated today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
