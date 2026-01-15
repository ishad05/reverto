import { Leaf, TrendingDown } from "lucide-react";

export function SustainabilityWidget() {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-gray-900">Your Impact</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Waste diverted from landfill</div>
            <div className="text-2xl font-semibold text-gray-900">2,847 kg</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Estimated CO₂ saved</div>
            <div className="text-2xl font-semibold text-gray-900">1,423 kg</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-emerald-200">
        <p className="text-xs text-gray-500 text-center">
          Community total: <span className="font-semibold text-emerald-600">45.2 tons</span> this month
        </p>
      </div>
    </div>
  );
}
