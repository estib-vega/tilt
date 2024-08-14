import React from "react";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";

const LoginPage = () => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = () => {
    login();
    setIsLoggingIn(true);
  };

  return (
    <div className="h-full flex flex-col flex-grow-0 overflow-hidden">
      <div className="container flex flex-col justify-center items-center gap-4 py-4">
        <h1 className="text-2xl">Login</h1>
        <Button onClick={handleLogin} disabled={isLoggingIn}>
          Login
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
