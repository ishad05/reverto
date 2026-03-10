import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";
import { Button } from "./ui/button";
import { LogOut, Mail, Phone, User } from "lucide-react";
import logo from "../../public/reverto_logo1.svg";

interface UserDoc {
  full_name: string;
  email: string;
  mobile_no?: string;
}

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { currentUser, logout } = useFrappeAuth();
  const { data: user } = useFrappeGetDoc<UserDoc>(
    "User",
    currentUser ?? undefined,
  );

  const initials = (user?.full_name ?? currentUser ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm px-6 h-16 flex items-center justify-between">
        <img src={logo} alt="Reverto" className="w-24" />
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 text-sm"
        >
          ← Back to Marketplace
        </Button>
      </nav>

      <div className="max-w-xl mx-auto py-14 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover band */}
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-green-400" />

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="-mt-10 mb-5">
              <div className="w-20 h-20 bg-emerald-700 rounded-full border-4 border-white shadow flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
              {user?.full_name ?? currentUser}
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              {user?.email ?? currentUser}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">
                    Full name
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {user?.full_name ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {user?.email ?? currentUser ?? "—"}
                  </p>
                </div>
              </div>

              {user?.mobile_no && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Phone</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {user.mobile_no}
                    </p>
                  </div>
                </div>
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
