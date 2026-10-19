import { Navigate, useLocation } from "react-router-dom";
import { hasSessionToken } from "../services/auth.js";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasSessionToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
