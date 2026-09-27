"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

export async function makeMove(gameId: string, selectedNumber: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!gameRecord) throw new Error("Game not found");
  if (gameRecord.status !== "playing") throw new Error("Game is not active");

  const roomState = JSON.parse(gameRecord.roomState);
  if (roomState.turn !== userId) throw new Error("Not your turn");

  const availableNumbers = gameRecord.availableNumbers as number[];
  const player1Hand = gameRecord.player1Hand as number[];
  const player2Hand = gameRecord.player2Hand as number[];
  const targetNumber = gameRecord.targetNumber;

  if (!availableNumbers.includes(selectedNumber)) {
    throw new Error("Number is no longer available.");
  }

  // Remove from available
  const newAvailable = availableNumbers.filter(n => n !== selectedNumber);
  
  // Add to active player's hand
  const isPlayer1 = userId === gameRecord.player1Id;
  const myHand = isPlayer1 ? [...player1Hand, selectedNumber] : [...player2Hand, selectedNumber];

  roomState.moves.push({
    player: userId,
    numberClaimed: selectedNumber
  });

  // Check win condition (any combination of 2 or 3 numbers sums to target)
  let hasWon = false;
  for (let i = 0; i < myHand.length; i++) {
    for (let j = i + 1; j < myHand.length; j++) {
      if (myHand[i] + myHand[j] === targetNumber) hasWon = true;
      for (let k = j + 1; k < myHand.length; k++) {
        if (myHand[i] + myHand[j] + myHand[k] === targetNumber) hasWon = true;
      }
    }
  }

  const opponentId = isPlayer1 ? gameRecord.player2Id : gameRecord.player1Id;

  let newStatus = gameRecord.status;
  let winnerId = null;

  if (hasWon) {
    newStatus = "finished";
    winnerId = userId;
  } else {
    roomState.turn = opponentId;
  }

  // Update DB
  await db.update(games)
    .set({
      roomState: JSON.stringify(roomState),
      status: newStatus,
      winnerId: winnerId,
      availableNumbers: newAvailable,
      player1Hand: isPlayer1 ? myHand : player1Hand,
      player2Hand: isPlayer1 ? player2Hand : myHand
    })
    .where(eq(games.id, gameId));

  if (winnerId) {
    const loserId = opponentId;
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
    player1Hand: isPlayer1 ? myHand : player1Hand,
    player2Hand: isPlayer1 ? player2Hand : myHand,
    targetNumber
  });

  return { success: true };
}
