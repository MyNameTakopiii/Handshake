// src/data/members.ts
export type TimeSlot = {
  id: string;
  label: string;
  time: string;
  closeTime: string;
};

export const TIME_SLOTS: Record<string, TimeSlot[]> = {
  "2025-12-06": [
    { id: "R1", label: "Round 1", time: "12:00-13:30", closeTime: "13:15" },
    { id: "R2", label: "Round 2", time: "13:30-15:00", closeTime: "14:45" },
    { id: "R3", label: "Round 3", time: "15:00-16:30", closeTime: "16:15" },
    { id: "R4", label: "Round 4", time: "16:30-18:00", closeTime: "17:45" },
    { id: "SP", label: "Special", time: "19:00-21:00", closeTime: "19:05" },
  ],
  "2025-12-07": [
    { id: "R1", label: "Round 1", time: "12:00-13:30", closeTime: "13:15" },
    { id: "R2", label: "Round 2", time: "13:30-15:00", closeTime: "14:45" },
    { id: "R3", label: "Round 3", time: "15:00-16:30", closeTime: "16:15" },
    { id: "R4", label: "Round 4", time: "16:30-18:00", closeTime: "17:45" },
    { id: "SP", label: "Special", time: "19:00-21:00", closeTime: "19:05" },
  ],
  "2025-12-27": [
    { id: "R1", label: "Round 1", time: "11:00-12:30", closeTime: "12:15" },
    { id: "R2", label: "Round 2", time: "12:30-14:00", closeTime: "13:45" },
    { id: "R3", label: "Round 3", time: "14:00-15:30", closeTime: "15:15" },
    { id: "R4", label: "Round 4", time: "15:30-17:00", closeTime: "16:45" },
    { id: "R5", label: "Round 5", time: "17:00-18:30", closeTime: "18:15" },
    { id: "SP", label: "Special", time: "19:00-21:00", closeTime: "19:00" },
  ],
  "2025-12-28": [
    { id: "R1", label: "Round 1", time: "11:00-12:30", closeTime: "12:15" },
    { id: "R2", label: "Round 2", time: "12:30-14:00", closeTime: "13:45" },
    { id: "R3", label: "Round 3", time: "14:00-15:30", closeTime: "15:15" },
    { id: "R4", label: "Round 4", time: "15:30-17:00", closeTime: "16:45" },
    { id: "R5", label: "Round 5", time: "17:00-18:30", closeTime: "18:15" },
    { id: "SP", label: "Special", time: "19:00-21:00", closeTime: "19:00" },
  ],
};

export interface Member {
  name: string;
  group: "BNK48" | "CGM48";
  generation: string;
  image: string;
  dates: Record<string, Record<string, boolean | string>>;
}

export const MEMBERS: Member[] = [
  // ================= BNK48 (TCA Event - 7 Dec) =================
  { name: "Galeya", group: "BNK48", generation: "5", image: "/images/galeya.jpg", dates: { "2025-12-07": { R2: "3", R4: "3", SP: " " } } },
  { name: "Grace", group: "BNK48", generation: "3", image: "/images/grace.jpg", dates: { "2025-12-07": { R1: "3", R2: "2", SP: "3" } } },
  { name: "Hoop", group: "BNK48", generation: "3", image: "/images/hoop.jpg", dates: { "2025-12-07": { R1: "1", R2: "1", R4: "1", SP: "1" } } },
  { name: "Jew", group: "BNK48", generation: "5", image: "/images/jew.jpg", dates: { "2025-12-07": { R1: "4", R3: "4", SP: "4" } } },
  { name: "Nall", group: "BNK48", generation: "5", image: "/images/nall.jpg", dates: { "2025-12-07": { R2: "4", R4: "4", SP: " " } } },
  { name: "Niya", group: "BNK48", generation: "5", image: "/images/niya.jpg", dates: { "2025-12-07": { R1: "2", R3: "2", R4: "2", SP: "2" } } },

  // ================= CGM48 Special Round (6 Dec) =================
  { name: "Jingjing", group: "CGM48", generation: "2", image: "/images/jingjing.jpg", dates: { "2025-12-06": { R1: "1", R3: "1", R4: "1", SP: "1" } } },
  { name: "Lookked", group: "CGM48", generation: "2", image: "/images/lookked.jpg", dates: { "2025-12-06": { R1: "2", R3: "2", R4: "2", SP: "2" } } },
  { name: "Nana", group: "CGM48", generation: "2", image: "/images/nana.jpg", dates: { "2025-12-06": { R1: "3", R2: "3", R4: "3", SP: "3" } } },
  { name: "Ploen", group: "CGM48", generation: "3", image: "/images/ploen.jpg", dates: { "2025-12-06": { R1: "4", R2: "4", R4: "4", SP: "4" } } },

  // ================= BNK48 Handshake Event (27-28 Dec) [Arlee -> Yoghurt] =================
  { name: "Arlee", group: "BNK48", generation: "5", image: "/images/arlee.jpg", dates: { "2025-12-27": { R1: true, R3: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },
  { name: "Berry", group: "BNK48", generation: "4", image: "/images/berry.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R2: true, R4: true } } },
  { name: "Blythe", group: "BNK48", generation: "6", image: "/images/blythe.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true } } },
  { name: "Cartoon", group: "BNK48", generation: "6", image: "/images/cartoon.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R2: true, R5: true } } },
  { name: "Earth", group: "BNK48", generation: "3", image: "/images/earth.jpg", dates: { "2025-12-27": { R1: true, R3: true, SP: true }, "2025-12-28": { R2: true, R4: true } } },
  { name: "Earn", group: "BNK48", generation: "3", image: "/images/earn.jpg", dates: { "2025-12-27": { R2: true, R5: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Emmy", group: "BNK48", generation: "4", image: "/images/emmy.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },
  { name: "Eve", group: "BNK48", generation: "3", image: "/images/eve.jpg", dates: { "2025-12-27": { R2: true, R4: true }, "2025-12-28": { R2: true, R5: true, SP: true } } },
  { name: "Fame", group: "BNK48", generation: "3", image: "/images/fame.jpg", dates: { "2025-12-27": { R3: true, R5: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Grape", group: "BNK48", generation: "6", image: "/images/grape.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true } } },
  { name: "Inkcha", group: "BNK48", generation: "6", image: "/images/inkcha.jpg", dates: { "2025-12-27": { R1: true, R5: true, SP: true }, "2025-12-28": { R3: true, R5: true } } },
  { name: "Kaofrang", group: "BNK48", generation: "3", image: "/images/kaofrang.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R2: true, R4: true } } },
  { name: "Khaimook", group: "BNK48", generation: "5", image: "/images/khaimook.jpg", dates: { "2025-12-27": { R1: true, R3: true, SP: true }, "2025-12-28": { R2: true, R5: true } } },
  { name: "Khowjow", group: "BNK48", generation: "6", image: "/images/khowjow.jpg", dates: { "2025-12-27": { R1: true, R3: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "L", group: "BNK48", generation: "4", image: "/images/l.jpg", dates: { "2025-12-27": { R1: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },
  { name: "Luksorn", group: "BNK48", generation: "6", image: "/images/luksorn.jpg", dates: { "2025-12-27": { R3: true, R5: true }, "2025-12-28": { R1: true, R4: true, SP: true } } },
  { name: "Mail", group: "BNK48", generation: "6", image: "/images/mail.jpg", dates: { "2025-12-27": { R1: true, R4: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Marine", group: "BNK48", generation: "4", image: "/images/marine.jpg", dates: { "2025-12-27": { R1: true, R3: true, R5: true }, "2025-12-28": { R1: true, R4: true, SP: true } } },
  { name: "Mayji", group: "BNK48", generation: "5", image: "/images/mayji.jpg", dates: { "2025-12-27": { R2: true, R5: true, SP: true }, "2025-12-28": { R1: true, R3: true } } },
  { name: "Mean", group: "BNK48", generation: "3", image: "/images/mean.jpg", dates: { "2025-12-27": { R2: true, R4: true }, "2025-12-28": { R3: true, R5: true, SP: true } } },
  { name: "Micha", group: "BNK48", generation: "4", image: "/images/micha.jpg", dates: { "2025-12-27": { R1: true, R3: true, R5: true }, "2025-12-28": { R3: true, R5: true, SP: true } } },
  { name: "Mint", group: "BNK48", generation: "6", image: "/images/mint.jpg", dates: { "2025-12-27": { R1: true, R4: true }, "2025-12-28": { R1: true, R3: true, SP: true } } },
  { name: "Mirin", group: "BNK48", generation: "6", image: "/images/mirin.jpg", dates: { "2025-12-27": { R1: true, R3: true, SP: true }, "2025-12-28": { R2: true, R5: true } } },
  { name: "Monet", group: "BNK48", generation: "3", image: "/images/monet.jpg", dates: { "2025-12-27": { R1: true, R3: true, R5: true }, "2025-12-28": { R1: true, R3: true, SP: true } } },
  { name: "Nammonn", group: "BNK48", generation: "5", image: "/images/nammonn.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R3: true, R5: true } } },
  { name: "Neen", group: "BNK48", generation: "5", image: "/images/neen.jpg", dates: { "2025-12-27": { R3: true, R5: true }, "2025-12-28": { R1: true, R4: true, SP: true } } },
  { name: "Palmmy", group: "BNK48", generation: "4", image: "/images/palmmy.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R2: true, R4: true } } },
  { name: "Pancake", group: "BNK48", generation: "3", image: "/images/pancake.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },
  { name: "Patt", group: "BNK48", generation: "4", image: "/images/patt.jpg", dates: { "2025-12-27": { R1: true, R3: true, R4: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Peak", group: "BNK48", generation: "3", image: "/images/peak.jpg", dates: { "2025-12-27": { R1: true, R3: true, R5: true }, "2025-12-28": { R1: true, R4: true, SP: true } } },
  { name: "Praew", group: "BNK48", generation: "6", image: "/images/praew.jpg", dates: { "2025-12-27": { R2: true, R5: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },
  { name: "Proud", group: "BNK48", generation: "5", image: "/images/proud.jpg", dates: { "2025-12-27": { R1: true, R3: true, R4: true, R5: true, SP: true } } },
  { name: "Rose", group: "BNK48", generation: "6", image: "/images/rose.jpg", dates: { "2025-12-27": { R3: true, R5: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Saonoi", group: "BNK48", generation: "5", image: "/images/saonoi.jpg", dates: { "2025-12-27": { R2: true, R4: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Wawa", group: "BNK48", generation: "4", image: "/images/wawa.jpg", dates: { "2025-12-27": { R2: true, R5: true }, "2025-12-28": { R1: true, R3: true, SP: true } } },
  { name: "Yayee", group: "BNK48", generation: "3", image: "/images/yayee.jpg", dates: { "2025-12-27": { R1: true, R2: true }, "2025-12-28": { R2: true, R5: true, SP: true } } },
  { name: "Yoghurt", group: "BNK48", generation: "3", image: "/images/yoghurt.jpg", dates: { "2025-12-27": { R3: true, R5: true, SP: true }, "2025-12-28": { R1: true, R3: true, R5: true } } },

  // ================= CGM48 Handshake Event (27-28 Dec) [Else -> Valentine] =================
  { name: "Else", group: "CGM48", generation: "4", image: "/images/else.jpg", dates: { "2025-12-27": { R2: true, R4: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Emma", group: "CGM48", generation: "2", image: "/images/emma.jpg", dates: { "2025-12-27": { R1: true, R3: true, SP: true }, "2025-12-28": { R1: true, R3: true } } },
  { name: "Ginna", group: "CGM48", generation: "2", image: "/images/ginna.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Hongyok", group: "CGM48", generation: "4", image: "/images/hongyok.jpg", dates: { "2025-12-27": { R5: true }, "2025-12-28": { R5: true, SP: true } } },
  { name: "Kwan", group: "CGM48", generation: "3", image: "/images/kwan.jpg", dates: { "2025-12-27": { R3: true, R5: true }, "2025-12-28": { R3: true, R5: true, SP: true } } },
  { name: "Lingling", group: "CGM48", generation: "3", image: "/images/lingling.jpg", dates: { "2025-12-27": { R3: true, R5: true, SP: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Nisha", group: "CGM48", generation: "4", image: "/images/nisha.jpg", dates: { "2025-12-27": { R1: true, R3: true }, "2025-12-28": { R3: true, R5: true, SP: true } } },
  { name: "Prae", group: "CGM48", generation: "3", image: "/images/prae.jpg", dates: { "2025-12-27": { R2: true, R4: true, SP: true }, "2025-12-28": { R1: true, R3: true } } },
  { name: "Praifa", group: "CGM48", generation: "4", image: "/images/praifa.jpg", dates: { "2025-12-27": { R1: true }, "2025-12-28": { R1: true, SP: true } } },
  { name: "Runma", group: "CGM48", generation: "3", image: "/images/runma.jpg", dates: { "2025-12-27": { R5: true, SP: true }, "2025-12-28": { R5: true } } },
  { name: "Satangpound", group: "CGM48", generation: "4", image: "/images/satangpound.jpg", dates: { "2025-12-27": { R5: true, SP: true }, "2025-12-28": { R5: true } } },
  { name: "Shenae", group: "CGM48", generation: "4", image: "/images/shenae.jpg", dates: { "2025-12-27": { R2: true, R4: true }, "2025-12-28": { R2: true, R4: true, SP: true } } },
  { name: "Valentine", group: "CGM48", generation: "4", image: "/images/valentine.jpg", dates: { "2025-12-27": { R5: true, SP: true }, "2025-12-28": { R1: true, R5: true, SP: true } } },
];
