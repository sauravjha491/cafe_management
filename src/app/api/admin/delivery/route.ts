import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        type: "DELIVERY",
      },
      include: {
        items: { include: { product: true } },
        deliveryOrder: {
          include: {
            address: true,
            rider: { include: { user: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch delivery orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, riderId } = body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(riderId && {
          deliveryOrder: {
            update: {
              riderId,
            },
          },
        }),
      },
      include: {
        deliveryOrder: {
          include: {
            address: true,
            rider: { include: { user: true } },
          },
        },
      },
    });

    // Update Firebase mirror
    if (adminDb) {
      await adminDb.collection("orders").doc(orderId).update({
        status,
        updatedAt: new Date(),
        ...(riderId && { riderId }),
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update delivery order" }, { status: 500 });
  }
}
