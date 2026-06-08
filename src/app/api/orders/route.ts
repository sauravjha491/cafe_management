import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  console.log("POST /api/orders started");
  try {
    const body = await req.json();
    console.log("Request body:", body);
    const { 
      type = "TABLE",
      tableNumber, 
      customerName, 
      phoneNumber,
      address,
      latitude,
      longitude,
      notes,
      items, 
      subtotal,
      tax = 0,
      deliveryFee = 0,
      discount = 0,
      total,
      paymentMethod = "CASH"
    } = body;

    // 1. Create order in PostgreSQL via Prisma
    console.log("Fetching last order number...");
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 1000) + 1;
    console.log("Next order number:", nextOrderNumber);

    console.log("Creating order in Prisma...");
    
    // Find or create customer if phone number is provided
    let customerId = null;
    if (phoneNumber) {
      const customer = await prisma.customer.upsert({
        where: { phone: phoneNumber },
        update: { name: customerName },
        create: { 
          name: customerName,
          phone: phoneNumber,
        }
      });
      customerId = customer.id;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        type,
        tableNumber: tableNumber ? parseInt(tableNumber) : null,
        customerName,
        customerId,
        subtotal: subtotal || total,
        tax,
        deliveryFee,
        discount,
        total,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            note: item.note || null,
          })),
        },
        // If it's a delivery order, create the DeliveryOrder record
        ...(type === "DELIVERY" && {
          deliveryOrder: {
            create: {
              address: {
                create: {
                  customerId: customerId || "guest", // Fallback if no phone
                  name: "Delivery Address",
                  addressLine: address,
                  city: "City",
                  latitude,
                  longitude,
                }
              },
              notes,
            }
          }
        })
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        deliveryOrder: {
          include: {
            address: true
          }
        }
      },
    });
    console.log("Order created in Prisma:", order.id);

    // 2. Create mirror record in Firebase for real-time tracking using Admin SDK
    console.log("Creating mirror record in Firebase using Admin SDK...");
    try {
      if (adminDb) {
        await adminDb.collection("orders").doc(order.id).set({
          orderNumber: order.orderNumber,
          type: order.type,
          status: order.status,
          customerName: order.customerName,
          phoneNumber: phoneNumber || null,
          tableNumber: order.tableNumber,
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          discount: order.discount,
          total: order.total,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            note: item.note || null,
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("Mirror record created in Firebase successfully");
      } else {
        console.warn("Firebase Admin DB not initialized, skipping mirror record");
      }
    } catch (firebaseError: any) {
      console.error("Firebase mirror error (non-fatal):", firebaseError);
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
        include: { 
          items: { include: { product: true } },
          deliveryOrder: { include: { address: true, rider: { include: { user: true } } } }
        },
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
