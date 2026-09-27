"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

export async function submitMove(gameId: string, selectedOptions: number[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  if (!selectedOptions || selectedOptions.length < 2) {
    throw new Error("You must select at least two numbers.");
  }

  const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!gameRecord) throw new Error("Game not found");
  if (gameRecord.status !== "playing") throw new Error("Game is not active");

  const roomState = JSON.parse(gameRecord.roomState);
  if (roomState.turn !== userId) throw new Error("Not your turn");

  const availableNumbers = gameRecord.availableNumbers as number[];
  const targetNumber = gameRecord.targetNumber;
  
  // Verify all selected options are actually available
  for (const num of selectedOptions) {
    if (!availableNumbers.includes(num)) {
      throw new Error("One or more selected numbers are no longer available.");
    }
  }

  const sum = selectedOptions.reduce((acc, curr) => acc + curr, 0);
  const isCorrect = sum === targetNumber;

  const isPlayer1 = userId === gameRecord.player1Id;
  const opponentId = isPlayer1 ? gameRecord.player2Id : gameRecord.player1Id;

  let newAvailable = [...availableNumbers];
  let p1Score = gameRecord.player1Score;
  let p2Score = gameRecord.player2Score;

  if (isCorrect) {
    // Remove selected numbers
    newAvailable = newAvailable.filter(n => !selectedOptions.includes(n));
    // Award point
    if (isPlayer1) p1Score += 1;
    else p2Score += 1;
  }

  roomState.moves.push({
    player: userId,
    selected: selectedOptions,
    isCorrect
  });

  roomState.turn = opponentId;
  let newStatus = gameRecord.status;
  let winnerId = null;

  // Check if no more moves can be made (optional, but let's keep it simple: end game if not enough numbers left)
  // For now, let's say the game ends if available numbers are exhausted or no combination exists.
  // The instructions don't specify when the game ends, but we'll end it if there are < 2 numbers left.
  if (newAvailable.length < 2) {
    newStatus = "finished";
    if (p1Score > p2Score) winnerId = gameRecord.player1Id;
    else if (p2Score > p1Score) winnerId = gameRecord.player2Id;
    // Tie is handled as null winnerId, but we can set it to someone if needed. Let's just leave null for tie.
  }

  // Update DB
  await db.update(games)
    .set({
      roomState: JSON.stringify(roomState),
      status: newStatus,
      winnerId: winnerId,
      availableNumbers: newAvailable,
      player1Score: p1Score,
      player2Score: p2Score
    })
    .where(eq(games.id, gameId));

  if (newStatus === "finished" && winnerId) {
    const loserId = winnerId === gameRecord.player1Id ? gameRecord.player2Id : gameRecord.player1Id;
    const winnerRecord = await db.select().from(users).where(eq(users.id, winnerId)).then(r => r[0]);
    const loserRecord = await db.select().from(users).where(eq(users.id, loserId)).then(r => r[0]);

    await db.update(users).set({ wins: winnerRecord.wins + 1 }).where(eq(users.id, winnerId));
    await db.update(users).set({ losses: loserRecord.losses + 1 }).where(eq(users.id, loserId));
  }

  // Sync to pusher
  await pusherServer.trigger(`game-${gameId}`, "game-updated", {
    roomState,
    status: newStatus,
    winnerId,
    availableNumbers: newAvailable,
    player1Score: p1Score,
    player2Score: p2Score,
    targetNumber
  });

  return { success: true, isCorrect };
}
