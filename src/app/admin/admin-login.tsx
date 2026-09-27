"use client";

import { useState, useTransition } from "react";
import { loginAdmin } from "./login-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AdminLogin() {
  const [pass, setPass] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await loginAdmin(pass);
      
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Passphrase" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              disabled={isPending}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Enter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
