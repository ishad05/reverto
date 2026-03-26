import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useFrappePostCall } from "frappe-react-sdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const CATEGORIES = [
  "Plastic",
  "E-waste",
  "Metal",
  "Paper",
  "Organic",
  "Construction",
  "Textile",
  "Glass",
];

const STATUS_OPTIONS = [
  { value: "Available", label: "Active" },
  { value: "Pending", label: "Pending" },
  { value: "Sold", label: "Sold" },
];

export interface ProductFormData {
  name?: string;
  product_name: string;
  category: string;
  quantity: number;
  price_per_quantity: number;
  status: string;
  product_image?: string;
  location_url?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ---------------------------------------------------------------------------
// Client-side coordinate parser — mirrors the Python backend logic
// ---------------------------------------------------------------------------

const SHORT_URL_PATTERN = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i;

function isShortMapUrl(url: string): boolean {
  return SHORT_URL_PATTERN.test(url.trim());
}

function parseCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url.trim()) return null;
  url = url.trim();

  // Short URLs (maps.app.goo.gl, goo.gl/maps) can't be resolved in the browser —
  // the backend will follow the redirect on save.
  if (isShortMapUrl(url)) return null;

  // Google Maps @lat,lng  (place / directions)
  let m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // Query string ?q=, ?ll=, ?center=, ?query=
  try {
    const qs = new URL(url).searchParams;
    for (const key of ["q", "ll", "center", "query"]) {
      const val = qs.get(key);
      if (val) {
        const parts = val.split(",");
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }
      }
    }
  } catch {
    // not a valid URL — try other patterns
  }

  // OpenStreetMap  #map=zoom/lat/lng
  m = url.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // Bare decimal pair  "12.9716, 77.5946"
  m = url.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  return null;
}

function formatCoord(n: number, pos: string, neg: string) {
  return `${Math.abs(n).toFixed(4)}° ${n >= 0 ? pos : neg}`;
}

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

async function uploadImageToFrappe(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("is_private", "0");
  formData.append("folder", "Home/Attachments");

  const res = await fetch("/api/method/upload_file", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.message?.file_url) {
    throw new Error(data.message || "Image upload failed");
  }
  return data.message.file_url as string;
}

// ---------------------------------------------------------------------------
// AddListingModal
// ---------------------------------------------------------------------------

interface AddListingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: ProductFormData | null;
}

export function AddListingModal({
  open,
  onClose,
  onSuccess,
  editingProduct,
}: AddListingModalProps) {
  const isEdit = Boolean(editingProduct?.name);

  const [productName, setProductName] = useState(editingProduct?.product_name ?? "");
  const [category, setCategory] = useState(editingProduct?.category ?? "");
  const [quantity, setQuantity] = useState(editingProduct?.quantity?.toString() ?? "");
  const [price, setPrice] = useState(editingProduct?.price_per_quantity?.toString() ?? "");
  const [status, setStatus] = useState(editingProduct?.status ?? "Available");
  const [imagePreview, setImagePreview] = useState<string>(editingProduct?.product_image ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationUrl, setLocationUrl] = useState(editingProduct?.location_url ?? "");
  const [parsedCoords, setParsedCoords] = useState<{ lat: number; lng: number } | null>(
    editingProduct?.latitude && editingProduct?.longitude
      ? { lat: editingProduct.latitude, lng: editingProduct.longitude }
      : null,
  );
  const [coordParseError, setCoordParseError] = useState(false);
  const [isShortUrl, setIsShortUrl] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { call: createProduct, loading: creating } = useFrappePostCall(
    "reverto.api.products.create_product",
  );
  const { call: updateProduct, loading: updating } = useFrappePostCall(
    "reverto.api.products.update_product",
  );

  const isBusy = uploading || creating || updating;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLocationUrlChange = (val: string) => {
    setLocationUrl(val);
    if (!val.trim()) {
      setParsedCoords(null);
      setCoordParseError(false);
      setIsShortUrl(false);
      return;
    }
    if (isShortMapUrl(val)) {
      setParsedCoords(null);
      setCoordParseError(false);
      setIsShortUrl(true);
      return;
    }
    setIsShortUrl(false);
    const coords = parseCoordsFromUrl(val);
    if (coords) {
      setParsedCoords(coords);
      setCoordParseError(false);
    } else {
      setParsedCoords(null);
      setCoordParseError(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productName.trim()) return setError("Product name is required.");
    if (!category) return setError("Please select a category.");
    if (!quantity || Number(quantity) <= 0) return setError("Enter a valid quantity.");
    if (!price || Number(price) <= 0) return setError("Enter a valid price per kg.");

    try {
      let imageUrl: string | undefined = editingProduct?.product_image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImageToFrappe(imageFile);
        } catch {
          imageUrl = undefined;
        } finally {
          setUploading(false);
        }
      }

      const payload: Record<string, unknown> = {
        product_name: productName.trim(),
        category,
        quantity: Number(quantity),
        price_per_quantity: Number(price),
        status,
        product_image: imageUrl ?? "",
        location_url: locationUrl.trim() || "",
        latitude: parsedCoords?.lat ?? null,
        longitude: parsedCoords?.lng ?? null,
      };

      if (isEdit && editingProduct?.name) {
        await updateProduct({ name: editingProduct.name, ...payload });
      } else {
        await createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Something went wrong. Please try again.";
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Listing" : "Add New Listing"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Image upload */}
          <div>
            <Label className="mb-1.5 block">Product Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-600 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs text-gray-400">PNG, JPG up to 5 MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Product name */}
          <div>
            <Label htmlFor="product_name" className="mb-1.5 block">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product_name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Clean HDPE Plastic Waste"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="mb-1.5 block">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity + Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="mb-1.5 block">
                Quantity (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 250"
              />
            </div>
            <div>
              <Label htmlFor="price" className="mb-1.5 block">
                Price / kg (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          {/* Status — edit mode only */}
          {isEdit && (
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Location ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Location</span>
              <span className="text-xs text-gray-400">(optional — helps buyers find you on the map)</span>
            </div>

            <div>
              <Label htmlFor="location_url" className="mb-1.5 block text-sm">
                Google Maps or OpenStreetMap link
              </Label>
              <Input
                id="location_url"
                value={locationUrl}
                onChange={(e) => handleLocationUrlChange(e.target.value)}
                placeholder="https://maps.google.com/maps?q=12.9716,77.5946"
                className={
                  locationUrl && coordParseError
                    ? "border-amber-300 focus-visible:ring-amber-400"
                    : locationUrl && parsedCoords
                      ? "border-emerald-300 focus-visible:ring-emerald-400"
                      : ""
                }
              />

              {/* Coord preview — success */}
              {parsedCoords && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-emerald-700 font-medium">
                    {formatCoord(parsedCoords.lat, "N", "S")},{" "}
                    {formatCoord(parsedCoords.lng, "E", "W")}
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/#map=15/${parsedCoords.lat}/${parsedCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-emerald-600 underline hover:text-emerald-800"
                  >
                    Verify ↗
                  </a>
                </div>
              )}

              {/* Short URL — backend will resolve on save */}
              {isShortUrl && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Short link detected — coordinates will be resolved when you save.
                  </p>
                </div>
              )}

              {/* Parse error */}
              {locationUrl && coordParseError && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 space-y-0.5">
                    <p className="font-medium">Couldn't read coordinates from this link.</p>
                    <p className="text-amber-600">
                      Try right-clicking your location on Google Maps → "What's here?" and
                      paste the link from the address bar.
                    </p>
                  </div>
                </div>
              )}

              {/* Helper text when empty */}
              {!locationUrl && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Accepted: Google Maps links, OpenStreetMap links, or plain coordinates like{" "}
                  <span className="font-mono">12.9716, 77.5946</span>
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isBusy}
            >
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Uploading…" : isEdit ? "Saving…" : "Creating…"}
                </span>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Listing"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
