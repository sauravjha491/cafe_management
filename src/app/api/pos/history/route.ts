import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const staffId = searchParams.get("staffId");
  const paymentMethod = searchParams.get("paymentMethod");

  try {
    const where: any = {
      status: { not: "HELD" }
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (staffId) where.staffId = staffId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const orders = await prisma.pOSOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { 
        items: true, 
        payments: true, 
        staff: { select: { name: true } } 
      }
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
