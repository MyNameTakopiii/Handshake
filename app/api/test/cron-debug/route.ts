import { NextResponse } from "next/server";
import { TIME_SLOTS } from "@/data/member";

export async function GET() {
  try {
    // Get current time in Bangkok
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    
    const currentYear = bangkokTime.getFullYear();
    const currentMonth = String(bangkokTime.getMonth() + 1).padStart(2, '0');
    const currentDay = String(bangkokTime.getDate()).padStart(2, '0');
    const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

    // Calculate time windows (same as cron job)
    const minTarget = new Date(bangkokTime.getTime() + 5 * 60000);
    const maxTarget = new Date(bangkokTime.getTime() + 20 * 60000);

    const slotsToday = TIME_SLOTS[currentDateStr];
    
    if (!slotsToday) {
      return NextResponse.json({
        message: "No events scheduled for today",
        currentTime: bangkokTime.toISOString(),
        currentTimeFormatted: bangkokTime.toLocaleString('th-TH'),
        dateChecked: currentDateStr,
        availableDates: Object.keys(TIME_SLOTS)
      });
    }

    // Find upcoming rounds
    const upcomingRounds = slotsToday.filter(slot => {
      const [startTime] = slot.time.split("-");
      const [startH, startM] = startTime.split(":").map(Number);
      const roundStart = new Date(bangkokTime);
      roundStart.setHours(startH, startM, 0, 0);
      return roundStart >= minTarget && roundStart <= maxTarget;
    });

    // Get all slots with their status
    const allSlots = slotsToday.map(slot => {
      const [startTime] = slot.time.split("-");
      const [startH, startM] = startTime.split(":").map(Number);
      const roundStart = new Date(bangkokTime);
      roundStart.setHours(startH, startM, 0, 0);
      
      const minutesUntil = Math.round((roundStart.getTime() - bangkokTime.getTime()) / 60000);
      const isInWindow = roundStart >= minTarget && roundStart <= maxTarget;
      
      return {
        id: slot.id,
        label: slot.label,
        time: slot.time,
        minutesUntil,
        isInNotificationWindow: isInWindow,
        status: minutesUntil < 0 ? 'past' : (isInWindow ? 'notification-ready' : 'future')
      };
    });

    return NextResponse.json({
      message: "Debug information",
      currentTime: {
        iso: bangkokTime.toISOString(),
        formatted: bangkokTime.toLocaleString('th-TH'),
        date: currentDateStr
      },
      notificationWindow: {
        start: {
          iso: minTarget.toISOString(),
          formatted: minTarget.toLocaleString('th-TH')
        },
        end: {
          iso: maxTarget.toISOString(),
          formatted: maxTarget.toLocaleString('th-TH')
        }
      },
      summary: {
        totalSlotsToday: slotsToday.length,
        upcomingRoundsInWindow: upcomingRounds.length
      },
      upcomingRounds: upcomingRounds.map(r => ({
        id: r.id,
        label: r.label,
        time: r.time
      })),
      allSlots
    });

  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
