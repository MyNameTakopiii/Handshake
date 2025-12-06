import { NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";

// Initialize LINE client
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export async function GET(request: Request) {
  try {
    // Check for authorization (simple protection)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get LINE ID from query or use a test one
    const lineId = searchParams.get("lineId");
    
    if (!lineId) {
      return NextResponse.json({ 
        error: "Missing lineId parameter",
        usage: "Add ?lineId=YOUR_LINE_ID&secret=YOUR_SECRET to test"
      }, { status: 400 });
    }

    // Send test notification
    const testMessage = `🧪 ทดสอบการแจ้งเตือน

🔔 Round 3 กำลังจะเริ่มใน 15 นาที!

เมมเบอร์: Arlee
เวลา: 14:00-15:30
จำนวน: 2 ใบ

รีบไปเข้าแถวนะครับ!

---
นี่คือข้อความทดสอบจากระบบ Handshake Planner`;

    await client.pushMessage({
      to: lineId,
      messages: [
        {
          type: "text",
          text: testMessage,
        },
      ],
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test notification sent successfully!",
      sentTo: lineId
    });

  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json({ 
      error: "Failed to send test notification",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


