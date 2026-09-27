import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-slate-50 dark:bg-slate-950 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
        Multiplayer <span className="text-blue-600">Math Game</span>
      </h1>
      <p className="text-lg md:text-xl mb-8 text-slate-600 dark:text-slate-400 max-w-2xl">
        Race against your friends to solve math problems in real-time. Fast, competitive, and entirely built with Next.js!
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/login">
          {/* FIX: Replaced default Next.js boilerplate with navigation buttons */}
          <Button size="lg" className="w-full sm:w-auto text-lg px-8">
            Play Now
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}
