"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Todo } from "@/lib/db";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "@/lib/api-client";

const keys = {
  all: ["todos"] as const,
};

export default function TodosClient({ initialTodos }: { initialTodos: Todo[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  // 読み取り：SSR の初期配列を initialData として渡す
  const { data: todos = [], isFetching } = useQuery({
    queryKey: keys.all,
    queryFn: fetchTodos,
    initialData: initialTodos,
  });

  // 追加（CREATE）— 楽観的に先に挿入して、失敗したら巻き戻す
  const addMutation = useMutation({
    mutationFn: (t: string) => createTodo(t),
    onMutate: async (newTitle) => {
      await qc.cancelQueries({ queryKey: keys.all });
      const prev = qc.getQueryData<Todo[]>(keys.all) ?? [];
      const optimistic: Todo = {
        id: `temp-${Math.random().toString(36).slice(2)}`, // 仮ID
        title: newTitle,
        done: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      qc.setQueryData<Todo[]>(keys.all, [optimistic, ...prev]);
      setTitle("");
      return { prev, tempId: optimistic.id };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev);
    },
    onSuccess: (created, _vars, ctx) => {
      // 仮IDのレコードを本物に差し替え
      qc.setQueryData<Todo[]>(keys.all, (old = []) =>
        old.map(t => (t.id === ctx?.tempId ? created : t))
      );
    },
    onSettled: () => {
      // 不整合があれば最終同期
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });

  // 更新（UPDATE: done 切替 or タイトル変更）
  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Todo, "title" | "done">> }) =>
      updateTodo(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.all });
      const prev = qc.getQueryData<Todo[]>(keys.all) ?? [];
      qc.setQueryData<Todo[]>(keys.all, (old = []) =>
        old.map(t => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } as Todo : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });

  // 削除（DELETE）
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.all });
      const prev = qc.getQueryData<Todo[]>(keys.all) ?? [];
      qc.setQueryData<Todo[]>(keys.all, (old = []) => old.filter(t => t.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });

  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addMutation.mutate(title.trim());
        }}
        className="mb-6 flex gap-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新規タスク..."
          className="flex-1 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          追加
        </button>
      </form>

      <ul className="grid gap-3">
        {todos.map((t) => {
          const isTemp = t.id.startsWith("temp-");
          return (
            <li
              key={t.id}
              className={`flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/70 p-3 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 ${isTemp ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => updateMutation.mutate({ id: t.id, patch: { done: !t.done } })}
                aria-label="完了切替"
                className="size-4 accent-indigo-600"
              />
              <span
                className={`flex-1 break-words ${t.done ? "line-through opacity-60" : ""}`}
              >
                {t.title}
              </span>

              <button
                onClick={() => {
                  const next = window.prompt("タイトルを編集", t.title);
                  if (next && next.trim() && next !== t.title) {
                    updateMutation.mutate({ id: t.id, patch: { title: next.trim() } });
                  }
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                編集
              </button>

              <button
                onClick={() => deleteMutation.mutate(t.id)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                削除
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        {isFetching ? "同期中..." : "最新です"}
      </div>
    </section>
  );
}
