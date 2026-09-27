"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

export async function makeMove(gameId: string, selectedNumbers: number[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!gameRecord) throw new Error("Game not found");
  if (gameRecord.status !== "playing") throw new Error("Game is not active");

  const roomState = JSON.parse(gameRecord.roomState);
  
  if (roomState.turn !== session.user.id) throw new Error("Not your turn");

  if (selectedNumbers.length !== 2 && selectedNumbers.length !== 3) {
    throw new Error("You must pick exactly 2 or 3 numbers");
  }
  
  const sum = selectedNumbers.reduce((a, b) => a + b, 0);
  if (sum !== 30) {
    throw new Error("Numbers must sum to 30");
  }

  for (const num of selectedNumbers) {
    if (!roomState.board.includes(num)) {
      throw new Error(`Number ${num} is not on the board`);
    }
  }

  roomState.board = roomState.board.filter((n: number) => !selectedNumbers.includes(n));
  
  const opponentId = session.user.id === gameRecord.player1Id ? gameRecord.player2Id : gameRecord.player1Id;
  roomState.turn = opponentId;

  roomState.moves.push({
    player: session.user.id,
    numbers: selectedNumbers
  });

  let hasValidMove = false;
  const board = roomState.board;
  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) {
      if (board[i] + board[j] === 30) hasValidMove = true;
      for (let k = j + 1; k < board.length; k++) {
         if (board[i] + board[j] + board[k] === 30) hasValidMove = true;
      }
    }
  }

  let newStatus = gameRecord.status;
  let winnerId = null;

  if (!hasValidMove) {
    newStatus = "finished";
    winnerId = session.user.id;
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
