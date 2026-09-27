import { pgTable, text, integer, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

// Users table to store player accounts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash"), // Needed if using credentials auth, or we can use oauth. We'll add this for simple credentials.
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Friendships table to manage social connections
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // e.g., 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Games table to track active and finished matches
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  player1Id: uuid("player1_id").references(() => users.id).notNull(),
  player2Id: uuid("player2_id").references(() => users.id).notNull(),
  roomState: text("room_state").notNull(), // JSON string to store the current board numbers and whose turn it is
  status: text("status").notNull(), // 'waiting', 'playing', 'finished'
  winnerId: uuid("winner_id").references(() => users.id),
  targetNumber: integer("target_number").default(50).notNull(),
  availableNumbers: jsonb("available_numbers").$type<number[]>().default([]).notNull(),
  player1Hand: jsonb("player1_hand").$type<number[]>().default([]).notNull(),
  player2Hand: jsonb("player2_hand").$type<number[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
