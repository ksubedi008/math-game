"use client";

import { useState } from "react";
import { searchUsers, sendFriendRequest, acceptFriendRequest, challengeFriend } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export function FriendsList({ friends }: { friends: {id: string, username: string}[] }) {
  const handleChallenge = async (id: string) => {
    const result = await challengeFriend(id);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Friends</CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-muted-foreground text-sm">You have no friends yet. Search for some above!</p>
        ) : (
          <div className="space-y-3">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-lg">{friend.username}</span>
                </div>
                <Button onClick={() => handleChallenge(friend.id)} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md">
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
