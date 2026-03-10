import { RefreshCcw, Users } from "lucide-react";

interface BrandingPanelProps {
  variant: "login" | "signup";
}

export function BrandingPanel({ variant }: BrandingPanelProps) {
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
          <p className="text-3xl font-bold text-emerald-600">124</p>
          <p className="text-sm text-gray-500 mt-1">Active Listings</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-600">12</p>
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
