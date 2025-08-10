// src/app/api/todos/[id]/route.ts
import { NextResponse } from "next/server";
import { db, TodoUpdateSchema } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  const body = await req.json();
  const parsed = TodoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const updated = await db.update(params.id, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  await db.remove(params.id);
  return NextResponse.json({ id: params.id });
}
