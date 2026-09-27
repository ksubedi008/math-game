"use client";

import { useState, useEffect } from "react";
import { searchUsers, sendFriendRequest, acceptFriendRequest, challengeFriend, acceptGame, declineGame } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { pusherClient } from "@/lib/pusher-client";

export function SearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{id: string, username: string}[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await searchUsers(query);
      setResults(res);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAdd = async (id: string) => {
    try {
      await sendFriendRequest(id);
      toast.success("Friend request sent!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search username..." 
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="space-y-2">
          {results.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="font-medium">{user.username}</span>
              <Button size="sm" variant="outline" onClick={() => handleAdd(user.id)}>Add Friend</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FriendRequests({ requests }: { requests: {id: string, requester: {id: string, username: string}}[] }) {
  if (requests.length === 0) return null;

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      toast.success("Friend request accepted!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <span className="font-medium">{req.requester.username} wants to be friends.</span>
            <Button size="sm" onClick={() => handleAccept(req.id)}>Accept</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FriendsList({ friends, currentUserId }: { friends: {id: string, username: string}[], currentUserId: string }) {
  const [targetNumberInput, setTargetNumberInput] = useState<string>("50");
  const [pendingChallenge, setPendingChallenge] = useState<any>(null); // For receiving a challenge
  const [waitingGameId, setWaitingGameId] = useState<string | null>(null); // For challenger waiting for accept

  useEffect(() => {
    const channel = pusherClient.subscribe(`user-${currentUserId}`);
    channel.bind("game-challenge", (data: any) => {
      setPendingChallenge(data);
    });

    return () => {
      pusherClient.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (waitingGameId) {
      const channel = pusherClient.subscribe(`game-${waitingGameId}`);
      channel.bind("game-started", () => {
        window.location.href = `/game/${waitingGameId}`;
      });
      channel.bind("game-declined", () => {
        toast.error("Challenge declined.");
        setWaitingGameId(null);
      });
      return () => {
        pusherClient.unsubscribe(`game-${waitingGameId}`);
      };
    }
  }, [waitingGameId]);

  const handleChallenge = async (id: string) => {
    const target = parseInt(targetNumberInput, 10);
    if (isNaN(target) || target < 5) {
      toast.error("Target number must be at least 5.");
      return;
    }
    const result = (await challengeFriend(id, target)) as unknown as { error?: string, gameId?: string };
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.gameId) {
      setWaitingGameId(result.gameId);
      toast.success("Challenge sent! Waiting for response...");
    }
  };

  const onAcceptChallenge = async () => {
    if (!pendingChallenge) return;
    try {
      await acceptGame(pendingChallenge.gameId);
      window.location.href = `/game/${pendingChallenge.gameId}`;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onDeclineChallenge = async () => {
    if (!pendingChallenge) return;
    try {
      await declineGame(pendingChallenge.gameId);
      setPendingChallenge(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Friends</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingChallenge && (
          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-indigo-900 dark:text-indigo-100">{pendingChallenge.challengerName} challenged you!</p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">Target: {pendingChallenge.targetNumber}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onDeclineChallenge}>Decline</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={onAcceptChallenge}>Accept</Button>
            </div>
          </div>
        )}

        {waitingGameId && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-center">
            <span className="font-medium text-amber-800 dark:text-amber-200 animate-pulse">Waiting for friend to accept...</span>
          </div>
        )}

        {friends.length === 0 ? (
          <p className="text-muted-foreground text-sm">You have no friends yet. Search for some above!</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set Game Target:</span>
              <Input 
                type="number" 
                min={5} 
                value={targetNumberInput} 
                onChange={(e) => setTargetNumberInput(e.target.value)} 
                className="w-24"
              />
            </div>
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-lg">{friend.username}</span>
                </div>
                <Button 
                  onClick={() => handleChallenge(friend.id)} 
                  disabled={!!waitingGameId}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md disabled:opacity-50"
                >
                  Challenge
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
