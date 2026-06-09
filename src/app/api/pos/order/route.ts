import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      items,
      customerName,
      customerPhone,
      customerId,
      staffId,
      subtotal,
      tax,
      discount,
      serviceCharge,
      total,
      paymentMethod,
      received,
      change,
      status // COMPLETED or HELD
    } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // 1. Generate unique numbers
    const timestamp = Date.now();
    const orderNumber = `POS-${timestamp}`;
    const receiptNumber = `REC-${Math.floor(Math.random() * 1000000)}`;

    // 2. Transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // a. Create the POS Order
      const order = await tx.pOSOrder.create({
        data: {
          orderNumber,
          receiptNumber,
          status: status || "COMPLETED",
          customerName,
          customerPhone,
          customerId,
          staffId,
          subtotal,
          tax,
          discount: discount || 0,
          serviceCharge: serviceCharge || 0,
          total,
          paymentMethod,
          paymentStatus: status === "HELD" ? "PENDING" : "PAID",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              note: item.note,
              discount: item.discount || 0
            }))
          },
          payments: status === "HELD" ? undefined : {
            create: {
              amount: total,
              method: paymentMethod,
              received,
              change,
              status: "SUCCESS"
            }
          }
        },
        include: {
          items: true,
          payments: true
        }
      });

      // b. Update Inventory if COMPLETED
      if (status !== "HELD") {
        for (const item of items) {
          const productId = item.productId || item.id;
          if (productId) {
            const product = await tx.product.findUnique({
              where: { id: productId }
            });
            
            // Only decrement if stock is not unlimited (-1)
            if (product && product.stock !== -1) {
              await tx.product.update({
                where: { id: productId },
                data: {
                  stock: {
                    decrement: item.quantity
                  }
                }
              });
            }
          }
        }
      }

      return order;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POS Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const held = searchParams.get("held");

  try {
    if (id) {
      const order = await prisma.pOSOrder.findUnique({
        where: { id },
        include: { 
          items: { include: { product: true } }, 
          payments: true, 
          refunds: true 
        }
      });
      return NextResponse.json(order);
    }

    if (held === "true") {
      const heldOrders = await prisma.pOSOrder.findMany({
        where: { status: "HELD" },
        orderBy: { createdAt: "desc" },
        include: { items: true }
      });
      return NextResponse.json(heldOrders);
    }

    const orders = await prisma.pOSOrder.findMany({
      where: { status: { not: "HELD" } },
      orderBy: { createdAt: "desc" },
      include: { items: true, payments: true }
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
