import { useMemo } from "react";
import { RefreshCcw, Users } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

type ProductSummary = {
  name: string;
  owner?: string;
};

type FrappeResponse<T> = { message: T };

function useMarketplaceStats() {
  const { data, isLoading } = useFrappeGetCall<
    FrappeResponse<ProductSummary[]>
  >("reverto.api.products.list_products", { limit: 50 });

  const productsRaw = data?.message;
  const products = useMemo(() => productsRaw ?? [], [productsRaw]);

  const listingCount = products.length;
  const sellerCount = useMemo(
    () =>
      new Set(
        products
          .map((p) => p.owner ?? "")
          .filter((o) => o && o !== "Guest"),
      ).size,
    [products],
  );

  return { listingCount, sellerCount, isLoading };
}

interface BrandingPanelProps {
  variant: "login" | "signup";
}

export function BrandingPanel({ variant }: BrandingPanelProps) {
  const { listingCount, sellerCount, isLoading } = useMarketplaceStats();

  if (variant === "login") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 px-12 text-center">
        <div className="w-28 h-28 bg-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-lg">
          <RefreshCcw className="w-14 h-14 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
          Transform waste into value
        </h2>
        <p className="text-gray-600 max-w-xs leading-relaxed text-sm">
          Join the circular economy revolution. Buy and sell recyclable
          materials, reduce waste, and make a positive impact on the
          environment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 px-12 text-center">
      <div className="w-28 h-28 bg-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-lg">
        <Users className="w-14 h-14 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
        Join our community
      </h2>
      <p className="text-gray-600 max-w-xs leading-relaxed text-sm mb-12">
        Connect with waste sellers and buyers across the country. Start making
        a difference today.
      </p>
      <div className="flex gap-10">
        <div>
          {isLoading ? (
            <div className="h-9 w-12 bg-emerald-200 rounded animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-3xl font-bold text-emerald-600">{listingCount}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Active Listings</p>
        </div>
        <div>
          {isLoading ? (
            <div className="h-9 w-8 bg-emerald-200 rounded animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-3xl font-bold text-emerald-600">{sellerCount}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Sellers</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-600">45.2</p>
          <p className="text-sm text-gray-500 mt-1">Tonnes Saved</p>
        </div>
      </div>
    </div>
  );
}
