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

export async function challengeFriend(friendId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const initialRoomState = JSON.stringify({
    turn: session.user.id,
    scores: { [session.user.id]: 0, [friendId]: 0 },
    problem: generateProblem(),
    moves: []
  });

  const newGame = await db.insert(games).values({
    player1Id: session.user.id,
    player2Id: friendId,
    roomState: initialRoomState,
    status: "playing"
  }).returning();

  redirect(`/game/${newGame[0].id}`);
}
