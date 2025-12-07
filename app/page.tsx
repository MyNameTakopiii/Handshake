"use client";

import React, { useState, useEffect, useMemo, startTransition } from "react";
import {
  Save,
  Users,
  Calendar,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  List,
  Clock,
  Copy,
  LogIn,
  LogOut,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { MEMBERS, TIME_SLOTS } from "@/data/member";
import Image from "next/image";

// กำหนดหมวดหมู่ตัวกรองทั้งหมด
const ALL_CATEGORIES = [
  { id: "BNK3", label: "BNK48 Gen 3", group: "BNK48", gen: "3" },
  { id: "BNK4", label: "BNK48 Gen 4", group: "BNK48", gen: "4" },
  { id: "BNK5", label: "BNK48 Gen 5", group: "BNK48", gen: "5" },
  { id: "BNK6", label: "BNK48 Gen 6", group: "BNK48", gen: "6" },
  { id: "CGM2", label: "CGM48 Gen 2", group: "CGM48", gen: "2" },
  { id: "CGM3", label: "CGM48 Gen 3", group: "CGM48", gen: "3" },
  { id: "CGM4", label: "CGM48 Gen 4", group: "CGM48", gen: "4" },
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState("2025-12-27");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [isClient, setIsClient] = useState(false);
  const [tickets, setTickets] = useState<Record<string, number>>({});
  const { data: session } = useSession();

  useEffect(() => {
    const saved = localStorage.getItem("handshake_planner_v1");
    startTransition(() => {
      if (saved) setTickets(JSON.parse(saved));
      setIsClient(true);
    });
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("handshake_planner_v1", JSON.stringify(tickets));
    }
  }, [tickets, isClient]);

  useEffect(() => {
    if (session?.user) {
      const syncData = async () => {
        try {
          const res = await fetch("/api/bookings");
          const data = await res.json();

          if (data.tickets && Object.keys(data.tickets).length > 0) {
            setTickets(data.tickets);
          } else {
            // DB is empty. If we have local data, save it.
            if (Object.keys(tickets).length > 0) {
              await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tickets }),
              });
            }
          }
        } catch (e) {
          console.error("Sync failed", e);
        }
      };

      syncData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Auto-save to DB when tickets change (debounce)
  useEffect(() => {
    if (!session?.user || !isClient) return;

    const timer = setTimeout(() => {
      if (Object.keys(tickets).length > 0) {
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickets }),
        }).catch((e) => console.error("Auto-save failed", e));
      }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [tickets, session, isClient]);

  const handleClearTickets = async () => {
    // 1. Clear client state
    setTickets({});
    localStorage.removeItem("handshake_planner_v1");

    // 2. Clear DB if user is logged in
    if (session?.user) {
      try {
        await fetch("/api/bookings", {
          method: "DELETE",
        });
      } catch (err) {
        console.error("DB clear failed:", err);
      }
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setActiveCategory(null);
    setSelectedMembers([]);
    setIsFilterExpanded(false);
  };

  const updateTicket = (
    member: string,
    date: string,
    roundId: string,
    change: number
  ) => {
    const key = `${member}-${date}-${roundId}`;
    const current = tickets[key] || 0;
    const newValue = Math.max(0, current + change);

    setTickets((prev) => {
      const copy = { ...prev };
      if (newValue === 0) delete copy[key];
      else copy[key] = newValue;
      return copy;
    });
  };

  const currentCategories = useMemo(() => {
    if (selectedDate === "2025-12-06") {
      return ALL_CATEGORIES.filter(
        (c) => c.group === "CGM48" && ["2", "3"].includes(c.gen)
      );
    }
    if (selectedDate === "2025-12-07") {
      return ALL_CATEGORIES.filter(
        (c) => c.group === "BNK48" && ["3", "5"].includes(c.gen)
      );
    }
    return ALL_CATEGORIES;
  }, [selectedDate]);

  const membersOnDate = useMemo(() => {
    return MEMBERS.filter((m) => m.dates[selectedDate]);
  }, [selectedDate]);

  const membersInActiveCategory = useMemo(() => {
    if (!activeCategory) return membersOnDate;
    const cat = ALL_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return membersOnDate;
    return membersOnDate.filter(
      (m) => m.group === cat.group && m.generation === cat.gen
    );
  }, [activeCategory, membersOnDate]);

  const displayedTableMembers = useMemo(() => {
    if (selectedMembers.length > 0) {
      return membersOnDate.filter((m) => selectedMembers.includes(m.name));
    }
    return membersInActiveCategory;
  }, [selectedMembers, membersInActiveCategory, membersOnDate]);

  const toggleMemberSelection = (name: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const currentRounds = TIME_SLOTS[selectedDate] || [];

  const summary = useMemo(() => {
    let totalTickets = 0;
    const memberSet = new Set<string>();
    Object.entries(tickets).forEach(([key, count]) => {
      totalTickets += count;
      // การดึงชื่อเมมเบอร์จาก Key ต้องระวังเรื่องขีด - ในวันที่
      // Key format: Name-YYYY-MM-DD-RoundID
      // วิธีที่ปลอดภัยคือตัดส่วนท้ายออก 4 ส่วน (Round, DD, MM, YYYY) ที่เหลือคือชื่อ
      const parts = key.split("-");
      const name = parts.slice(0, parts.length - 4).join("-");
      memberSet.add(name);
    });
    return { total: totalTickets, members: memberSet.size };
  }, [tickets]);

  // --- 🛠️ แก้ไข Logic จัดกลุ่มข้อมูล (Fix Detail Summary) ---
  type DetailedItem = {
    name: string;
    image: string;
    roundLabel: string;
    roundTime: string;
    roundId: string;
    count: number;
  };

  const detailedSummary = useMemo(() => {
    const groupedByDate: Record<string, DetailedItem[]> = {};

    Object.entries(tickets).forEach(([key, count]) => {
      // แก้ไขการแยก Key: เนื่องจาก Date มีขีด (-) เราจึงใช้ split ธรรมดาไม่ได้
      // Key format: "Name-2025-12-27-R1"
      const parts = key.split("-");
      const roundId = parts.pop()!; // ตัวสุดท้ายคือ RoundID
      const day = parts.pop()!; // ตัวรองสุดท้ายคือ DD
      const month = parts.pop()!; // MM
      const year = parts.pop()!; // YYYY
      const date = `${year}-${month}-${day}`; // ประกอบวันที่คืนมา
      const name = parts.join("-"); // ที่เหลือข้างหน้าคือชื่อ (เผื่อชื่อมีขีด)

      const member = MEMBERS.find((m) => m.name === name);
      const round = TIME_SLOTS[date]?.find((r) => r.id === roundId);

      if (member && round) {
        if (!groupedByDate[date]) groupedByDate[date] = [];
        groupedByDate[date].push({
          name: member.name,
          image: member.image,
          roundLabel: round.label,
          roundTime: round.time,
          roundId: round.id,
          count: count,
        });
      }
    });

    Object.keys(groupedByDate).forEach((date) => {
      groupedByDate[date].sort((a, b) => {
        if (a.roundId !== b.roundId) return a.roundId.localeCompare(b.roundId);
        return a.name.localeCompare(b.name);
      });
    });

    return Object.keys(groupedByDate)
      .sort()
      .reduce((obj, key) => {
        obj[key] = groupedByDate[key];
        return obj;
      }, {} as Record<string, DetailedItem[]>);
  }, [tickets]);

  const copySummaryToClipboard = () => {
    let text = "📋 Handshake Plan\n";
    Object.entries(detailedSummary).forEach(([date, items]) => {
      text += `\n📅 ${new Date(date).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      })}\n`;
      items.forEach((item) => {
        text += `- ${item.name} (${item.roundLabel} ${item.roundTime}): ${item.count} ใบ\n`;
      });
    });
    text += `\nรวมทั้งหมด: ${summary.total} ใบ`;
    navigator.clipboard.writeText(text);
    alert("คัดลอกรายการเรียบร้อย! อวดเพื่อนได้เลย 🎉");
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-pink-50 pb-32 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-pink-500 to-rose-400 text-white p-4 sm:p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" /> Handshake Planner
            </h1>
            <p className="opacity-90 text-xs sm:text-sm mt-1">
              BNK48 & CGM48 | Dec 2025 Events
            </p>
          </div>
          <div className="w-full sm:w-auto">
            {session ? (
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col sm:text-right">
                    <div className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-none">
                      {session.user?.name}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-80">
                      LINE Login
                    </div>
                  </div>
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/50"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/test/my-line-id");
                        const data = await res.json();
                        if (data.testUrl) {
                          if (
                            confirm(
                              "ต้องการส่งข้อความทดสอบไปที่ LINE ของคุณหรือไม่?"
                            )
                          ) {
                            const testRes = await fetch(data.testUrl);
                            const testData = await testRes.json();
                            if (testData.success) {
                              alert(
                                "✅ ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE ของคุณ"
                              );
                            } else {
                              alert(
                                "❌ เกิดข้อผิดพลาด: " +
                                (testData.error || "Unknown")
                              );
                            }
                          }
                        } else {
                          alert(
                            "❌ ไม่พบ LINE ID กรุณา logout แล้ว login ใหม่"
                          );
                        }
                      } catch (error) {
                        alert("❌ เกิดข้อผิดพลาด: " + error);
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 p-1.5 sm:p-2 rounded-lg transition-colors text-sm sm:text-base"
                    title="Test LINE Notification"
                  >
                    🔔
                  </button>
                  <button
                    onClick={handleClearTickets}
                    className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="bg-white/20 hover:bg-white/30 p-1.5 sm:p-2 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => signIn("line")}
                  className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
                >
                  <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Login with LINE</span>
                </button>
                <button
                  onClick={handleClearTickets}
                  className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <span className="flex items-center gap-2 text-pink-700 font-semibold text-sm sm:text-base">
                  <Calendar size={18} className="sm:w-5 sm:h-5" />{" "}
                  วันที่กิจกรรม:
                </span>
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-pink-600 font-medium transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 ml-auto sm:ml-0"
                >
                  {isFilterExpanded ? (
                    <ChevronUp size={14} className="sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">Filter Members</span>
                  <span className="sm:hidden">Filter</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(TIME_SLOTS).map((date) => (
                  <button
                    key={date}
                    onClick={() => handleDateChange(date)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${selectedDate === date
                        ? "bg-pink-500 text-white ring-2 ring-pink-300 ring-offset-1"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {new Date(date).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-300">
              <hr className="border-gray-100 mb-4" />
              <div className="mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeCategory === null
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      All
                    </button>
                    {currentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setSelectedMembers([]);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeCategory === cat.id
                            ? cat.group === "BNK48"
                              ? "bg-violet-100 text-violet-700 border-violet-300 ring-2 ring-violet-200"
                              : "bg-teal-100 text-teal-700 border-teal-300 ring-2 ring-teal-200"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {(activeCategory || selectedMembers.length > 0) && (
                    <button
                      onClick={() => {
                        setActiveCategory(null);
                        setSelectedMembers([]);
                      }}
                      className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold whitespace-nowrap"
                    >
                      <X size={14} /> ล้างทั้งหมด
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    MEMBERS ({membersInActiveCategory.length})
                    <span className="font-normal text-gray-400 ml-2 normal-case hidden sm:inline">
                      *แตะที่รูปเพื่อเลือกดูเฉพาะคนนั้น (เลือกได้หลายคน)
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {membersInActiveCategory.map((m) => {
                    const isSelected = selectedMembers.includes(m.name);
                    return (
                      <button
                        key={m.name}
                        onClick={() => toggleMemberSelection(m.name)}
                        className={`relative flex flex-col items-center group transition-all duration-200 ${isSelected
                            ? "transform scale-105"
                            : "hover:opacity-80"
                          }`}
                      >
                        <div
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 transition-all ${isSelected
                              ? "bg-gradient-to-tr from-pink-500 to-rose-400 shadow-md"
                              : "bg-transparent"
                            }`}
                        >
                          <Image
                            src={m.image}
                            alt={m.name}
                            width={64}
                            height={64}
                            className="w-full h-full rounded-full object-cover bg-white border-2 border-white"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle
                                size={16}
                                className="text-green-500 fill-white"
                              />
                            </div>
                          )}
                        </div>
                        <span
                          className={`mt-1.5 text-[10px] sm:text-xs text-center truncate w-full px-1 font-medium transition-colors ${isSelected
                              ? "text-pink-600 font-bold"
                              : "text-gray-600"
                            }`}
                        >
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {membersInActiveCategory.length === 0 && (
                  <div className="text-center text-gray-400 py-4 text-sm">
                    ไม่มีรายชื่อในกลุ่มนี้สำหรับวันที่เลือก
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* === DATA TABLE === */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-2xl">
            <table className="w-full min-w-[600px] sm:min-w-[800px]">
              <thead className="bg-amber-50">
                <tr>
                  <th className="p-2 sm:p-4 text-left w-40 sm:w-56 sticky left-0 bg-amber-50 z-10 text-amber-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="text-xs sm:text-sm font-bold">
                      MEMBER ({displayedTableMembers.length})
                    </div>
                  </th>
                  {currentRounds.map((round) => (
                    <th
                      key={round.id}
                      className="p-2 text-center min-w-[100px] sm:min-w-[120px]"
                    >
                      <div className="font-bold text-pink-700 text-xs sm:text-sm">
                        {round.label}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-500 font-light mt-0.5">
                        {round.time}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-rose-600 font-medium mt-1 bg-rose-50 px-1 sm:px-1.5 py-0.5 rounded-full inline-block border border-rose-100">
                        Close {round.closeTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedTableMembers.map((member) => (
                  <tr
                    key={member.name}
                    className="group hover:bg-pink-50/40 transition-colors"
                  >
                    <td className="p-2 sm:p-3 sticky left-0 bg-white group-hover:bg-pink-50/40 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={48}
                          height={48}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-100 shadow-sm bg-gray-100"
                        />
                        <span className="font-bold text-gray-800 text-sm sm:text-lg leading-tight">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    {currentRounds.map((round) => {
                      const isAvailable =
                        member.dates[selectedDate]?.[round.id];
                      const ticketKey = `${member.name}-${selectedDate}-${round.id}`;
                      const count = tickets[ticketKey] || 0;

                      if (!isAvailable)
                        return (
                          <td key={round.id} className="bg-gray-50/50"></td>
                        );

                      return (
                        <td key={round.id} className="p-1 sm:p-2 align-middle">
                          <div
                            className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl transition-all ${count > 0
                                ? "bg-pink-100 ring-1 ring-pink-200"
                                : ""
                              }`}
                          >
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <button
                                onClick={() =>
                                  updateTicket(
                                    member.name,
                                    selectedDate,
                                    round.id,
                                    -1
                                  )
                                }
                                disabled={count === 0}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all ${count > 0
                                    ? "bg-white text-pink-600 shadow-sm"
                                    : "opacity-0 pointer-events-none"
                                  }`}
                              >
                                -
                              </button>

                              {count > 0 ? (
                                <span className="w-5 sm:w-6 text-center font-bold text-base sm:text-lg text-pink-600">
                                  {count}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-base sm:text-lg">
                                  ★
                                </span>
                              )}

                              <button
                                onClick={() =>
                                  updateTicket(
                                    member.name,
                                    selectedDate,
                                    round.id,
                                    1
                                  )
                                }
                                className="w-6 h-6 sm:w-7 sm:h-7 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-pink-500 hover:text-white flex items-center justify-center text-sm sm:text-base shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedTableMembers.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                ไม่พบรายชื่อเมมเบอร์ในกลุ่มที่เลือก
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 pb-8 md:pb-4 z-40">
        <div className="max-w-6xl mx-auto flex flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              สรุปยอดรวม
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-pink-600">
                  {summary.total}
                </span>
                <span className="text-sm text-gray-600 font-medium">ใบ</span>
              </div>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-700">
                  {summary.members}
                </span>
                <span className="text-sm text-gray-500">คน</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-gray-800 shadow-lg active:scale-95 transition-all text-sm sm:text-base"
              onClick={() => setShowSummaryModal(true)}
            >
              <List size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-semibold text-xs sm:text-base">
                ดูรายละเอียด
              </span>
            </button>
          </div>
        </div>
      </div>

      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSummaryModal(false)}
          ></div>
          <div
            id="summary-modal-content"
            className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <List size={20} className="text-pink-500" /> รายการที่เลือก
              </h2>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="no-capture p-1 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(detailedSummary).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>ยังไม่ได้เลือกบัตรใดๆ</p>
                </div>
              ) : (
                Object.entries(detailedSummary).map(([date, items]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-white/95 backdrop-blur z-10 py-2 mb-2 border-b border-pink-100">
                      <h3 className="font-bold text-pink-700 text-sm uppercase flex items-center gap-2">
                        <Calendar size={14} />{" "}
                        {new Date(date).toLocaleDateString("th-TH", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover bg-white border"
                            />
                            <div>
                              <div className="font-bold text-gray-800">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={10} /> {item.roundLabel} (
                                {item.roundTime})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-pink-600">
                              {item.count}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              ใบ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block">
                    รวมทั้งหมด
                  </span>
                  <span className="text-xl font-bold text-pink-600">
                    {summary.total} ใบ
                  </span>
                </div>
                {session && summary.total > 0 && (
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          "ส่งข้อความทดสอบไปที่ LINE ของคุณหรือไม่?\n\n(จะใช้ข้อมูลรายการแรกในสรุป)"
                        )
                      ) {
                        return;
                      }

                      try {
                        // Get first item from summary
                        const firstDate = Object.keys(detailedSummary)[0];
                        const firstItem = detailedSummary[firstDate]?.[0];

                        if (!firstItem) {
                          alert("ไม่พบข้อมูลที่จะทดสอบ");
                          return;
                        }

                        const res = await fetch("/api/test/notify-simulation", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            memberName: firstItem.name,
                            roundLabel: firstItem.roundLabel,
                            roundTime: firstItem.roundTime,
                            count: firstItem.count,
                          }),
                        });

                        const data = await res.json();

                        if (data.success) {
                          alert(
                            "✅ ส่งข้อความทดสอบสำเร็จ!\n\nตรวจสอบ LINE ของคุณเลยครับ 📱"
                          );
                        } else {
                          alert(
                            "❌ เกิดข้อผิดพลาด:\n" +
                            (data.error || "Unknown error") +
                            "\n\n" +
                            (data.details || "")
                          );
                        }
                      } catch (error) {
                        alert("❌ เกิดข้อผิดพลาด: " + error);
                      }
                    }}
                    className="no-capture flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-xs sm:text-sm font-semibold shadow-sm"
                  >
                    🔔 ทดสอบแจ้งเตือน
                  </button>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={copySummaryToClipboard}
                  className="no-capture flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <Copy size={14} className="sm:w-4 sm:h-4" /> คัดลอก
                </button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="no-capture flex-1 sm:flex-none bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-800 text-xs sm:text-sm font-bold shadow-md"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
