"use client";

import React, { useState, useEffect, useMemo, startTransition } from "react";
import {
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
  Star,
  Info
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

// บทพูดสำหรับ BNK48 และ CGM48
const SCRIPTS = {
  BNK48: [
    {
      id: 1,
      text: "ทำไมนะ ทำไมเป็น [ชื่อ Member] นี่มัน Masaka no confession คำที่ [ชื่อคุณ] บอกว่าชอบฉันทำให้ป่วนปั่น สับสนไปหมดเลย~"
    },
    {
      id: 2,
      text: "ทำไม ทำไมถึงโชคดีขนาดนี้ รู้มั้ยว่าการที่ได้พบเจอ [ชื่อคุณ] คือที่สุดในใจของ [ชื่อ Member] เลยนะ!"
    },
    {
      id: 3,
      text: "[ชื่อคุณ] รู้มั้ยคะว่า ไม่ว่าเสียงรถไฟจะดังแค่ไหน ก็อยากบอกให้รู้ว่า [ชื่อ Member] รักเธอนะ"
    },
    {
      id: 4,
      text: "Happy happy birthday นี่ไงเค้กของเธอปักเทียนวันเกิด~ วันเกิดปีนี้ [ชื่อ Member] ขอให้ [ชื่อคุณ] มีความสุขมาก ๆ ยิ้มเยอะ ๆ อยู่ด้วยกันไปนาน ๆ เลยนะคะ!"
    }
  ],
  CGM48: [
    {
      id: 1,
      text: "ได้สิได้ไหมทอ ถักความรักให้ไกลสุดไกล [ชื่อคุณ] รักแค่น้อง [ชื่อ Member] ได้ไหมคะ"
    },
    {
      id: 2,
      text: "I love you! Baby! Baby! ช่วยหันมามอง [ชื่อ Member] กันสักที สายตาคู่นั้นที่ [ชื่อคุณ] กำลังจ้องมองใครกันอยู่"
    },
    {
      id: 3,
      text: "[ชื่อ Member] ถูกเรียกว่าเป็นคนขี้แพ้มาโดยตลอด [ชื่อ Member] เองก็คิดว่าตัวเองเป็นคนขี้แพ้มาตลอดเหมือนกัน เพราะว่า [ชื่อ Member] แพ้รัก [ชื่อคุณ] ยังไงล่ะ!"
    },
    {
      id: 4,
      text: "Happy Birthday นะ [ชื่อคุณ] ขอให้สุขภาพร่างกายแข็งแรง รายล้อมไปด้วยความรักจาก [ชื่อ Member] มีความสุขแบบนี้ไปทุก ๆ ปีนะคะ"
    }
  ]
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState("2025-12-06");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptGroup, setScriptGroup] = useState<"BNK48" | "CGM48">("BNK48");

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
      }

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
    }, 2000);

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
    // setSelectedMembers([]); // ❌ จุดแก้ที่ 1: ลบการล้างค่าออก เพื่อให้จำข้ามวัน (หรือจะเปิดไว้ก็ได้ถ้าต้องการล้างเมื่อเปลี่ยนวัน)
    // แต่ถ้าอยากให้จำค่าเมื่อเปลี่ยนวัน ต้อง comment บรรทัดบนไว้ครับ
    // ถ้าอยากให้เปลี่ยนวันแล้วเริ่มใหม่ ให้เอา comment ออกครับ
    // กรณีนี้ผมขอเปิด comment ไว้ก่อนตาม requirement ทั่วไปของการวางแผนข้ามวัน
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
    // ✅ จุดแก้ที่ 2: ปรับ Logic การแสดงผล
    // ถ้าเลือก Category อยู่ ให้โชว์ทุกคนใน Category นั้น (เพื่อให้เลือกเพิ่มได้)
    // if (activeCategory) {
    //   return membersInActiveCategory;
    // }
    // ถ้าดูรวม (All) และมีคนที่เลือกไว้ ให้โชว์เฉพาะคนที่เลือก (My Selection View)
    if (selectedMembers.length > 0) {
      return membersOnDate.filter((m) => selectedMembers.includes(m.name));
    }
    // ถ้าไม่มีอะไรเลย โชว์ทั้งหมด
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
      const parts = key.split("-");
      const name = parts.slice(0, parts.length - 4).join("-");
      memberSet.add(name);
    });
    return { total: totalTickets, members: memberSet.size };
  }, [tickets]);

  // Calculate loops per member: 5 ใบ = 1 รอบ (excluding Special rounds)
  const getMemberLoops = (memberName: string) => {
    let total = 0;
    Object.entries(tickets).forEach(([key, count]) => {
      const parts = key.split("-");
      const roundId = parts[parts.length - 1];
      const name = parts.slice(0, parts.length - 4).join("-");
      if (name === memberName && roundId !== "SP") {
        total += count;
      }
    });
    return total <= 0 ? 0 : Math.ceil(total / 5);
  };

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
      const parts = key.split("-");
      const roundId = parts.pop()!;
      const day = parts.pop()!;
      const month = parts.pop()!;
      const year = parts.pop()!;
      const date = `${year}-${month}-${day}`;
      const name = parts.join("-");

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
      <header className="bg-linear-to-r from-pink-500 to-rose-400 text-white p-4 sm:p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" /> Handshake Planner
            </h1>
            <p className="opacity-90 text-xs sm:text-sm mt-1">BNK48 & CGM48 | Dec 2025 Events</p>
            <p className="opacity-90 text-xs sm:text-sm mt-1">Masaka no confession & ได้ด้ายไหม</p>
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
                  ล้างทั้งหมด
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

              {/* Script Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => {
                    setScriptGroup("BNK48");
                    setShowScriptModal(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-500 transition-all shadow-sm text-xs sm:text-sm font-semibold"
                >
                  ดูบทพูด BNK48
                </button>
                <button
                  onClick={() => {
                    setScriptGroup("CGM48");
                    setShowScriptModal(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-white px-4 py-2 rounded-lg hover:from-teal-500 hover:to-emerald-500 transition-all shadow-sm text-xs sm:text-sm font-semibold"
                >
                  ดูบทพูด CGM48
                </button>
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
                        // ✅ จุดแก้ที่ 1: เอา setSelectedMembers([]) ออกจากตรงนี้
                        onClick={() => { setActiveCategory(cat.id); }}
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
                      <X size={14} /> ล้าง Filter
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
                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 transition-all ${isSelected ? "bg-linear-to-tr from-pink-500 to-rose-400 shadow-md" : "bg-transparent"
                          }`}>
                          <Image src={m.image} alt={m.name} width={64} height={64} className="w-full h-full rounded-full object-cover bg-white border-2 border-white" />
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
                    <th key={round.id} className="p-2 text-center min-w-[100px] sm:min-w-[120px]">
                      <div className={`font-bold text-xs sm:text-sm ${round.id === 'SP' ? 'text-red-600' : 'text-gray-800'}`}>
                        {round.label}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-500 font-light mt-0.5">{round.time}</div>
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
                          <div className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl transition-all ${count > 0 ? 'bg-pink-100 ring-1 ring-pink-200' : ''}`}>
                            {typeof isAvailable === 'string' && (
                              <div className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1 tracking-tight">
                                {isAvailable === "100" ? "100" : `LANE ${isAvailable}`}
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-7">
                              {count > 0 ? (
                                <>
                                  <button onClick={() => updateTicket(member.name, selectedDate, round.id, -1)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base bg-white text-pink-600 shadow-sm hover:bg-pink-50 transition-colors">-</button>
                                  <span className="w-5 sm:w-6 text-center font-bold text-base sm:text-lg text-pink-600 leading-none">{count}</span>
                                  <button onClick={() => updateTicket(member.name, selectedDate, round.id, 1)} className="w-6 h-6 sm:w-7 sm:h-7 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-pink-500 hover:text-white flex items-center justify-center text-sm sm:text-base shadow-sm transition-colors">+</button>
                                </>
                              ) : (
                                typeof isAvailable === 'string' ? (
                                  <button onClick={() => updateTicket(member.name, selectedDate, round.id, 1)} className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 text-gray-400 rounded-lg hover:bg-pink-500 hover:text-white flex items-center justify-center text-sm sm:text-base shadow-sm transition-colors">+</button>
                                ) : (
                                  <>
                                    <div className="w-6 h-6 sm:w-7 sm:h-7"></div>
                                    <span className="text-gray-300 text-base sm:text-lg flex items-center justify-center"><Star className="text-gray-300 fill-gray-300 mt-0.5" size={18} /></span>
                                    <button onClick={() => updateTicket(member.name, selectedDate, round.id, 1)} className="w-6 h-6 sm:w-7 sm:h-7 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-pink-500 hover:text-white flex items-center justify-center text-sm sm:text-base shadow-sm transition-colors">+</button>
                                  </>
                                )
                              )}
                            </div>
                            {round.id !== 'SP' && count > 0 && (
                              <div className="text-[9px] text-gray-400 mt-1">
                                {Math.ceil(count / 5)} รอบ
                              </div>
                            )}
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

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 sm:p-5 text-sm text-amber-900 shadow-sm">
          <div className="text-center font-medium mb-4 pb-4 border-b border-amber-200 flex justify-center items-center gap-2 text-xs sm:text-sm">
            <Info size={16} />
            *รอบจับมืออาจมีการเปลี่ยนแปลงในภายหลังตามความเหมาะสม โดยจะประกาศให้ทราบอีกครั้ง
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg mb-2 text-amber-950">Digital Event Ticket</h3>
              <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
                ใช้ BNK48 20th Single <span className="font-semibold">&quot;Masaka no Confession&quot;</span> <br />
                หรือ CGM48 10th Single <span className="font-semibold">&quot;ได้ (ด้าย) ไหม&quot;</span> <br />
                ในการเข้าร่วมกิจกรรม
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3 bg-white/50 p-2 rounded-lg">
                <div className="text-gray-600 fill-gray-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-700 text-xs sm:text-sm">Round 1-5 | 1 - 5 ใบ</span>
                  <span className="text-gray-600 text-[10px] sm:text-xs">ร่วมกิจกรรม 1-SHOT VIDEO SHOOTING ได้</span>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 p-2 rounded-lg">
                <div className="text-orange-500 fill-orange-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-red-600 text-xs sm:text-sm">Special | 1 - 100 ใบ</span>
                  <span className="text-red-600 text-[10px] sm:text-xs">ร่วมกิจกรรมจับมือได้เท่านั้น (ร่วมกิจกรรมได้เพียงวันละ 1 เมมเบอร์เท่านั้น)</span>
                </div>
              </div>
            </div>
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
          <div className="flex items-center gap-4">
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
      </div>

      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowSummaryModal(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
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
                          "ส่งรายละเอียดทั้งหมดไปที่ LINE ของคุณหรือไม่?\n\n(จะส่งรายการที่เลือกไว้ทั้งหมด)"
                        )
                      ) {
                        return;
                      }

                      try {
                        // Check if there are any items
                        if (Object.keys(detailedSummary).length === 0) {
                          alert("ไม่มีรายการที่จะส่ง");
                          return;
                        }

                        const res = await fetch("/api/test/notify-simulation", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            summary: detailedSummary,
                          }),
                        });

                        const data = await res.json();

                        if (data.success) {
                          alert(
                            "ส่งรายละเอียดสำเร็จ!\n\nตรวจสอบ LINE ของคุณเลยครับ"
                          );
                        } else {
                          alert(
                            "เกิดข้อผิดพลาด:\n" +
                            (data.error || "Unknown error") +
                            "\n\n" +
                            (data.details || "")
                          );
                        }
                      } catch (error) {
                        alert("เกิดข้อผิดพลาด: " + error);
                      }
                    }}
                    className="no-capture flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-xs sm:text-sm font-semibold shadow-sm"
                  >
                    ส่งไปที่ LINE
                  </button>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button onClick={copySummaryToClipboard} className="no-capture flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 text-xs sm:text-sm font-semibold shadow-sm">
                  <Copy size={14} className="sm:w-4 sm:h-4" /> คัดลอก
                </button>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="no-capture flex-1 sm:flex-none bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-800 text-xs sm:text-sm font-bold shadow-md"
                >
                  ปิด
                </button>
              </div>

              {/* QR Code Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                      แอด LINE เพื่อดูข้อมูลสรุปที่คุณเลือก
                    </h3>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-green-200">
                    <Image
                      src="/QRCode.png"
                      alt="LINE QR Code"
                      width={180}
                      height={180}
                      className="w-40 h-40 sm:w-44 sm:h-44"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowScriptModal(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`p-4 border-b ${scriptGroup === "BNK48" ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100" : "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100"} rounded-t-2xl`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-lg font-bold ${scriptGroup === "BNK48" ? "text-pink-700" : "text-teal-700"} flex items-center gap-2`}>
                  บทพูด {scriptGroup}
                  <span className="text-xs font-normal opacity-75">({SCRIPTS[scriptGroup].length} บท)</span>
                </h2>
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="p-1 rounded-full hover:bg-white/50 text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {SCRIPTS[scriptGroup].map((script) => (
                <div
                  key={script.id}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${scriptGroup === "BNK48"
                    ? "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:border-pink-300"
                    : "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 hover:border-teal-300"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${scriptGroup === "BNK48"
                      ? "bg-gradient-to-br from-pink-500 to-rose-500"
                      : "bg-gradient-to-br from-teal-500 to-emerald-500"
                      }`}>
                      {script.id}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm sm:text-base leading-relaxed ${scriptGroup === "BNK48" ? "text-gray-800" : "text-gray-800"
                        }`}>
                        {script.text}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-200/50 flex gap-2 text-xs text-gray-500">
                        <span className="bg-white/60 px-2 py-1 rounded">[ชื่อคุณ] = ชื่อของคุณ</span>
                        <span className="bg-white/60 px-2 py-1 rounded">[ชื่อ Member] = ชื่อเมมเบอร์</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-4 border-t ${scriptGroup === "BNK48" ? "bg-pink-50 border-pink-100" : "bg-teal-50 border-teal-100"} rounded-b-2xl`}>
              <div className="flex gap-2 justify-between items-center flex-wrap">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">คำแนะนำ:</span> สามารถใช้บทพูดเหล่านี้เป็นแนวทางในการสนทนากับเมมเบอร์ได้
                </div>
                <button
                  onClick={() => setShowScriptModal(false)}
                  className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all hover:scale-105 ${scriptGroup === "BNK48"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                    }`}
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

