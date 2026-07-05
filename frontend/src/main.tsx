import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { AdminApp } from "./admin/AdminApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/globals.css";

const isAdminRoute = window.location.pathname === "/admin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isAdminRoute ? <AuthProvider><AdminApp /></AuthProvider> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
