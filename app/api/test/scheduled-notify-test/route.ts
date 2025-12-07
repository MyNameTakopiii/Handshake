import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { bookings, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { messagingApi } from "@line/bot-sdk";
import { TIME_SLOTS } from "@/data/member";

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
        error: "Not authenticated. Please login with LINE first." 
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

    // Parse request body
    const body = await request.json();
    const { testTime } = body;

    if (!testTime) {
      return NextResponse.json({ 
        error: "Missing required field: testTime (ISO format, e.g., '2025-12-07T22:00:00')" 
      }, { status: 400 });
    }

    // Parse test time
    const targetTime = new Date(testTime);
    if (isNaN(targetTime.getTime())) {
      return NextResponse.json({ 
        error: "Invalid testTime format. Use ISO format like '2025-12-07T22:00:00'" 
      }, { status: 400 });
    }

    // Calculate notification time (15 minutes before)
    const notifyTime = new Date(targetTime.getTime() - 15 * 60000);
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

    // Get date string for target time
    const targetYear = targetTime.getFullYear();
    const targetMonth = String(targetTime.getMonth() + 1).padStart(2, '0');
    const targetDay = String(targetTime.getDate()).padStart(2, '0');
    const targetDateStr = `${targetYear}-${targetMonth}-${targetDay}`;

    // Find matching round
    const slotsForDate = TIME_SLOTS[targetDateStr];
    if (!slotsForDate) {
      return NextResponse.json({
        message: "No events scheduled for the test date",
        testTime: targetTime.toISOString(),
        dateChecked: targetDateStr,
        availableDates: Object.keys(TIME_SLOTS)
      });
    }

    const targetHour = targetTime.getHours();
    const targetMinute = targetTime.getMinutes();
    const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;

    const matchingRounds = slotsForDate.filter(slot => {
      const [startTime] = slot.time.split("-");
      return startTime === targetTimeStr;
    });

    if (matchingRounds.length === 0) {
      return NextResponse.json({
        message: "No rounds found starting at the specified test time",
        testTime: targetTime.toISOString(),
        testTimeFormatted: `${targetTimeStr}`,
        availableRounds: slotsForDate.map(s => ({
          label: s.label,
          time: s.time
        }))
      });
    }

    // Find bookings for this user and these rounds
    const userBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, session.user.id),
          eq(bookings.date, targetDateStr)
        )
      );

    const bookingsForRounds = userBookings.filter(b => 
      matchingRounds.some(r => r.id === b.roundId)
    );

    if (bookingsForRounds.length === 0) {
      return NextResponse.json({
        message: "No bookings found for the test time",
        testInfo: {
          testTime: targetTime.toISOString(),
          testTimeFormatted: targetTime.toLocaleString('th-TH'),
          notificationTime: notifyTime.toISOString(),
          notificationTimeFormatted: notifyTime.toLocaleString('th-TH'),
          minutesUntilEvent: Math.round((targetTime.getTime() - bangkokTime.getTime()) / 60000)
        },
        matchingRounds: matchingRounds.map(r => ({
          id: r.id,
          label: r.label,
          time: r.time
        })),
        hint: "Create a booking for this time slot first, then try this test again."
      });
    }

    // Build notification message
    const formatThaiDate = (d: Date) => {
      try {
        const fmt = new Intl.DateTimeFormat("th-TH", { 
          weekday: "long", 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        });
        return fmt.format(d);
      } catch (e) {
        return targetDateStr;
      }
    };

    const formattedDate = formatThaiDate(targetTime);
    const lines: string[] = [];
    lines.push(`🧪 [TEST] แจ้งเตือนสำหรับ ${formattedDate}`);
    lines.push("");

    for (const booking of bookingsForRounds) {
      const round = matchingRounds.find(r => r.id === booking.roundId);
      if (!round) continue;

      lines.push(user.name || "");
      lines.push(booking.memberName);
      lines.push(`${round.label} (${round.time})`);
      lines.push(`${booking.count} ใบ`);
      lines.push("");
    }

    lines.push("รีบไปเข้าแถวก่อนเวลานะครับ!");
    lines.push("");
    lines.push("━━━━━━━━━━━━━");
    lines.push(`⏰ การทดสอบนี้จำลองว่าตอนนี้คือเวลา: ${notifyTime.toLocaleString('th-TH')}`);

    const messageText = lines.join("\n");

    // Send notification
    await client.pushMessage({
      to: user.lineId,
      messages: [
        {
          type: "text",
          text: messageText,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully!",
      testInfo: {
        currentTime: bangkokTime.toISOString(),
        currentTimeFormatted: bangkokTime.toLocaleString('th-TH'),
        testTime: targetTime.toISOString(),
        testTimeFormatted: targetTime.toLocaleString('th-TH'),
        notificationTime: notifyTime.toISOString(),
        notificationTimeFormatted: notifyTime.toLocaleString('th-TH'),
        minutesUntilEvent: Math.round((targetTime.getTime() - bangkokTime.getTime()) / 60000)
      },
      sentTo: {
        name: user.name,
        lineId: user.lineId
      },
      bookingsFound: bookingsForRounds.length,
      roundsMatched: matchingRounds.length
    });

  } catch (error) {
    console.error("Scheduled test notification error:", error);
    
    if (error && typeof error === 'object' && 'status' in error) {
      const lineError = error as { status: number; statusText: string; body?: string };
      return NextResponse.json({ 
        error: "LINE API Error",
        status: lineError.status,
        statusText: lineError.statusText,
        details: lineError.body || "Invalid Channel Access Token or user hasn't added the bot as friend"
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
