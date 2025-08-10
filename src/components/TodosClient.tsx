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
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新規タスク..."
          style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={addMutation.isPending}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          追加
        </button>
      </form>

      <ul style={{ display: "grid", gap: 8 }}>
        {todos.map((t) => (
          <li
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 10,
              border: "1px solid #eee",
              borderRadius: 12,
              opacity: t.id.startsWith("temp-") ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => updateMutation.mutate({ id: t.id, patch: { done: !t.done } })}
              aria-label="完了切替"
            />
            <span
              style={{
                flex: 1,
                textDecoration: t.done ? "line-through" : "none",
                opacity: t.done ? 0.6 : 1,
                wordBreak: "break-all",
              }}
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
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
            >
              編集
            </button>

            <button
              onClick={() => deleteMutation.mutate(t.id)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        {isFetching ? "同期中..." : "最新です"}
      </div>
    </section>
  );
}
