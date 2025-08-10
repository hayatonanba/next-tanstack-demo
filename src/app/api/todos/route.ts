import { NextResponse } from "next/server";
import { db, TodoCreateSchema } from "@/lib/db";

export const runtime = "nodejs"; // fs を使うため

export async function GET() {
  const todos = await db.list();
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = TodoCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await db.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
