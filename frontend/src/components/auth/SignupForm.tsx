import { useState } from "react";
import { useFrappePostCall } from "frappe-react-sdk";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import logo from "../../../public/reverto_logo1.svg";

interface SignupFormProps {
  onNavigateToLogin: () => void;
}

type AccountType = "Buyer" | "Seller";

export function SignupForm({ onNavigateToLogin }: SignupFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Buyer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { call: createAccount, loading } = useFrappePostCall<{
    message: string;
  }>("reverto.api.auth.signup");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await createAccount({
        full_name: fullName,
        email,
        phone,
        account_type: accountType,
        password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Could not create account. Please try again.";
      setError(msg);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col justify-center h-full min-h-screen px-14 py-10">
        <div className="max-w-sm w-full mx-auto text-center">
          <img src={logo} alt="Reverto" className="w-28 mb-10 mx-auto" />
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account created!
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Your account has been created successfully. Sign in to get started.
          </p>
          <Button
            onClick={onNavigateToLogin}
            className="bg-emerald-700 hover:bg-emerald-800 h-12 px-8"
          >
            Sign in now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-14 py-10">
      <div className="max-w-sm w-full mx-auto">
        <img src={logo} alt="Reverto" className="w-28 mb-8" />

        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Create an account
        </h1>
        <p className="text-gray-500 text-sm mb-7">
          Start your journey towards a sustainable future
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="signup-name"
              className="text-sm font-semibold text-gray-800"
            >
              Full name
            </Label>
            <Input
              id="signup-name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="signup-email"
              className="text-sm font-semibold text-gray-800"
            >
              Email address
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="signup-phone"
              className="text-sm font-semibold text-gray-800"
            >
              Phone number
            </Label>
            <Input
              id="signup-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-800">
              Account type
            </Label>
            <RadioGroup
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
              className="flex gap-3"
            >
              {(["Buyer", "Seller"] as AccountType[]).map((type) => (
                <label
                  key={type}
                  htmlFor={`type-${type}`}
                  className={`flex items-center gap-2 flex-1 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    accountType === type
                      ? "border-gray-900 bg-white"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <span className="text-sm font-medium text-gray-800">
                    {type}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="signup-password"
              className="text-sm font-semibold text-gray-800"
            >
              Password
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="signup-confirm"
              className="text-sm font-semibold text-gray-800"
            >
              Confirm password
            </Label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onNavigateToLogin}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
