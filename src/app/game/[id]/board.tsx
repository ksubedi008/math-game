"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { makeMove } from "./actions";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export function GameBoard({ gameId, initialRoomState, status, winnerId, currentUserId, player1, player2 }: any) {
  const [roomState, setRoomState] = useState(initialRoomState);
  const [gameStatus, setGameStatus] = useState(status);
  const [gameWinnerId, setGameWinnerId] = useState(winnerId);
  const [answerInput, setAnswerInput] = useState("");

  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${gameId}`);
    channel.bind("game-updated", (data: any) => {
      setRoomState(data.roomState);
      setGameStatus(data.status);
      setGameWinnerId(data.winnerId);
      setAnswerInput("");
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  const handleMakeMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput) return;
    try {
      await makeMove(gameId, parseInt(answerInput));
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
        <div className="text-sm uppercase tracking-widest text-slate-500 font-bold">First to 3 wins</div>
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
        {gameStatus === "playing" ? (
          <>
            <div className="text-4xl md:text-6xl font-mono mb-8">
              {roomState.problem.num1} {roomState.problem.operator} {roomState.problem.num2} = ?
            </div>
            <form onSubmit={handleMakeMove} className="flex flex-col md:flex-row gap-4 w-full justify-center items-center">
              <Input
                type="number"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                placeholder="Enter answer..."
                className="w-full md:w-64 text-2xl h-14 text-center"
                disabled={!isMyTurn}
                autoFocus={isMyTurn}
              />
              <Button 
                type="submit"
                disabled={!isMyTurn}
                size="lg"
                className="w-full md:w-48 text-lg h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                Submit Answer
              </Button>
            </form>
          </>
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
                <span className={`font-mono px-2 py-1 rounded text-sm tracking-widest ${move.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {move.problem} = {move.answer} {move.correct ? '✅' : '❌'}
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
