import { useMemo, useState } from "react";
import {
  Package,
  Eye,
  BarChart2,
  TrendingUp,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  MessageSquare,
  ChevronRight,
  ShoppingBag,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Navigation } from "../components/Navigation";
import { CartDrawer } from "../components/CartDrawer";
import { Button } from "../components/ui/button";
import { AddListingModal, type ProductFormData } from "../components/seller/AddListingModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ChatWindow } from "../components/enquiry/ChatWindow";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/seperator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SellerProduct {
  name: string;
  product_name: string;
  category?: string;
  quantity?: number;
  price_per_quantity?: number;
  status: string;
  product_image?: string;
  creation: string;
}

interface SellerEnquiry {
  name: string;
  product_name: string;
  buyer: string;
  quantity_kg: number;
  original_price_per_kg: number;
  agreed_price_per_kg: number | null;
  status: string;
  creation: string;
}

interface SellerOrder {
  name: string;
  product: string;
  product_name: string;
  buyer: string;
  buyer_name: string;
  quantity_kg: number;
  original_price_per_kg: number;
  agreed_price_per_kg: number | null;
  net_revenue: number;
  total_billed: number;
  product_image: string | null;
  creation: string;
}

type FrappeResponse<T> = { message: T };
type FilterTab = "all" | "active" | "pending" | "sold";
type DashboardTab = "listings" | "enquiries" | "orders";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(creation: string): string {
  if (!creation) return "Recently";
  const date = new Date(creation.replace(" ", "T").split(".")[0]);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
}

function formatDate(creation: string): string {
  if (!creation) return "";
  const date = new Date(creation.replace(" ", "T").split(".")[0]);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtRevenue(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

const STATUS_BADGE: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Sold: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  Available: "Active",
  Pending: "Pending",
  Sold: "Sold",
};

const ENQUIRY_BADGE: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-100",
  Negotiating: "bg-amber-50 text-amber-700 border-amber-100",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Rejected: "bg-red-50 text-red-700 border-red-100",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

// ---------------------------------------------------------------------------
// SellerDashboard
// ---------------------------------------------------------------------------

interface SellerDashboardProps {
  firstName: string;
  onProfile: () => void;
  onBrowseMarketplace: () => void;
}

export function SellerDashboard({
  firstName,
  onProfile,
  onBrowseMarketplace,
}: SellerDashboardProps) {
  const [dashTab, setDashTab] = useState<DashboardTab>("listings");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);

  // Fetch products
  const { data, isLoading, mutate } = useFrappeGetCall<FrappeResponse<SellerProduct[]>>(
    "reverto.api.products.my_products",
    {},
  );

  // Fetch enquiries
  const { data: enquiriesData, isLoading: enquiriesLoading, mutate: mutateEnquiries } =
    useFrappeGetCall<FrappeResponse<SellerEnquiry[]>>(
      "reverto.api.enquiry.get_seller_enquiries",
      {},
      undefined,
      { refreshInterval: 10000 },
    );
  const enquiries = enquiriesData?.message ?? [];

  // Fetch completed orders
  const { data: ordersData, isLoading: ordersLoading, mutate: mutateOrders } =
    useFrappeGetCall<FrappeResponse<SellerOrder[]>>(
      "reverto.api.enquiry.get_seller_orders",
      {},
      undefined,
      { refreshInterval: 15000 },
    );
  const orders = ordersData?.message ?? [];

  const { call: deleteProduct } = useFrappePostCall("reverto.api.products.delete_product");

  const products = data?.message ?? [];

  // Stats
  const activeProducts = useMemo(() => products.filter((p) => p.status === "Available"), [products]);
  const revenueEarned = useMemo(
    () => orders.reduce((sum, o) => sum + (o.net_revenue || 0), 0),
    [orders],
  );
  const totalKgSold = useMemo(
    () => orders.reduce((sum, o) => sum + (o.quantity_kg || 0), 0),
    [orders],
  );
  const newThisWeek = useMemo(
    () =>
      products.filter((p) => {
        const diffDays = Math.floor(
          (Date.now() - new Date(p.creation.replace(" ", "T").split(".")[0]).getTime()) / 86_400_000,
        );
        return diffDays < 7;
      }).length,
    [products],
  );

  // Filtered listings
  const filtered = useMemo(() => {
    let list = products;
    if (filterTab === "active") list = list.filter((p) => p.status === "Available");
    else if (filterTab === "pending") list = list.filter((p) => p.status === "Pending");
    else if (filterTab === "sold") list = list.filter((p) => p.status === "Sold");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filterTab, search]);

  const handleDelete = async (name: string) => {
    if (!window.confirm("Delete this listing?")) return;
    await deleteProduct({ name });
    mutate();
  };

  const openAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: SellerProduct) => {
    setEditingProduct({
      name: p.name,
      product_name: p.product_name,
      category: p.category ?? "",
      quantity: p.quantity ?? 0,
      price_per_quantity: p.price_per_quantity ?? 0,
      status: p.status,
      product_image: p.product_image ?? "",
    });
    setIsModalOpen(true);
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "sold", label: "Sold" },
  ];

  const activeEnquiryCount = enquiries.filter(
    (e) => e.status === "Open" || e.status === "Negotiating",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <CartDrawer />
      <Navigation
        onProfileClick={onProfile}
        sellerTabs={{
          currentTab: "listings",
          onListings: () => {},
          onMarketplace: onBrowseMarketplace,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName || "Producer"}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your waste listings and track your impact
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Listings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Active Listings</span>
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            {isLoading ? (
              <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{activeProducts.length}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {newThisWeek > 0 ? `${newThisWeek} new this week` : "No new listings this week"}
            </p>
          </div>

          {/* Total Views (placeholder) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Total Views</span>
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Coming soon</p>
          </div>

          {/* Total Inquiries — click to open enquiries tab */}
          <div
            className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-purple-200 transition-colors"
            onClick={() => setDashTab("enquiries")}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Total Inquiries</span>
              <BarChart2 className="w-5 h-5 text-purple-400" />
            </div>
            {enquiriesLoading ? (
              <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{enquiries.length}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {activeEnquiryCount} active
            </p>
          </div>

          {/* Revenue Earned — click to open orders tab */}
          <div
            className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-emerald-200 transition-colors"
            onClick={() => setDashTab("orders")}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Revenue Earned</span>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            {ordersLoading ? (
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{fmtRevenue(revenueEarned)}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {orders.length} completed order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Dashboard tab switcher */}
        <div className="flex gap-2 border-b border-gray-200">
          {(["listings", "enquiries", "orders"] as DashboardTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setDashTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                dashTab === tab
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "listings" ? "My Listings" : tab === "enquiries" ? "Enquiries" : "Orders"}
              {tab === "enquiries" && activeEnquiryCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  {activeEnquiryCount}
                </span>
              )}
              {tab === "orders" && orders.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-1">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── My Listings ── */}
        {dashTab === "listings" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 mr-2">My Listings</h2>
                {FILTER_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilterTab(t.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filterTab === t.key
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={openAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add New Listing
              </Button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your listings..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Loading listings…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    {search || filterTab !== "all" ? "No listings match your filter" : "No listings yet"}
                  </p>
                  <p className="text-sm text-gray-400 max-w-xs">
                    {filterTab === "all" && !search
                      ? "Click \"Add New Listing\" to post your first waste product."
                      : "Try clearing the search or selecting a different filter."}
                  </p>
                  {filterTab === "all" && !search && (
                    <Button
                      onClick={openAdd}
                      className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add New Listing
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map((product) => (
                  <div key={product.name} className="px-6 py-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.product_image ? (
                          <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {product.product_name}
                          </h3>
                          <span
                            className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full border ${
                              STATUS_BADGE[product.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABEL[product.status] ?? product.status}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          {product.category && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {product.category}
                            </span>
                          )}
                          {product.quantity != null && <span>{product.quantity} kg</span>}
                          {product.price_per_quantity != null && (
                            <span>• ₹{product.price_per_quantity}/kg</span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />0 views
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart2 className="w-3.5 h-3.5" />0 inquiries
                          </span>
                          <span>Posted {timeAgo(product.creation)}</span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-100 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Enquiries ── */}
        {dashTab === "enquiries" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Incoming Enquiries</h2>
              <button
                onClick={() => mutateEnquiries()}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Refresh
              </button>
            </div>

            {enquiriesLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading enquiries…</span>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-gray-600 font-medium">No enquiries yet</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  When buyers enquire about your products, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {enquiries.map((enq) => (
                  <div key={enq.name} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{enq.product_name}</p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                              ENQUIRY_BADGE[enq.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {enq.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {enq.quantity_kg} kg · {fmt(enq.original_price_per_kg)}/kg
                          {enq.agreed_price_per_kg ? (
                            <span className="ml-1 text-emerald-600 font-medium">
                              → Agreed: {fmt(enq.agreed_price_per_kg)}/kg
                            </span>
                          ) : null}
                          <span className="ml-2 text-gray-400">· {timeAgo(enq.creation)}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Buyer: {enq.buyer}</p>
                      </div>
                      <button
                        onClick={() => setActiveEnquiryId(enq.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Orders ── */}
        {dashTab === "orders" && (
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Confirmed Orders</h2>
                {orders.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">({orders.length})</span>
                )}
              </div>
              <button
                onClick={() => mutateOrders()}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Refresh
              </button>
            </div>

            {/* Revenue summary */}
            {orders.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Total Revenue</p>
                    <p className="text-xl font-bold text-emerald-700">{fmtRevenue(revenueEarned)}</p>
                    <p className="text-xs text-gray-400">pre-GST</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-orange-600 font-medium mb-0.5">Kg Sold</p>
                    <p className="text-xl font-bold text-orange-700">{totalKgSold.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-400">total weight</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Orders</p>
                    <p className="text-xl font-bold text-blue-700">{orders.length}</p>
                    <p className="text-xs text-gray-400">completed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order list */}
            {ordersLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading orders…</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-orange-300" />
                </div>
                <p className="text-gray-600 font-medium">No completed orders yet</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Once buyers confirm payment on your listings, their orders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const effectivePrice =
                    order.agreed_price_per_kg || order.original_price_per_kg;
                  const subtotal = effectivePrice * order.quantity_kg;
                  const gst = subtotal * 0.18;

                  return (
                    <div key={order.name} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Product image */}
                        {order.product_image ? (
                          <img
                            src={order.product_image}
                            alt={order.product_name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100 border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                            <IndianRupee className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {order.product_name}
                            </p>
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Sold
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.quantity_kg} kg · {fmtFull(effectivePrice)}/kg
                            {order.agreed_price_per_kg && order.agreed_price_per_kg !== order.original_price_per_kg && (
                              <span className="ml-1 text-gray-400 line-through">
                                {fmtFull(order.original_price_per_kg)}/kg
                              </span>
                            )}
                          </p>

                          <p className="text-xs text-gray-400 mt-0.5">
                            Buyer: <span className="text-gray-600">{order.buyer_name || order.buyer}</span>
                            {order.creation && (
                              <span className="ml-2">· {formatDate(order.creation)}</span>
                            )}
                          </p>

                          {/* Revenue breakdown */}
                          <div className="mt-2 bg-white border border-gray-100 rounded-lg px-3 py-2 space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Subtotal (your revenue)</span>
                              <span>{fmtFull(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>GST collected (18%)</span>
                              <span>{fmtFull(gst)}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between text-xs font-bold text-emerald-700">
                              <span>Buyer Paid</span>
                              <span>{fmtFull(order.total_billed)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <AddListingModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => mutate()}
        editingProduct={editingProduct}
      />

      {/* Enquiry chat dialog */}
      <Dialog
        open={!!activeEnquiryId}
        onOpenChange={(v) => !v && setActiveEnquiryId(null)}
      >
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Enquiry Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {activeEnquiryId && (
              <ChatWindow key={activeEnquiryId} enquiryId={activeEnquiryId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
