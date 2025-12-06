import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { bookings } from "@/db/schema";
import { authOptions } from "../auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) { 
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tickets } = body; 

    const user = session.user as { id: string };
    const userId = user.id;

    if (!userId) {

        return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }
 
    await db.transaction(async (tx) => {
      await tx.delete(bookings).where(eq(bookings.userId, userId));

      const bookingsToCreate = [];
      for (const [key, count] of Object.entries(tickets)) {
        if (typeof count === 'number' && count > 0) {
             const parts = key.split("-");
             const roundId = parts.pop()!;
             const day = parts.pop()!;
             const month = parts.pop()!;
             const year = parts.pop()!;
             const date = `${year}-${month}-${day}`;
             const memberName = parts.join("-");

             bookingsToCreate.push({
               userId,
               memberName,
               date,
               roundId,
               count,
             });
        }
      }

      if (bookingsToCreate.length > 0) {
        await tx.insert(bookings).values(bookingsToCreate);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(_req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { id: string };
    const userId = user.id;

    try {
        const userBookings = await db
            .select()
            .from(bookings)
            .where(eq(bookings.userId, userId));

        // Convert back to tickets Record<string, number>
        const tickets: Record<string, number> = {};
        userBookings.forEach(b => {
            const key = `${b.memberName}-${b.date}-${b.roundId}`;
            tickets[key] = b.count;
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string };
  const userId = user.id;

  try {
    await db.delete(bookings).where(eq(bookings.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

