import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    try {
      if (adminDb) {
        await adminDb.collection("orders").doc(orderId).update({
          status,
          updatedAt: new Date(),
        });
      } else {
        console.warn("Firebase Admin DB not initialized, skipping real-time update");
      }
    } catch (firebaseError: unknown) {
      console.error("Firebase update error (non-fatal):", firebaseError);
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order", details: message }, { status: 500 });
  }
}
