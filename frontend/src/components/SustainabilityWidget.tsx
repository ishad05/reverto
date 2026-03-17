import { Leaf, TrendingDown, Globe, Loader2 } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

interface SustainabilityStats {
  personal_waste_kg: number;
  personal_co2_kg: number;
  community_waste_kg: number;
  community_co2_kg: number;
}

type FrappeResp<T> = { message: T };

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} t`;
  return `${n.toFixed(1)} kg`;
}

export function SustainabilityWidget() {
  const { data, isLoading } = useFrappeGetCall<FrappeResp<SustainabilityStats>>(
    "reverto.api.enquiry.get_sustainability_stats",
    {},
    undefined,
    { refreshInterval: 30000 },
  );

  const stats = data?.message;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-gray-900 text-sm font-semibold leading-tight">Your Impact</h3>
          <p className="text-xs text-emerald-600">Buying + selling combined</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-emerald-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Calculating…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Waste diverted */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Waste diverted from landfill</div>
              {stats && stats.personal_waste_kg > 0 ? (
                <div className="text-2xl font-semibold text-gray-900">
                  {fmt(stats.personal_waste_kg)}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">No transactions yet</div>
              )}
            </div>
          </div>

          {/* CO₂ saved */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Estimated CO₂ saved</div>
              {stats && stats.personal_co2_kg > 0 ? (
                <div className="text-2xl font-semibold text-gray-900">
                  {fmt(stats.personal_co2_kg)}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">Complete a deal to see savings</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Community totals */}
      <div className="mt-4 pt-4 border-t border-emerald-200 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">Community Impact</span>
        </div>
        {isLoading ? (
          <div className="h-4 bg-emerald-100 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Waste diverted</span>
              <span className="font-semibold text-emerald-700">
                {stats ? fmt(stats.community_waste_kg) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>CO₂ saved</span>
              <span className="font-semibold text-emerald-700">
                {stats ? fmt(stats.community_co2_kg) : "—"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
