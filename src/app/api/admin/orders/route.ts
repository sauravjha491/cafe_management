import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    // 1. Update in SQLite
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // 2. Update in Firebase for real-time tracking
    try {
      if (db) {
        await updateDoc(doc(db, "orders", orderId), {
          status,
          updatedAt: new Date().toISOString(),
        });
      } else {
        console.warn("Firebase DB not initialized, skipping real-time update");
      }
    } catch (firebaseError: any) {
      console.error("Firebase update error (non-fatal):", firebaseError);
      // We don't fail the request if Firebase fails, 
      // but real-time tracking won't work until rules are fixed.
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order", details: error.message }, { status: 500 });
  }
}
