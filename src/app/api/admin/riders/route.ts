import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const riders = await prisma.rider.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(riders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch riders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, vehicleNumber, password } = body;

    // Create a user first
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password, // In a real app, hash this!
        role: "RIDER",
      },
    });

    // Then create the rider record
    const rider = await prisma.rider.create({
      data: {
        userId: user.id,
        vehicleNumber,
        isAvailable: true,
        status: "ACTIVE",
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(rider);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create rider" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, isAvailable, vehicleNumber } = body;

    const rider = await prisma.rider.update({
      where: { id },
      data: {
        status,
        isAvailable,
        vehicleNumber,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(rider);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rider" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Rider ID required" }, { status: 400 });

  try {
    // Get the rider to find the user ID
    const rider = await prisma.rider.findUnique({ where: { id } });
    if (!rider) throw new Error("Rider not found");

    // Delete rider first
    await prisma.rider.delete({ where: { id } });
    
    // Then delete the user
    await prisma.user.delete({ where: { id: rider.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rider" }, { status: 500 });
  }
}
