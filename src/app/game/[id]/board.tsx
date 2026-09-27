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
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${gameId}`);
    channel.bind("game-updated", (data: any) => {
      setRoomState(data.roomState);
      setGameStatus(data.status);
      setGameWinnerId(data.winnerId);
      setSelected([]);
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  const toggleSelect = (num: number) => {
    if (selected.includes(num)) {
      setSelected(selected.filter(n => n !== num));
    } else {
      if (selected.length < 3) setSelected([...selected, num]);
    }
  };

  const handleMakeMove = async () => {
    try {
      await makeMove(gameId, selected);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isMyTurn = roomState.turn === currentUserId;
  const currentTurnPlayer = roomState.turn === player1.id ? player1.username : player2.username;
  const selectedSum = selected.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-8 p-6 w-full max-w-4xl">
      <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
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

      <Card className="p-8 w-full shadow-lg border-t-4 border-t-indigo-500">
        <div className="flex flex-wrap gap-4 justify-center">
          {roomState.board.map((num: number) => (
            <Button
              key={num}
              variant={selected.includes(num) ? "default" : "outline"}
              onClick={() => toggleSelect(num)}
              disabled={!isMyTurn || gameStatus !== "playing"}
              className={`w-16 h-16 text-xl rounded-2xl transition-all duration-200 ${selected.includes(num) ? 'scale-110 shadow-md bg-indigo-600 hover:bg-indigo-700' : 'hover:border-indigo-400'}`}
            >
              {num}
            </Button>
          ))}
        </div>
      </Card>

      <div className="text-center flex flex-col items-center gap-4">
        <div className="text-2xl font-mono bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-full shadow-inner">
          Sum: <span className={selectedSum === 30 ? "text-green-600 font-bold" : ""}>{selectedSum}</span> / 30
        </div>
        <Button 
          onClick={handleMakeMove} 
          disabled={!isMyTurn || gameStatus !== "playing" || selectedSum !== 30}
          size="lg"
          className="w-64 text-lg h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
        >
          Submit Move
        </Button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border p-5 rounded-xl h-[250px] overflow-y-auto mt-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg text-slate-700 dark:text-slate-300 border-b pb-2">Move History</h3>
        <div className="space-y-3">
          {roomState.moves.map((move: any, idx: number) => {
            const pName = move.player === player1.id ? player1.username : player2.username;
            return (
              <div key={idx} className="text-md flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pName}</span>
                <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm tracking-widest">
                  {move.numbers.join(' + ')} = 30
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
