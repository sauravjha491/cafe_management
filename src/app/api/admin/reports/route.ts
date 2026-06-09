import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";

  let start: Date, end: Date;
  const now = new Date();

  switch (period) {
    case "week":
      start = startOfWeek(now);
      end = endOfWeek(now);
      break;
    case "month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    default:
      start = startOfDay(now);
      end = endOfDay(now);
  }

  try {
    const orders = await prisma.pOSOrder.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "HELD" }
      },
      include: { items: true }
    });

    const revenue = orders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = orders.length;
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

    // Get new customers
    const newCustomers = await prisma.customer.count({
      where: { createdAt: { gte: start, lte: end } }
    });

    // Best Sellers
    const productSales: any = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, sales: 0, revenue: 0 };
        }
        productSales[item.name].sales += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5);

    // Simplified Trend for now
    const revenueTrend = orders.map(o => ({
      label: format(o.createdAt, "HH:mm"),
      value: o.total
    })).slice(-10);

    return NextResponse.json({
      revenue,
      orderCount,
      avgOrder,
      newCustomers,
      bestSellers,
      revenueTrend
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
