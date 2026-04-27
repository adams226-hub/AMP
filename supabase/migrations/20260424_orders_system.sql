-- ============================================================
-- MIGRATION : Système de Commandes et Facturation
-- African Mining Partenair SARL
-- 2026-04-24
-- ============================================================

-- ── Commandes clients ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT,                         -- ex: CMD-20260424-8291
  company_name     TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  address          TEXT,
  city             TEXT,
  nif              TEXT,
  rccm             TEXT,
  order_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date    DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','ready','delivered','cancelled','invoiced')),
  delivery_address TEXT,
  vehicle_plate    TEXT,
  driver_name      TEXT,
  notes            TEXT,
  total_amount     NUMERIC(14,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lignes de commande ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dimension        TEXT NOT NULL,
  quantity_ordered NUMERIC(12,2) NOT NULL CHECK (quantity_ordered > 0),
  unit_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Factures ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id       UUID UNIQUE REFERENCES public.orders(id),
  issue_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','sent','paid','cancelled')),
  total_ht       NUMERIC(14,2) DEFAULT 0,
  tva_rate       NUMERIC(5,2) DEFAULT 18,
  tva_amount     NUMERIC(14,2) DEFAULT 0,
  total_ttc      NUMERIC(14,2) DEFAULT 0,
  payment_terms  TEXT DEFAULT 'Paiement à 30 jours',
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id    ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON public.invoices(status);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices    ENABLE ROW LEVEL SECURITY;

-- Formulaire public : INSERT uniquement (clients sans compte)
CREATE POLICY "public_insert_orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_insert_order_items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Utilisateurs authentifiés : accès complet
CREATE POLICY "auth_all_orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
