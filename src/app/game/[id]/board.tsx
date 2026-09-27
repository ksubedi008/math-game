"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { makeMove } from "./actions";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export function GameBoard({ gameId, initialRoomState, status, winnerId, currentUserId, player1, player2 }: any) {
  const [roomState, setRoomState] = useState(initialRoomState);
  const [gameStatus, setGameStatus] = useState(status);
  const [gameWinnerId, setGameWinnerId] = useState(winnerId);

  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${gameId}`);
    channel.bind("game-updated", (data: any) => {
      setRoomState(data.roomState);
      setGameStatus(data.status);
      setGameWinnerId(data.winnerId);
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  const handleMakeMove = async (amount: number) => {
    try {
      await makeMove(gameId, amount);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isMyTurn = roomState.turn === currentUserId;
  const currentTurnPlayer = roomState.turn === player1.id ? player1.username : player2.username;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 p-4 md:p-8 w-full max-w-4xl">
      
      <div className="flex w-full justify-between items-center bg-slate-200 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <div className="text-xl font-bold">
          {player1.username}: <span className="text-green-500">{roomState.scores[player1.id] || 0}</span>
        </div>
        <div className="text-sm uppercase tracking-widest text-slate-500 font-bold">Wins</div>
        <div className="text-xl font-bold">
          {player2.username}: <span className="text-purple-500">{roomState.scores[player2.id] || 0}</span>
        </div>
      </div>

      <div className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 p-2 text-center">
        {gameStatus === "playing" ? (
          <span>
            {isMyTurn ? "Your turn!" : `Waiting for ${currentTurnPlayer}...`}
          </span>
        ) : (
          <span>
            Game Over! {gameWinnerId === currentUserId ? "You Won!" : "You Lost!"}
          </span>
        )}
      </div>

      <Card className="p-8 w-full shadow-lg border-t-4 border-t-indigo-500 flex flex-col items-center">
        <div className="text-2xl text-slate-500 font-bold mb-2 uppercase tracking-widest">
          Target: {roomState.target}
        </div>
        <div className="text-6xl md:text-8xl font-black mb-8 text-slate-800 dark:text-slate-100">
          {roomState.currentSum}
        </div>

        {gameStatus === "playing" ? (
          <div className="flex gap-4">
            <Button 
              onClick={() => handleMakeMove(1)}
              disabled={!isMyTurn}
              size="lg"
              className="w-24 h-24 text-4xl rounded-2xl bg-blue-500 hover:bg-blue-600 shadow-md"
            >
              +1
            </Button>
            <Button 
              onClick={() => handleMakeMove(2)}
              disabled={!isMyTurn}
              size="lg"
              className="w-24 h-24 text-4xl rounded-2xl bg-indigo-500 hover:bg-indigo-600 shadow-md"
            >
              +2
            </Button>
            <Button 
              onClick={() => handleMakeMove(3)}
              disabled={!isMyTurn}
              size="lg"
              className="w-24 h-24 text-4xl rounded-2xl bg-purple-500 hover:bg-purple-600 shadow-md"
            >
              +3
            </Button>
          </div>
        ) : (
          <div className="text-3xl text-slate-500">Match concluded.</div>
        )}
      </Card>

      <div className="text-center flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full justify-center items-center">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            size="lg"
            variant="destructive"
            className="w-full md:w-64 text-lg h-12 md:h-14 shadow-lg"
          >
            Leave Match
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border p-5 rounded-xl h-[250px] overflow-y-auto mt-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg text-slate-700 dark:text-slate-300 border-b pb-2">Move History</h3>
        <div className="space-y-3">
          {roomState.moves.map((move: any, idx: number) => {
            const pName = move.player === player1.id ? player1.username : player2.username;
            return (
              <div key={idx} className="text-md flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pName}</span>
                <span className="font-mono px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm font-bold">
                  +{move.amountAdded} ➔ {move.newSum}
                </span>
              </div>
            );
          })}
          {roomState.moves.length === 0 && (
            <p className="text-slate-400 italic text-center mt-8">No moves yet. Start the game!</p>
          )}
        </div>
      </div>
    </div>
  );
}
