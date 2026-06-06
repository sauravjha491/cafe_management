import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: "asc" },
    });
    return NextResponse.json(tables);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableNumber } = body;
    const table = await prisma.table.create({
      data: { tableNumber: parseInt(tableNumber) },
    });
    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.table.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}

