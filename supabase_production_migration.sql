-- ==============================================================================
-- ZENLOVE WEDDING - PRODUCTION DATABASE SECURITY & ISOLATION MIGRATION
-- An toàn: Có thể chạy nhiều lần không làm hỏng dữ liệu (Idempotent)
-- ==============================================================================

-- 1. BỔ SUNG CỘT USER_ID VÀO BẢNG CARDS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.cards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tạo index tăng tốc truy vấn theo user_id
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);

-- Đồng bộ dữ liệu cũ nếu userId đã lưu trong metadata groom
UPDATE public.cards
SET user_id = CAST((groom->>'userId') AS UUID)
WHERE groom->>'userId' IS NOT NULL 
  AND user_id IS NULL
  AND groom->>'userId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. THIẾT LẬP ROW LEVEL SECURITY (RLS) CHO BẢNG CARDS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ mở toang
DROP POLICY IF EXISTS "Public Read Cards" ON public.cards;
DROP POLICY IF EXISTS "Public Read Published Cards" ON public.cards;
DROP POLICY IF EXISTS "Auth Insert Cards" ON public.cards;
DROP POLICY IF EXISTS "Auth Update Cards" ON public.cards;
DROP POLICY IF EXISTS "Auth Delete Cards" ON public.cards;

-- Policy 1: Khách chỉ đọc thiệp ĐÃ XUẤT BẢN; Chủ sở hữu đọc được cả bản nháp (Draft) của mình
CREATE POLICY "Public Read Published Cards" 
ON public.cards FOR SELECT 
USING (
    status = 'published' 
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Policy 2: Chỉ người dùng đã đăng nhập mới được tạo thiệp gắn với user_id của họ
CREATE POLICY "Auth Insert Cards" 
ON public.cards FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (auth.uid() = user_id OR user_id IS NULL)
);

-- Policy 3: Chỉ chủ sở hữu mới được cập nhật thiệp
CREATE POLICY "Auth Update Cards" 
ON public.cards FOR UPDATE 
USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- Policy 4: Chỉ chủ sở hữu mới được xóa thiệp
CREATE POLICY "Auth Delete Cards" 
ON public.cards FOR DELETE 
USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- 3. THIẾT LẬP ROW LEVEL SECURITY CHO BẢNG RSVPS (BẢO VỆ THÔNG TIN KHÁCH MỜI)
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Public Insert Rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Owner Read Rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Owner Delete Rsvps" ON public.rsvps;

-- Khách gửi RSVP vào thiệp đã xuất bản
CREATE POLICY "Public Insert Rsvps" 
ON public.rsvps FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = rsvps."cardId" AND cards.status = 'published'
    )
);

-- CHỈ CHỦ THIỆP mới có quyền đọc toàn bộ danh sách RSVP (kèm SĐT và lời nhắn)
CREATE POLICY "Owner Read Rsvps" 
ON public.rsvps FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = rsvps."cardId" AND cards.user_id = auth.uid()
    )
);

-- Chủ thiệp có quyền xóa phản hồi
CREATE POLICY "Owner Delete Rsvps" 
ON public.rsvps FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = rsvps."cardId" AND cards.user_id = auth.uid()
    )
);

-- 4. THIẾT LẬP ROW LEVEL SECURITY CHO BẢNG WISHES (SỔ LƯU BÚT)
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Wishes" ON public.wishes;
DROP POLICY IF EXISTS "Public Insert Wishes" ON public.wishes;
DROP POLICY IF EXISTS "Owner Delete Wishes" ON public.wishes;

-- Mọi người đều có thể đọc lời chúc của thiệp đã xuất bản
CREATE POLICY "Public Read Wishes" 
ON public.wishes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = wishes."cardId" AND cards.status = 'published'
    )
);

-- Khách gửi lời chúc vào thiệp đã xuất bản
CREATE POLICY "Public Insert Wishes" 
ON public.wishes FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = wishes."cardId" AND cards.status = 'published'
    )
);

-- Chủ thiệp có quyền xóa lời chúc không phù hợp
CREATE POLICY "Owner Delete Wishes" 
ON public.wishes FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.cards 
        WHERE cards.id = wishes."cardId" AND cards.user_id = auth.uid()
    )
);

-- Tải lại Schema Cache của PostgREST
NOTIFY pgrst, 'reload schema';
