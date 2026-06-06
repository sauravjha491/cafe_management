import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
