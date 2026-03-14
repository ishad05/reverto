import { useState } from "react";
import { useFrappeAuth, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  LogOut,
  Mail,
  Phone,
  User,
  Building2,
  MapPin,
  FileText,
  Camera,
  Pencil,
  Check,
  X,
  Star,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logo from "../../public/reverto_logo1.svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MyProfile {
  account_type: string;
  full_name: string;
  first_name: string;
  email: string;
  mobile_no: string;
  user_image: string;
  // seller only
  enterprise_name?: string;
  location?: string;
  about?: string;
  avg_rating?: number;
  rating_count?: number;
  profile_image?: string;
}

type FrappeResp<T> = { message: T };

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-sm font-semibold text-gray-800 ml-1">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
      <span className="text-xs text-gray-400">({count} review{count !== 1 ? "s" : ""})</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editable field row
// ---------------------------------------------------------------------------

interface EditableFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
}

function EditableField({ icon, label, value, onSave, placeholder, multiline }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
        {editing ? (
          <div className="space-y-2">
            {multiline ? (
              <textarea
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            ) : (
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                className="text-sm h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-900 font-medium">
              {value || <span className="text-gray-400 italic">{placeholder ?? "Not set"}</span>}
            </p>
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { currentUser, logout } = useFrappeAuth();
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, mutate } = useFrappeGetCall<FrappeResp<MyProfile>>(
    "reverto.api.profile.get_my_profile",
    {},
  );
  const profile = data?.message;

  const { call: updateProfile } = useFrappePostCall(
    "reverto.api.profile.update_my_profile",
  );

  const isSeller = profile?.account_type === "Seller";
  const displayImage = profile?.profile_image || profile?.user_image || "";

  const initials = (profile?.full_name ?? currentUser ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleUpdate = async (field: string, value: string) => {
    await updateProfile({ [field]: value });
    mutate();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const csrf =
        document.cookie
          .split("; ")
          .find((r) => r.startsWith("X-Frappe-CSRF-Token="))
          ?.split("=")[1] ?? "";

      const form = new FormData();
      form.append("file", file);
      form.append("is_private", "0");
      const res = await fetch("/api/method/upload_file", {
        method: "POST",
        credentials: "include",
        headers: { "X-Frappe-CSRF-Token": csrf },
        body: form,
      });
      const data = await res.json();
      const url = data.message?.file_url;
      if (url) {
        await updateProfile({ profile_image: url });
        mutate();
      }
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm px-6 h-16 flex items-center justify-between">
        <img src={logo} alt="Reverto" className="w-24" />
        <Button variant="ghost" onClick={onBack} className="text-gray-600 text-sm">
          ← Back
        </Button>
      </nav>

      <div className="max-w-xl mx-auto py-14 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover band */}
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-green-400" />

          <div className="px-8 pb-8">
            {/* Avatar + image upload */}
            <div className="-mt-10 mb-5 relative inline-block">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={profile?.full_name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-emerald-700 rounded-full border-4 border-white shadow flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors">
                {uploadingImage ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name ?? currentUser}
                </h1>
                <p className="text-sm text-gray-400">{profile?.email ?? currentUser}</p>
              </div>
              <span
                className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isSeller
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-blue-50 text-blue-700 border-blue-100"
                }`}
              >
                {isSeller ? "Seller" : "Buyer"}
              </span>
            </div>

            {/* Seller rating */}
            {isSeller && (profile?.avg_rating ?? 0) >= 0 && (
              <div className="mt-2 mb-6">
                <StarRating
                  value={profile?.avg_rating ?? 0}
                  count={profile?.rating_count ?? 0}
                />
              </div>
            )}

            <div className="mt-6 space-y-3">
              {/* Full name */}
              <EditableField
                icon={<User className="w-4 h-4 text-emerald-700" />}
                label="Full name"
                value={profile?.full_name ?? ""}
                placeholder="Your full name"
                onSave={(v) => handleUpdate("full_name", v)}
              />

              {/* Email (read-only) */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm text-gray-900 font-medium">{profile?.email ?? currentUser ?? "—"}</p>
                </div>
              </div>

              {/* Phone */}
              <EditableField
                icon={<Phone className="w-4 h-4 text-emerald-700" />}
                label="Phone"
                value={profile?.mobile_no ?? ""}
                placeholder="Your phone number"
                onSave={(v) => handleUpdate("mobile_no", v)}
              />

              {/* Seller-only fields */}
              {isSeller && (
                <>
                  <EditableField
                    icon={<Building2 className="w-4 h-4 text-emerald-700" />}
                    label="Enterprise / Company name"
                    value={profile?.enterprise_name ?? ""}
                    placeholder="Your company or enterprise name"
                    onSave={(v) => handleUpdate("enterprise_name", v)}
                  />
                  <EditableField
                    icon={<MapPin className="w-4 h-4 text-emerald-700" />}
                    label="Location (City / Region)"
                    value={profile?.location ?? ""}
                    placeholder="e.g. Mumbai, Maharashtra"
                    onSave={(v) => handleUpdate("location", v)}
                  />
                  <EditableField
                    icon={<FileText className="w-4 h-4 text-emerald-700" />}
                    label="About"
                    value={profile?.about ?? ""}
                    placeholder="Tell buyers about your business..."
                    multiline
                    onSave={(v) => handleUpdate("about", v)}
                  />
                </>
              )}
            </div>

            <Button
              onClick={logout}
              variant="outline"
              className="mt-8 w-full h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
