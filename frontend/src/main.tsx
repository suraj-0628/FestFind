import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { AdminApp } from "./admin/AdminApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/globals.css";

const isAdminRoute = window.location.pathname === "/hq-9f3k" || window.location.pathname.startsWith("/hq-9f3k/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isAdminRoute ? <AuthProvider><AdminApp /></AuthProvider> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
