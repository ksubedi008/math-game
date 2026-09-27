import { cookies } from "next/headers";
import { db } from "@/db";
import { users, games } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AdminLogin } from "./admin-login";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  const cookieStore = cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === process.env.ADMIN_PASSPHRASE;

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const allUsers = await db.select().from(users).orderBy(desc(users.wins));
  const liveGames = await db.select().from(games).where(eq(games.status, "playing"));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Secret Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Live Games ({liveGames.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {liveGames.map(game => (
              <div key={game.id} className="p-3 border-b last:border-0 flex justify-between items-center">
                <span className="font-mono text-sm">{game.id}</span>
                <span className="text-green-500 font-semibold text-sm animate-pulse">Playing</span>
              </div>
            ))}
            {liveGames.length === 0 && <p className="text-slate-500 text-sm">No live games right now.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allUsers.map((u, i) => (
                <div key={u.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
                  <div className="flex gap-4 items-center">
                    <span className="font-bold text-slate-400">#{i + 1}</span>
                    <span className="font-semibold">{u.username}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600 font-bold">{u.wins}W</span> / <span className="text-red-500 font-bold">{u.losses}L</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
