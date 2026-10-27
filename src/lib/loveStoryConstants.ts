export interface LoveStoryItem {
  id?: string;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export const DEFAULT_LOVE_STORY: LoveStoryItem[] = [
  {
    id: "step1",
    date: "14 / 02 / 2021",
    title: "Lần Đầu Gặp Gỡ",
    description: "Một buổi chiều mưa bất chợt tại quán cafe nhỏ, ánh mắt chạm nhau mở ra câu chuyện của hai tâm hồn.",
    imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step2",
    date: "20 / 10 / 2022",
    title: "Lời Hẹn Ước Đầu Tiên",
    description: "Dưới ánh đèn lung linh của thành phố, chúng ta chính thức nắm tay nhau bước vào chặng đường hẹn hò ngọt ngào.",
    imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step3",
    date: "24 / 12 / 2024",
    title: "Khoảnh Khắc Cầu Hôn",
    description: "Bên bờ biển lúc hoàng hôn buông xuống, chiếc nhẫn trao tay cùng giọt nước mắt hạnh phúc: 'Em đồng ý!'.",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step4",
    date: "Chung Đôi Mãi Mãi",
    title: "Ngày Chung Đôi",
    description: "Trước sự chứng kiến của gia đình và bạn bè, chúng ta trao nhau lời thề nguyện đồng hành suốt cuộc đời.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
  },
];
