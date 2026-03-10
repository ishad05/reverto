import { AuthLayout } from "../components/auth/AuthLayout";
import { BrandingPanel } from "../components/auth/BrandingPanel";
import { SignupForm } from "../components/auth/SignupForm";

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

export function SignupPage({ onNavigateToLogin }: SignupPageProps) {
  return (
    <AuthLayout
      left={<BrandingPanel variant="signup" />}
      right={<SignupForm onNavigateToLogin={onNavigateToLogin} />}
    />
  );
}
