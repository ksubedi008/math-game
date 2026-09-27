import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium">
          Created by Kamal Subedi
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <a 
            href="https://kamal-subedi.name.np" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            kamal-subedi.name.np
          </a>
          <a 
            href="https://instagram.com/k_subedi08" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            IG: @k_subedi08
          </a>
        </div>
      </div>
    </footer>
  );
}
