import { AuthLayout } from "../components/auth/AuthLayout";
import { BrandingPanel } from "../components/auth/BrandingPanel";
import { LoginForm } from "../components/auth/LoginForm";

interface LoginPageProps {
  onNavigateToSignup: () => void;
}

export function LoginPage({ onNavigateToSignup }: LoginPageProps) {
  return (
    <AuthLayout
      left={
        <LoginForm
          onNavigateToSignup={onNavigateToSignup}
        />
      }
      right={<BrandingPanel variant="login" />}
    />
  );
}
