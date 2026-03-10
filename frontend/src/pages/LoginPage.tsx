import { AuthLayout } from "../components/auth/AuthLayout";
import { BrandingPanel } from "../components/auth/BrandingPanel";
import { LoginForm } from "../components/auth/LoginForm";

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onSuccess: () => void;
}

export function LoginPage({ onNavigateToSignup, onSuccess }: LoginPageProps) {
  return (
    <AuthLayout
      left={
        <LoginForm
          onNavigateToSignup={onNavigateToSignup}
          onSuccess={onSuccess}
        />
      }
      right={<BrandingPanel variant="login" />}
    />
  );
}
