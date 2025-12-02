import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { bookings } from "@/db/schema";
import { authOptions } from "../auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) { // LINE login usually provides email or we use the ID from session callback
      // If we customized session to have 'id', we should check that.
      // But getServerSession might not have the custom type inferred here without the d.ts being picked up globally or imported.
      // Let's rely on session.user existing.
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tickets } = body; // tickets is Record<string, number>

    // We need the user's DB ID. 
    // In our auth route, we added user.id to session.
    const user = session.user as any;
    const userId = user.id;

    if (!userId) {
        // If it's a new user and we haven't synced properly, we might need to find them by email or lineId?
        // Actually, the session callback should have populated it.
        return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Transaction: Delete all existing bookings for this user and re-create them (simplest sync strategy)
    // Or upsert. Given the structure, delete-insert is easier for full sync.
    
    await db.transaction(async (tx) => {
      await tx.delete(bookings).where(eq(bookings.userId, userId));

      const bookingsToCreate = [];
      for (const [key, count] of Object.entries(tickets)) {
        if (typeof count === 'number' && count > 0) {
             // Key format: "Name-YYYY-MM-DD-RoundID"
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

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
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
