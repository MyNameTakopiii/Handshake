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

First, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
