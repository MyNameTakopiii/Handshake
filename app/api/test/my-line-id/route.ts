import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please login with LINE first"
      }, { status: 401 });
    }

    // Get user's LINE ID from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ 
        error: "User not found"
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      userId: user.id,
      lineId: user.lineId,
      name: user.name,
      email: user.email,
      message: user.lineId 
        ? "คุณสามารถใช้ LINE ID นี้เพื่อทดสอบการแจ้งเตือน"
        : "ไม่พบ LINE ID กรุณา login ด้วย LINE อีกครั้ง",
      testUrl: user.lineId 
        ? `/api/cron/test-notify?lineId=${user.lineId}&secret=${process.env.NEXTAUTH_SECRET}`
        : null
    });

  } catch (error) {
    console.error("Error getting LINE ID:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

