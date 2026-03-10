import { useState } from "react";
import { useFrappeAuth } from "frappe-react-sdk";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import logo from "../../../public/reverto_logo1.svg";

interface LoginFormProps {
  onNavigateToSignup: () => void;
  onSuccess: () => void;
}

export function LoginForm({ onNavigateToSignup, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useFrappeAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username: email, password });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Invalid email or password. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="flex flex-col justify-center h-full min-h-screen px-14 py-10">
      <div className="max-w-sm w-full mx-auto">
        <img src={logo} alt="Reverto" className="w-28 mb-10" />

        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="login-email"
              className="text-sm font-semibold text-gray-800"
            >
              Email address
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-gray-100 border-0 rounded-lg focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="login-password"
                className="text-sm font-semibold text-gray-800"
              >
                Password
              </Label>
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={isLoading}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onNavigateToSignup}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
