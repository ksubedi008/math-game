"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

function generateProblem() {
  const isAddition = Math.random() > 0.5;
  let num1 = Math.floor(Math.random() * 100) + 1;
  let num2 = Math.floor(Math.random() * 100) + 1;
  if (!isAddition && num1 < num2) {
    const temp = num1;
    num1 = num2;
    num2 = temp;
  }
  return {
    num1,
    num2,
    operator: isAddition ? "+" : "-",
    answer: isAddition ? num1 + num2 : num1 - num2,
  };
}

export async function makeMove(gameId: string, answer: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).then(r => r[0]);
  if (!gameRecord) throw new Error("Game not found");
  if (gameRecord.status !== "playing") throw new Error("Game is not active");

  const roomState = JSON.parse(gameRecord.roomState);
  
  if (roomState.turn !== session.user.id) throw new Error("Not your turn");

  const isCorrect = answer === roomState.problem.answer;
  
  roomState.moves.push({
    player: session.user.id,
    problem: `${roomState.problem.num1} ${roomState.problem.operator} ${roomState.problem.num2}`,
    answer: answer,
    correct: isCorrect
  });

  if (isCorrect) {
    roomState.scores[session.user.id] += 1;
  }

  const opponentId = session.user.id === gameRecord.player1Id ? gameRecord.player2Id : gameRecord.player1Id;
  roomState.turn = opponentId;

  let newStatus = gameRecord.status;
  let winnerId = null;

  if (roomState.scores[session.user.id] >= 3) {
    newStatus = "finished";
    winnerId = session.user.id;
  } else {
    // Generate new problem for the next turn
    roomState.problem = generateProblem();
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
