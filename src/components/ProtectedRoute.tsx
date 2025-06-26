
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return <>{children}</>;
}
