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
      if (db) {
        await setDoc(doc(db, "orders", order.id), {
          orderNumber: order.orderNumber,
          status: order.status,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          total: order.total,
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            note: item.note || null,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log("Mirror record created in Firebase");
      } else {
        console.warn("Firebase DB not initialized, skipping mirror record");
      }
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
  console.log("GET /api/orders started");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      console.log(`GET /api/orders for id: ${id}`);
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
    console.log(`GET /api/orders success: found ${orders.length} orders`);
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  }
}
