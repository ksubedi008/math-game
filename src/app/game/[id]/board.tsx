"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { submitMove } from "./actions";
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
  initialPlayer1Score,
  initialPlayer2Score,
  targetNumber
}: any) {
  const [roomState, setRoomState] = useState(initialRoomState);
  const [gameStatus, setGameStatus] = useState(status);
  const [gameWinnerId, setGameWinnerId] = useState(winnerId);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>(initialAvailableNumbers);
  const [player1Score, setPlayer1Score] = useState<number>(initialPlayer1Score);
  const [player2Score, setPlayer2Score] = useState<number>(initialPlayer2Score);
  
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${gameId}`);
    channel.bind("game-updated", (data: any) => {
      setRoomState(data.roomState);
      setGameStatus(data.status);
      setGameWinnerId(data.winnerId);
      setAvailableNumbers(data.availableNumbers);
      setPlayer1Score(data.player1Score);
      setPlayer2Score(data.player2Score);
      setSelectedOptions([]);
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  const isMyTurn = roomState.turn === currentUserId;

  const handleToggleNumber = (num: number) => {
    if (!isMyTurn || gameStatus !== "playing") return;
    if (selectedOptions.includes(num)) {
      setSelectedOptions(selectedOptions.filter(n => n !== num));
    } else {
      setSelectedOptions([...selectedOptions, num]);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length < 2) {
      toast.error("Please select at least two numbers.");
      return;
    }
    try {
      const res = await submitMove(gameId, selectedOptions);
      if (res?.isCorrect) {
        toast.success("Correct! Point awarded.");
      } else {
        toast.error("Incorrect sum. Turn lost.");
      }
      setSelectedOptions([]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const currentTurnPlayer = roomState.turn === player1.id ? player1.username : player2.username;
  const isPlayer1 = currentUserId === player1.id;
  const myScore = isPlayer1 ? player1Score : player2Score;
  const oppScore = isPlayer1 ? player2Score : player1Score;
  const oppName = isPlayer1 ? player2.username : player1.username;
  const currentSum = selectedOptions.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 p-4 md:p-8 w-full max-w-3xl">
      
      <div className="flex w-full justify-between items-center bg-slate-200 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <div className="text-xl font-bold flex flex-col items-center">
          <span className="text-sm uppercase text-slate-500">You</span>
          <span className="text-green-500 text-3xl">{myScore}</span>
        </div>
        <div className="text-sm uppercase tracking-widest text-slate-500 font-bold">Score</div>
        <div className="text-xl font-bold flex flex-col items-center">
          <span className="text-sm uppercase text-slate-500">{oppName}</span>
          <span className="text-purple-500 text-3xl">{oppScore}</span>
        </div>
      </div>

      <div className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 p-2 text-center">
        {gameStatus === "playing" ? (
          <span>
            {isMyTurn ? "Your turn!" : `Waiting for ${currentTurnPlayer}...`}
          </span>
        ) : (
          <span>
            Game Over! {gameWinnerId === currentUserId ? "You Won!" : gameWinnerId ? "You Lost!" : "It's a Tie!"}
          </span>
        )}
      </div>

      <Card className="p-6 md:p-8 w-full shadow-lg border-t-4 border-t-indigo-500 flex flex-col items-center">
        <div className="text-xl md:text-2xl text-indigo-500 dark:text-indigo-400 font-black mb-2 uppercase tracking-widest">
          Target: {targetNumber}
        </div>
        
        <div className="text-lg text-slate-500 mb-6 font-semibold">
          Current Sum: <span className={currentSum === targetNumber ? 'text-green-500 font-black' : currentSum > targetNumber ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}>{currentSum}</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
          {Array.from({ length: targetNumber - 1 }, (_, i) => i + 1).map((num: number) => {
            const isAvailable = availableNumbers.includes(num);
            const isSelected = selectedOptions.includes(num);
            
            if (!isAvailable) {
              return (
                <div key={num} className="w-10 h-10 md:w-14 md:h-14 md:text-lg flex items-center justify-center rounded-lg opacity-0 pointer-events-none">
                  {num}
                </div>
              );
            }

            return (
              <Button 
                key={num}
                onClick={() => handleToggleNumber(num)}
                disabled={!isMyTurn || gameStatus !== "playing"}
                variant={isSelected ? "default" : "outline"}
                className={`w-10 h-10 md:w-14 md:h-14 md:text-lg transition-all duration-300 font-bold ${isSelected ? 'bg-indigo-600 hover:bg-indigo-700 text-white scale-110 shadow-md' : 'hover:border-indigo-500 hover:text-indigo-600'}`}
              >
                {num}
              </Button>
            );
          })}
        </div>

        {gameStatus === "playing" && (
          <Button 
            onClick={handleSubmit}
            disabled={!isMyTurn || selectedOptions.length < 2}
            size="lg"
            className="w-full max-w-sm text-xl h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md"
          >
            Submit Move
          </Button>
        )}
      </Card>

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
