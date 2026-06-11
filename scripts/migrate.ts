import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Creating vaxtrace schema...");

  await sql`CREATE SCHEMA IF NOT EXISTS vaxtrace`;
  await sql`SET search_path TO vaxtrace`;

  // Enums
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vaxtrace')) THEN
      CREATE TYPE vaxtrace."Role" AS ENUM ('ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT');
    END IF;
  END $$`;

  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SaleStatus' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vaxtrace')) THEN
      CREATE TYPE vaxtrace."SaleStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'DISPATCHED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
    END IF;
  END $$`;

  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vaxtrace')) THEN
      CREATE TYPE vaxtrace."DocumentType" AS ENUM ('INVOICE', 'DELIVERY_NOTE', 'WAYBILL', 'GRN', 'LPO_ACKNOWLEDGEMENT', 'STORE_VOUCHER');
    END IF;
  END $$`;

  // Tables
  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Outlet" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."User" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role vaxtrace."Role" NOT NULL DEFAULT 'SALES',
      "outletId" TEXT REFERENCES vaxtrace."Outlet"(id),
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Account" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES vaxtrace."User"(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, "providerAccountId")
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Session" (
      id TEXT PRIMARY KEY,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL REFERENCES vaxtrace."User"(id) ON DELETE CASCADE,
      expires TIMESTAMP(3) NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."VerificationToken" (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP(3) NOT NULL,
      UNIQUE(identifier, token)
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Category" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Product" (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      "categoryId" TEXT NOT NULL REFERENCES vaxtrace."Category"(id),
      unit TEXT NOT NULL,
      "costPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
      "sellPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
      "reorderLevel" INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."StockItem" (
      id TEXT PRIMARY KEY,
      "productId" TEXT NOT NULL REFERENCES vaxtrace."Product"(id),
      "outletId" TEXT NOT NULL REFERENCES vaxtrace."Outlet"(id),
      quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("productId", "outletId")
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Customer" (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact TEXT,
      address TEXT,
      email TEXT,
      "creditLimit" DECIMAL(18,4) NOT NULL DEFAULT 0,
      "creditDays" INTEGER NOT NULL DEFAULT 30,
      balance DECIMAL(18,4) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Sale" (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      "outletId" TEXT NOT NULL REFERENCES vaxtrace."Outlet"(id),
      "customerId" TEXT NOT NULL REFERENCES vaxtrace."Customer"(id),
      "userId" TEXT NOT NULL REFERENCES vaxtrace."User"(id),
      date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dueDate" TIMESTAMP(3) NOT NULL,
      status vaxtrace."SaleStatus" NOT NULL DEFAULT 'DRAFT',
      subtotal DECIMAL(18,4) NOT NULL,
      "taxRate" DECIMAL(8,4) NOT NULL DEFAULT 0,
      "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
      total DECIMAL(18,4) NOT NULL,
      "amountPaid" DECIMAL(18,4) NOT NULL DEFAULT 0,
      notes TEXT,
      "lpoNumber" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."SaleLine" (
      id TEXT PRIMARY KEY,
      "saleId" TEXT NOT NULL REFERENCES vaxtrace."Sale"(id) ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES vaxtrace."Product"(id),
      quantity DECIMAL(18,4) NOT NULL,
      "unitPrice" DECIMAL(18,4) NOT NULL,
      total DECIMAL(18,4) NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."GoodsReceivedNote" (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      "outletId" TEXT NOT NULL REFERENCES vaxtrace."Outlet"(id),
      "userId" TEXT NOT NULL REFERENCES vaxtrace."User"(id),
      supplier TEXT NOT NULL,
      date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lpoRef" TEXT,
      notes TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."GrnLine" (
      id TEXT PRIMARY KEY,
      "grnId" TEXT NOT NULL REFERENCES vaxtrace."GoodsReceivedNote"(id) ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES vaxtrace."Product"(id),
      quantity DECIMAL(18,4) NOT NULL,
      "unitCost" DECIMAL(18,4) NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."StockDispatch" (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      "fromOutletId" TEXT NOT NULL REFERENCES vaxtrace."Outlet"(id),
      "toOutletId" TEXT,
      "userId" TEXT NOT NULL REFERENCES vaxtrace."User"(id),
      date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."DispatchLine" (
      id TEXT PRIMARY KEY,
      "dispatchId" TEXT NOT NULL REFERENCES vaxtrace."StockDispatch"(id) ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES vaxtrace."Product"(id),
      quantity DECIMAL(18,4) NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Document" (
      id TEXT PRIMARY KEY,
      "saleId" TEXT NOT NULL REFERENCES vaxtrace."Sale"(id),
      type vaxtrace."DocumentType" NOT NULL,
      url TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS vaxtrace."Settings" (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )`;

  console.log("Migration complete!");
}

migrate().catch(e => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
