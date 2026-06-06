import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  console.log("POST /api/orders started");
  try {
    const body = await req.json();
    console.log("Request body:", body);
    const { tableNumber, customerName, items, total } = body;

    // 1. Create order in SQLite via Prisma
    console.log("Fetching last order number...");
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 1000) + 1;
    console.log("Next order number:", nextOrderNumber);

    console.log("Creating order in Prisma...");
    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        tableNumber: parseInt(tableNumber),
        customerName,
        total,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            note: item.note || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    console.log("Order created in Prisma:", order.id);

    // 2. Create mirror record in Firebase for real-time tracking
    console.log("Creating mirror record in Firebase...");
    try {
      await setDoc(doc(db, "orders", order.id), {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        updatedAt: new Date().toISOString(),
      });
      console.log("Mirror record created in Firebase");
    } catch (firebaseError: any) {
      console.error("Firebase mirror error (non-fatal):", firebaseError);
      // We don't fail the whole request if Firebase fails, 
      // but the customer won't get real-time updates.
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order", details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(order);
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(orders);
}
