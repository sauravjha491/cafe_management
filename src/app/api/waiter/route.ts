import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, tableNumber, customerName } = body;

    if (!adminDb) {
      throw new Error("Firebase Admin DB not initialized");
    }

    const callRef = adminDb.collection("waiter_calls").doc();
    await callRef.set({
      orderId,
      orderNumber,
      tableNumber,
      customerName,
      createdAt: new Date(),
      status: "PENDING"
    });

    return NextResponse.json({ success: true, id: callRef.id });
  } catch (error: any) {
    console.error("Waiter call error:", error);
    return NextResponse.json({ error: "Failed to call waiter", details: error.message }, { status: 500 });
  }
}
