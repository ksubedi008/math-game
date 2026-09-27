"use client";

import { useState } from "react";
import { loginAdmin } from "./login-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const [pass, setPass] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAdmin(pass);
      toast.success("Logged in to admin");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
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
