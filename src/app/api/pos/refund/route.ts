import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, reason, staffId } = body;

    if (!orderId || !staffId) {
      return NextResponse.json({ error: "Order ID and Staff ID are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      const refund = await tx.pOSRefund.create({
        data: {
          orderId,
          amount,
          reason,
          staffId
        }
      });

      // 2. Update Order Status
      const order = await tx.pOSOrder.update({
        where: { id: orderId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED"
        },
        include: { items: true }
      });

      // 3. Restore Inventory
      for (const item of order.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (product && product.stock !== -1) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      return refund;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
