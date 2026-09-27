"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { makeMove } from "./actions";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export function GameBoard({ 
  gameId, 
  initialRoomState, 
  status, 
  winnerId, 
  currentUserId, 
  player1, 
  player2,
  initialAvailableNumbers,
  initialPlayer1Hand,
  initialPlayer2Hand,
  targetNumber
}: any) {
  const [roomState, setRoomState] = useState(initialRoomState);
  const [gameStatus, setGameStatus] = useState(status);
  const [gameWinnerId, setGameWinnerId] = useState(winnerId);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>(initialAvailableNumbers);
  const [player1Hand, setPlayer1Hand] = useState<number[]>(initialPlayer1Hand);
  const [player2Hand, setPlayer2Hand] = useState<number[]>(initialPlayer2Hand);

  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${gameId}`);
    channel.bind("game-updated", (data: any) => {
      setRoomState(data.roomState);
      setGameStatus(data.status);
      setGameWinnerId(data.winnerId);
      setAvailableNumbers(data.availableNumbers);
      setPlayer1Hand(data.player1Hand);
      setPlayer2Hand(data.player2Hand);
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  const handleMakeMove = async (num: number) => {
    try {
      await makeMove(gameId, num);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isMyTurn = roomState.turn === currentUserId;
  const currentTurnPlayer = roomState.turn === player1.id ? player1.username : player2.username;
  const isPlayer1 = currentUserId === player1.id;
  const myHand = isPlayer1 ? player1Hand : player2Hand;
  const oppHand = isPlayer1 ? player2Hand : player1Hand;
  const oppName = isPlayer1 ? player2.username : player1.username;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 p-4 md:p-8 w-full max-w-5xl">
      
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        {/* Opponent's Hand */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border p-4 rounded-xl shadow-sm order-2 md:order-1">
          <h3 className="font-semibold mb-4 text-center border-b pb-2 text-slate-500 uppercase tracking-widest">{oppName}'s Hand</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {oppHand.map((num: number) => (
              <div key={num} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-500">
                {num}
              </div>
            ))}
            {oppHand.length === 0 && <span className="text-sm text-slate-400 italic">Empty</span>}
          </div>
        </div>

        {/* The Board */}
        <div className="md:col-span-2 order-1 md:order-2">
          <Card className="p-6 md:p-8 w-full shadow-lg border-t-4 border-t-indigo-500 flex flex-col items-center">
            <div className="text-xl md:text-2xl text-indigo-500 dark:text-indigo-400 font-black mb-6 uppercase tracking-widest">
              Target: {targetNumber}
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {Array.from({ length: targetNumber - 1 }, (_, i) => i + 1).map((num: number) => {
                const isAvailable = availableNumbers.includes(num);
                return (
                  <Button 
                    key={num}
                    onClick={() => handleMakeMove(num)}
                    disabled={!isAvailable || !isMyTurn || gameStatus !== "playing"}
                    variant={isAvailable ? "outline" : "secondary"}
                    className={`w-10 h-10 md:w-14 md:h-14 md:text-lg transition-all duration-300 ${isAvailable ? 'hover:border-indigo-500 hover:text-indigo-600' : 'opacity-30'}`}
                  >
                    {num}
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* My Hand */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border p-4 rounded-xl shadow-sm order-3 md:order-3">
          <h3 className="font-semibold mb-4 text-center border-b pb-2 text-indigo-500 uppercase tracking-widest">Your Hand</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {myHand.map((num: number) => (
              <div key={num} className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-lg font-bold shadow-sm">
                {num}
              </div>
            ))}
            {myHand.length === 0 && <span className="text-sm text-slate-400 italic">Empty</span>}
          </div>
        </div>
      </div>

      <div className="text-center mt-6 w-full max-w-sm">
        <Button 
          onClick={() => window.location.href = '/dashboard'}
          size="lg"
          variant="destructive"
          className="w-full text-lg shadow-lg"
        >
          Leave Match
        </Button>
      </div>

    </div>
  );
}
