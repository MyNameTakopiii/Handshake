import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { messagingApi } from "@line/bot-sdk";

// Initialize LINE client
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated" 
      }, { status: 401 });
    }

    // Get user's LINE ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user?.lineId) {
      return NextResponse.json({ 
        error: "LINE ID not found. Please logout and login again with LINE." 
      }, { status: 400 });
    }

    // Get summary data from request body
    const body = await request.json();
    const { summary } = body;

    // Validate required fields
    if (!summary || typeof summary !== 'object') {
      return NextResponse.json({ 
        error: "Missing required field: summary" 
      }, { status: 400 });
    }

    // Build detailed message from summary
    let message = `รายละเอียดที่คุณเลือก\n`;
    
    // Group by date
    Object.entries(summary).forEach(([date, items]: [string, any]) => {
      const dateObj = new Date(date);
      const thaiDate = dateObj.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      
      message += `\n${thaiDate}\n`;
      
      items.forEach((item: any) => {
        message += `\n${item.name}\n`;
        message += `${item.roundLabel} (${item.roundTime})`;
        message += `\nจำนวน ${item.count} ใบ\n`;
      });
    });
    
    // Add total count
    let totalTickets = 0;
    Object.values(summary).forEach((items: any) => {
      items.forEach((item: any) => {
        totalTickets += item.count;
      });
    });
    
    message += `\n\nรวมทั้งหมด: ${totalTickets} ใบ`;

    message += `\n━━━━━━━━━━━━━\n อย่าลืมไปกันนะ ถ้าไม่ไปงอนแล้วนะ 😤`;

    await client.pushMessage({
      to: user.lineId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    });

    return NextResponse.json({ 
      success: true,
      message: "Test notification sent successfully!",
      sentTo: user.name,
      lineId: user.lineId
    });

  } catch (error) {
    console.error("Test notification error:", error);
    
    // Check if it's a LINE API error
    if (error && typeof error === 'object' && 'status' in error) {
      const lineError = error as { status: number; statusText: string; body?: string };
      return NextResponse.json({ 
        error: "LINE API Error",
        status: lineError.status,
        statusText: lineError.statusText,
        details: lineError.body || "Invalid Channel Access Token"
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


