import React from "react";
import { Button } from "./Button";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-slate-100">Projects</span>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={handleLogin}>
            Login
          </Button>
        )}
      </div>
    </header>
  );
};
