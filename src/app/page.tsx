import { db } from "@/lib/db";
import TodosClient from "@/components/TodosClient";

export default async function Page() {
  const initialTodos = await db.list();
  return (
    <main className="relative px-4 py-10 md:py-16 font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="mx-auto h-64 w-[40rem] max-w-[90%] -translate-y-10 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-500/10 to-transparent blur-3xl dark:from-indigo-400/20 dark:via-sky-400/10" />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            TanStack Query × Next.js App Router
          </span>
          <h1 className="mt-3 bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent dark:from-zinc-100 dark:to-zinc-400 md:text-5xl">
            Optimistic CRUD Demo
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 md:text-base">
            サーバーで初期データを描画し、クライアントでは TanStack Query でハイドレート。高速で心地よい操作感の Todo を体験してください。
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40 md:p-6">
          <TodosClient initialTodos={initialTodos} />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-500">
          初期描画はサーバーから <code>db.list()</code> を読み込み、結果を TanStack Query の
          <code className="mx-1">initialData</code> に渡しています。クライアント更新は楽観的に反映し、
          後続で同期を取ります。
        </p>
      </div>
    </main>
  );
}
