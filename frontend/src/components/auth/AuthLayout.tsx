interface AuthLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function AuthLayout({ left, right }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="flex flex-col">{left}</div>
      <div className="flex flex-col">{right}</div>
    </div>
  );
}
