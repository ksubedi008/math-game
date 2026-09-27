"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

export async function makeMove(gameId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  if (![1, 2, 3].includes(amount)) {
    throw new Error("Invalid move. You can only add 1, 2, or 3.");
  }

  const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!gameRecord) throw new Error("Game not found");
  if (gameRecord.status !== "playing") throw new Error("Game is not active");

  const roomState = JSON.parse(gameRecord.roomState);
  
  if (roomState.turn !== session.user.id) throw new Error("Not your turn");

  roomState.currentSum += amount;
  
  roomState.moves.push({
    player: session.user.id,
    amountAdded: amount,
    newSum: roomState.currentSum
  });

  const opponentId = session.user.id === gameRecord.player1Id ? gameRecord.player2Id : gameRecord.player1Id;

  let newStatus = gameRecord.status;
  let winnerId = null;

  if (roomState.currentSum >= roomState.target) {
    newStatus = "finished";
    winnerId = session.user.id;
    roomState.scores[session.user.id] += 1;
  } else {
    roomState.turn = opponentId;
  }

  await db.update(games)
    .set({
      roomState: JSON.stringify(roomState),
      status: newStatus,
      winnerId: winnerId
    })
    .where(eq(games.id, gameId));

  if (winnerId) {
    const loserId = opponentId;
    const winnerRecord = await db.select().from(users).where(eq(users.id, winnerId)).then(r => r[0]);
    const loserRecord = await db.select().from(users).where(eq(users.id, loserId)).then(r => r[0]);

    await db.update(users).set({ wins: winnerRecord.wins + 1 }).where(eq(users.id, winnerId));
    await db.update(users).set({ losses: loserRecord.losses + 1 }).where(eq(users.id, loserId));
  }

  await pusherServer.trigger(`game-${gameId}`, "game-updated", {
    roomState,
    status: newStatus,
    winnerId
  });

  return { success: true };
}
