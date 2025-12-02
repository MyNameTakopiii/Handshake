This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. ติดตั้ง Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ใน root directory และเพิ่มตัวแปรต่อไปนี้:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/handshake?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# LINE Login (OAuth)
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"

# LINE Messaging API (สำหรับส่งข้อความแจ้งเตือน)
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"

# Node Environment
NODE_ENV="development"
```

**วิธีสร้าง NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**วิธีได้ LINE Credentials:**
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider และ Channel
3. **สำหรับ LINE Login (OAuth):**
   - `LINE_CLIENT_ID` = **Channel ID** (ตัวเลข เช่น 2008608508)
   - `LINE_CLIENT_SECRET` = **Channel Secret** (ใน Basic settings > Channel secret)
4. **สำหรับ Messaging API (ส่งข้อความแจ้งเตือน):**
   - `LINE_CHANNEL_ACCESS_TOKEN` = **Channel access token (long-lived)** (ใน Messaging API > Channel access token)

**⚠️ สำคัญ:** Channel ID ≠ User ID
- Channel ID คือตัวเลข (ใช้สำหรับ `LINE_CLIENT_ID`)
- Your user ID เริ่มต้นด้วย U (ไม่ใช่ Client ID)

### 3. Setup Database

```bash
# Generate Drizzle migrations
bun run db:generate

# Push schema to database (for development)
bun run db:push

# Or run migrations (for production)
bun run db:migrate
```

### 4. รัน Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. ทดสอบระบบแจ้งเตือน LINE

#### 🧪 วิธีทดสอบ:

1. **Login ด้วย LINE** ในแอปพลิเคชัน
2. **เพิ่มเพื่อน LINE Bot** ของคุณ (scan QR Code จาก Messaging API settings)
3. **เลือกรายการ Handshake** ที่ต้องการ
4. **กดปุ่ม "ดูรายละเอียด"** เพื่อเปิด Summary Modal
5. **กดปุ่ม "🔔 ทดสอบแจ้งเตือน"** 
6. **ตรวจสอบ LINE** ของคุณ จะได้รับข้อความทดสอบ

#### 📊 สถาปัตยกรรมระบบแจ้งเตือน:

```
Cron Service → Your API → LINE Messaging API → User's LINE
(ทุกนาที)       (เช็คเวลา)   (ส่งข้อความ)        (ได้รับ)
```

**LINE Messaging API** = คนส่งข้อความ 📬
**Cron Job** = นาฬิกาปลุก ⏰ (ต้องตั้งค่าเพิ่ม)

#### ⚙️ ตั้งค่า Cron Job สำหรับ Production:

เพื่อให้ระบบแจ้งเตือนอัตโนมัติเมื่อใกล้ถึงเวลา:

**วิธีที่ 1: Vercel Cron (แนะนำ)**
- ดู `vercel.json` ในโปรเจกต์
- Deploy บน Vercel จะตั้งค่าให้อัตโนมัติ

**วิธีที่ 2: External Cron Service**
- ใช้ [cron-job.org](https://cron-job.org) (ฟรี)
- ตั้งค่าให้เรียก `/api/cron/notify` ทุกนาที
- ดูรายละเอียดใน `/admin/cron-setup` (ใน app เมื่อ login แล้ว)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
