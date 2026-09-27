import { auth } from "@/auth";
import { db } from "@/db";
import { users, friendships } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SearchUsers, FriendRequests, FriendsList } from "./components";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const userId = session.user.id;
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);

  // Pending requests
  const pendingRequestsRaw = await db.select({
    id: friendships.id,
    requester: {
      id: users.id,
      username: users.username
    }
  })
  .from(friendships)
  .innerJoin(users, eq(users.id, friendships.requesterId))
  .where(and(eq(friendships.receiverId, userId), eq(friendships.status, "pending")));

  // Accepted friends
  const allFriendships = await db.select().from(friendships).where(
    and(
      or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
      eq(friendships.status, "accepted")
    )
  );

  const friendIds = allFriendships.map(f => f.requesterId === userId ? f.receiverId : f.requesterId);
  
  let friendsData: {id: string, username: string}[] = [];
  if (friendIds.length > 0) {
    friendsData = await db.select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.id, friendIds));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome, {userRecord.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Stats: {userRecord.wins} Wins | {userRecord.losses} Losses
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6">
            <FriendRequests requests={pendingRequestsRaw} />
            <FriendsList friends={friendsData} />
          </div>
          <div className="md:col-span-1">
            <SearchUsers />
          </div>
        </div>

      </div>
    </div>
  );
}
