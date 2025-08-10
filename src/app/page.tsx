import { db } from "@/lib/db";
import TodosClient from "@/components/TodosClient";

export default async function Page() {
  const initialTodos = await db.list(); // サーバーで直読み
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Optimistic CRUD Demo</h1>
      <TodosClient initialTodos={initialTodos} />
      <p style={{ marginTop: 24, opacity: 0.6 }}>
        初期描画はサーバーでデータを読み込み、TanStack Query の <code>initialData</code> に渡しています。
      </p>
    </main>
  );
}
