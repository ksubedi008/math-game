import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { GameBoard } from "./board";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const gameId = resolvedParams.id;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const game = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!game) return <div>Game not found</div>;

  if (game.player1Id !== session.user.id && game.player2Id !== session.user.id) {
    return <div>Unauthorized</div>;
  }

  const p1 = await db.select().from(users).where(eq(users.id, game.player1Id)).then(r => r[0]);
  const p2 = await db.select().from(users).where(eq(users.id, game.player2Id)).then(r => r[0]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-10 px-4 md:px-8 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center">
          <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Player 1</span>
          <span className="text-2xl font-black text-indigo-600">{p1.username}</span>
        </div>
        <div className="text-4xl font-black text-slate-300 dark:text-slate-700 italic">VS</div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Player 2</span>
          <span className="text-2xl font-black text-purple-600">{p2.username}</span>
        </div>
      </div>
      
      <GameBoard 
        gameId={game.id} 
        initialRoomState={JSON.parse(game.roomState)}
        status={game.status}
        winnerId={game.winnerId}
        currentUserId={session.user.id}
        player1={{ id: p1.id, username: p1.username }}
        player2={{ id: p2.id, username: p2.username }}
      />
    </div>
  );
}
