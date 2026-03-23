import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  type MapRef,
  type ViewState,
} from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import type { BBox } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapProduct {
  name: string;
  product_name: string;
  category?: string | null;
  quantity?: number | null;
  price_per_quantity?: number | null;
  product_image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ProductMapProps {
  products: MapProduct[];
  onEnquire?: (productId: string, quantity: number) => void;
  onBuyNow?: (product: MapProduct) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDIA_VIEW: Partial<ViewState> = {
  longitude: 78.9629,
  latitude: 20.5937,
  zoom: 4.5,
};

// Completely free vector tile style — no API key needed
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtPrice(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

const CATEGORY_COLOUR: Record<string, string> = {
  Plastic: "#3b82f6",
  "E-waste": "#a855f7",
  Metal: "#6b7280",
  Paper: "#eab308",
  Organic: "#84cc16",
  Construction: "#f97316",
  Textile: "#ec4899",
  Glass: "#06b6d4",
};

function catColour(cat?: string | null): string {
  return CATEGORY_COLOUR[cat ?? ""] ?? "#059669";
}

// ---------------------------------------------------------------------------
// Price-tag marker (individual listing)
// ---------------------------------------------------------------------------

function PriceMarker({
  product,
  active,
  onClick,
}: {
  product: MapProduct;
  active: boolean;
  onClick: () => void;
}) {
  const price = product.price_per_quantity;
  const bg = catColour(product.category);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ backgroundColor: bg }}
      className={`
        relative flex items-center px-2.5 py-1 rounded-full shadow-md
        text-white text-[11px] font-bold whitespace-nowrap select-none
        transition-transform duration-150 cursor-pointer border-2
        ${active ? "scale-125 border-white z-10" : "border-transparent hover:scale-110"}
      `}
    >
      {price != null ? fmtPrice(price) + "/kg" : "Free"}
      {/* Pin triangle */}
      <span
        className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-0 h-0
          border-l-[5px] border-r-[5px] border-t-[7px]
          border-l-transparent border-r-transparent"
        style={{ borderTopColor: bg }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Cluster bubble
// ---------------------------------------------------------------------------

function ClusterMarker({
  count,
  colour,
  onClick,
}: {
  count: number;
  colour: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  // Scale bubble size with count
  const size = count < 5 ? 36 : count < 20 ? 44 : 52;

  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, backgroundColor: colour }}
      className="rounded-full text-white font-bold flex items-center justify-center
        shadow-lg border-2 border-white hover:scale-110 transition-transform
        text-xs cursor-pointer"
    >
      {count}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Product popup
// ---------------------------------------------------------------------------

function ProductPopup({
  product,
  onClose,
  onEnquire,
  onBuyNow,
}: {
  product: MapProduct;
  onClose: () => void;
  onEnquire?: (id: string, qty: number) => void;
  onBuyNow?: (p: MapProduct) => void;
}) {
  const price = product.price_per_quantity;
  const qty = product.quantity ?? 1;
  const subtotal = price != null ? price * qty : null;
  const bg = catColour(product.category);

  return (
    <Popup
      longitude={product.longitude!}
      latitude={product.latitude!}
      anchor="bottom"
      offset={28}
      onClose={onClose}
      closeButton={false}
      maxWidth="230px"
      style={{ padding: 0 }}
    >
      <div className="rounded-xl overflow-hidden shadow-xl w-[220px] bg-white">
        {/* Image or colour band */}
        {product.product_image ? (
          <img
            src={product.product_image}
            alt={product.product_name}
            className="w-full h-28 object-cover"
          />
        ) : (
          <div
            className="w-full h-14 flex items-center justify-center"
            style={{ backgroundColor: bg }}
          >
            <span className="text-white text-xs font-medium opacity-80">
              {product.category ?? "Waste"}
            </span>
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Category + close */}
          <div className="flex items-center justify-between">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: bg }}
            >
              {product.category ?? "Other"}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2"
            >
              ×
            </button>
          </div>

          {/* Name */}
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {product.product_name}
          </p>

          {/* Stats */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{qty} kg available</span>
            {price != null && (
              <span className="font-semibold text-gray-800">₹{price}/kg</span>
            )}
          </div>

          {subtotal != null && (
            <p className="text-xs text-gray-400">
              Total ≈ ₹{subtotal.toLocaleString("en-IN")}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 pt-0.5">
            {onBuyNow && price != null && (
              <button
                onClick={() => onBuyNow(product)}
                className="flex-1 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: bg }}
              >
                Buy Now
              </button>
            )}
            {onEnquire && (
              <button
                onClick={() => onEnquire(product.name, qty)}
                className="flex-1 border text-xs font-semibold py-1.5 rounded-lg transition-colors hover:bg-gray-50 text-gray-700"
              >
                Enquire
              </button>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}

// ---------------------------------------------------------------------------
// ProductMap
// ---------------------------------------------------------------------------

export function ProductMap({ products, onEnquire, onBuyNow }: ProductMapProps) {
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState<Partial<ViewState>>(INDIA_VIEW);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Products with valid non-zero coords
  const mapped = useMemo(
    () =>
      products.filter(
        (p) =>
          p.latitude != null &&
          p.longitude != null &&
          (p.latitude !== 0 || p.longitude !== 0),
      ),
    [products],
  );

  // Build / rebuild supercluster index whenever the mapped product set changes
  const pointsKey = mapped.map((p) => p.name).join(",");
  const [sc, setSc] = useState<Supercluster | null>(null);

  useEffect(() => {
    const points = mapped.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.longitude!, p.latitude!],
      },
      properties: { product: p },
    }));
    const instance = new Supercluster({ radius: 60, maxZoom: 14 });
    instance.load(points);
    setSc(instance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  // Recompute clusters on every viewport change
  const clusters = useMemo(() => {
    if (!sc || !mapRef.current) return [];
    const bounds = mapRef.current.getBounds();
    if (!bounds) return [];
    const bbox: BBox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    return sc.getClusters(bbox, Math.floor((viewState.zoom ?? INDIA_VIEW.zoom)!));
  }, [sc, viewState]);

  const activeProduct = mapped.find((p) => p.name === activeId) ?? null;

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      if (!sc || !mapRef.current) return;
      const zoom = Math.min(sc.getClusterExpansionZoom(clusterId), 20);
      mapRef.current.flyTo({ center: [lng, lat], zoom, duration: 500 });
    },
    [sc],
  );

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onClick={() => setActiveId(null)}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {clusters.map((feature, i) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties;

          // ── Cluster bubble ──
          if (props.cluster) {
            // Pick a representative colour from the first child product
            const leaves = sc?.getLeaves(props.cluster_id as number, 1) ?? [];
            const repProduct = leaves[0]?.properties.product as MapProduct | undefined;
            const colour = catColour(repProduct?.category);

            return (
              <Marker key={`cluster-${i}`} longitude={lng} latitude={lat} anchor="center">
                <ClusterMarker
                  count={props.point_count as number}
                  colour={colour}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(props.cluster_id as number, lng, lat);
                  }}
                />
              </Marker>
            );
          }

          // ── Individual price marker ──
          const product = props.product as MapProduct;
          return (
            <Marker key={product.name} longitude={lng} latitude={lat} anchor="bottom">
              <PriceMarker
                product={product}
                active={activeId === product.name}
                onClick={() =>
                  setActiveId((prev) => (prev === product.name ? null : product.name))
                }
              />
            </Marker>
          );
        })}

        {/* Active product popup */}
        {activeProduct && (
          <ProductPopup
            product={activeProduct}
            onClose={() => setActiveId(null)}
            onEnquire={onEnquire}
            onBuyNow={onBuyNow}
          />
        )}
      </Map>

      {/* Empty state overlay */}
      {mapped.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">No mapped listings yet</p>
          <p className="text-xs text-gray-400 text-center max-w-xs px-4">
            When sellers add a location link to their listing, it will appear as a pin here.
          </p>
        </div>
      )}

      {/* Live count badge */}
      {mapped.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700 shadow-sm pointer-events-none">
          {mapped.length} listing{mapped.length !== 1 ? "s" : ""} on map
        </div>
      )}
    </div>
  );
}
