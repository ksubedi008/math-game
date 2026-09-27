"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, friendships, games } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function searchUsers(username: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  if (!username) return [];

  return await db.select({
    id: users.id,
    username: users.username
  }).from(users).where(eq(users.username, username));
}

export async function sendFriendRequest(receiverId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const requesterId = session.user.id;
  if (requesterId === receiverId) throw new Error("Cannot add yourself");

  const existing = await db.select().from(friendships).where(
    or(
      and(eq(friendships.requesterId, requesterId), eq(friendships.receiverId, receiverId)),
      and(eq(friendships.requesterId, receiverId), eq(friendships.receiverId, requesterId))
    )
  );
  
  if (existing.length > 0) throw new Error("Friendship or request already exists");

  await db.insert(friendships).values({
    requesterId,
    receiverId,
    status: "pending"
  });

  revalidatePath("/dashboard");
}

export async function acceptFriendRequest(friendshipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await db.update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, session.user.id)));
    
  revalidatePath("/dashboard");
}

export async function challengeFriend(friendId: string, targetNumber: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const availableNumbers = Array.from({ length: targetNumber - 1 }, (_, i) => i + 1);

  const initialRoomState = JSON.stringify({
    turn: session.user.id,
    moves: []
  });

  const newGame = await db.insert(games).values({
    player1Id: session.user.id,
    player2Id: friendId,
    roomState: initialRoomState,
    status: "playing",
    targetNumber,
    availableNumbers,
    player1Score: 0,
    player2Score: 0
  }).returning();

  redirect(`/game/${newGame[0].id}`);
}
