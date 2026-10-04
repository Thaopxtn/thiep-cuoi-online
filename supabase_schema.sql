-- ==============================================================================
-- SUPABASE DATABASE SCHEMA CHO NỀN TẢNG THIỆP CƯỚI (100% MIỄN PHÍ)
-- Cách dùng: Copy toàn bộ nội dung dán vào mục SQL Editor trên trang Supabase và nhấn "Run"
-- ==============================================================================

-- 1. BẢNG THIỆP CƯỚI (CARDS)
CREATE TABLE IF NOT EXISTS public.cards (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    "templateId" TEXT,
    "templateName" TEXT,
    status TEXT DEFAULT 'draft',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views INTEGER DEFAULT 0,
    "coverImage" TEXT,
    story TEXT,
    "weddingDate" DATE,
    "weddingTime" TIME,
    "lunarDate" TEXT,
    groom JSONB DEFAULT '{}'::jsonb,
    bride JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    "albumImages" JSONB DEFAULT '[]'::jsonb,
    "pageData" TEXT, -- Chuỗi LZUTF8 nén toàn bộ cây nodes thiết kế
    "musicUrl" TEXT,
    "musicTitle" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tăng tốc tìm kiếm thiệp theo slug khi khách xem thiệp
CREATE INDEX IF NOT EXISTS idx_cards_slug ON public.cards(slug);

-- 2. BẢNG XÁC NHẬN THAM DỰ (RSVP)
CREATE TABLE IF NOT EXISTS public.rsvps (
    id TEXT PRIMARY KEY,
    "cardId" TEXT REFERENCES public.cards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    attending BOOLEAN DEFAULT TRUE,
    guests INTEGER DEFAULT 1,
    note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsvps_card_id ON public.rsvps("cardId");

-- 3. BẢNG SỔ LƯU BÚT & LỜI CHÚC (WISHES)
CREATE TABLE IF NOT EXISTS public.wishes (
    id TEXT PRIMARY KEY,
    "cardId" TEXT REFERENCES public.cards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishes_card_id ON public.wishes("cardId");

-- 4. BẬT ROW LEVEL SECURITY (RLS) & PHÂN QUYỀN TRUY CẬP CÔNG KHAI
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- Cho phép khách công khai xem và lưu thiệp / gửi RSVP / gửi lời chúc
CREATE POLICY "Public Read Cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Public Insert Cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Cards" ON public.cards FOR UPDATE USING (true);

CREATE POLICY "Public Read RSVPs" ON public.rsvps FOR SELECT USING (true);
CREATE POLICY "Public Insert RSVPs" ON public.rsvps FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Wishes" ON public.wishes FOR SELECT USING (true);
CREATE POLICY "Public Insert Wishes" ON public.wishes FOR INSERT WITH CHECK (true);
