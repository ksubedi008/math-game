"use client";

import { useState } from "react";
import { loginAdmin } from "./login-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function AdminLogin() {
  const [pass, setPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await loginAdmin(pass);
    
    if (result?.error) {
      toast.error(result.error);
    }
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
            />
            <Button type="submit" className="w-full">Enter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
