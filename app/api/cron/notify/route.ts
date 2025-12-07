import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { messagingApi } from "@line/bot-sdk";
import { TIME_SLOTS } from "@/data/member";

// Initialize LINE client
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export async function GET() {
  try {
    // Get current time in Bangkok
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    
    const currentYear = bangkokTime.getFullYear();
    const currentMonth = String(bangkokTime.getMonth() + 1).padStart(2, '0');
    const currentDay = String(bangkokTime.getDate()).padStart(2, '0');
    const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

    const currentHour = bangkokTime.getHours();
    const currentMinute = bangkokTime.getMinutes();
    
    // Find rounds starting in ~15 minutes (14-16 mins window)
    const targetTime = new Date(bangkokTime.getTime() + 15 * 60000);
    const targetHour = targetTime.getHours();
    const targetMinute = targetTime.getMinutes();

    const slotsToday = TIME_SLOTS[currentDateStr];
    if (!slotsToday) {
      return NextResponse.json({ message: "No events today" });
    }

    const upcomingRounds = slotsToday.filter(slot => {
      const [startTime] = slot.time.split("-"); // "12:00"
      const [startH, startM] = startTime.split(":").map(Number);
      
      // Check if the round starts at the target time (minute precision is tricky, so checking exact match of HH:MM)
      // Or better: check if round start time is within 15 mins from now.
      // Let's stick to: if round start time == targetTime (HH:MM)
      return startH === targetHour && startM === targetMinute;
    });

    if (upcomingRounds.length === 0) {
      return NextResponse.json({ message: "No rounds starting in 15 mins" });
    }

    let sentCount = 0;

    // Collect bookings per user (keyed by lineId) so we can send one combined message
    const messagesPerUser = new Map<string, { userName: string; entries: Array<{ memberName: string; roundLabel: string; roundTime: string; count: number }>} >();

    for (const round of upcomingRounds) {
      // Find bookings for this round
      const roundBookings = await db
        .select({
          booking: bookings,
          user: users,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(
          and(
            eq(bookings.date, currentDateStr),
            eq(bookings.roundId, round.id)
          )
        );

      for (const { booking, user } of roundBookings) {
        if (!user.lineId) continue;

        const key = user.lineId;
        const existing = messagesPerUser.get(key);
        const entry = {
          memberName: booking.memberName,
          roundLabel: round.label,
          roundTime: round.time,
          count: booking.count,
        };

        if (!existing) {
          messagesPerUser.set(key, { userName: user.name || "", entries: [entry] });
        } else {
          existing.entries.push(entry);
        }
      }
    }

    // Helper: format Thai date like "วันเสาร์ที่ 27 ธันวาคม 2025"
    const formatThaiDate = (d: Date) => {
      try {
        const fmt = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        return fmt.format(d);
      } catch (e) {
        // fallback
        return `${currentDateStr}`;
      }
    };

    const formattedDate = formatThaiDate(bangkokTime);

    // Send combined messages
    for (const [lineId, payload] of messagesPerUser.entries()) {
      const lines: string[] = [];
      lines.push(`🔔 แจ้งเตือนสำหรับ ${formattedDate}`);
      lines.push("");

      for (const e of payload.entries) {
        // Include user name and member name (some users have same values)
        if (payload.userName) {
          lines.push(payload.userName);
        }
        lines.push(e.memberName);
        lines.push(`${e.roundLabel} (${e.roundTime})`);
        lines.push(`${e.count} ใบ`);
        lines.push("");
      }

      lines.push("รีบไปเข้าแถวก่อนเวลานะครับ!");

      const messageText = lines.join("\n");

      try {
        await client.pushMessage({
          to: lineId,
          messages: [
            {
              type: "text",
              text: messageText,
            },
          ],
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send combined LINE message to ${lineId}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
