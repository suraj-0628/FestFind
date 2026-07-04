import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { AdminApp } from "./admin/AdminApp";
import "./styles/globals.css";

const isAdminRoute = window.location.pathname === "/admin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAdminRoute ? <AuthProvider><AdminApp /></AuthProvider> : <App />}
  </React.StrictMode>
);
