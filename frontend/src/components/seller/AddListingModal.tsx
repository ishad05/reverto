import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
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
  name?: string; // only in edit mode
  product_name: string;
  category: string;
  quantity: number;
  price_per_quantity: number;
  status: string;
  product_image?: string;
}

interface AddListingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: ProductFormData | null;
}

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
          // upload failed — proceed without image
          imageUrl = undefined;
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        product_name: productName.trim(),
        category,
        quantity: Number(quantity),
        price_per_quantity: Number(price),
        status,
        product_image: imageUrl ?? "",
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
      <DialogContent className="sm:max-w-lg">
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

          {/* Status — only in edit mode */}
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
