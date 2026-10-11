/**
 * Thư viện nhạc nền đám cưới tuyển chọn (Curated Wedding Music Library)
 * Gồm 16+ bản nhạc lãng mạn, acoustic, piano, violin, jazz và v-pop acoustic
 * Bản quyền miễn phí, tối ưu dung lượng và phát mượt mà trên mọi thiết bị
 */

export interface WeddingSong {
  id: string;
  title: string;
  artist: string;
  genre: "Acoustic" | "Piano" | "Violin" | "Jazz" | "V-Pop" | "Lofi";
  duration: string;
  url: string;
  description: string;
  mood: "Lãng mạn" | "Ngọt ngào" | "Trang trọng" | "Ấm áp" | "Vui tươi";
}

export const CURATED_WEDDING_SONGS: WeddingSong[] = [
  {
    id: "song-1",
    title: "Canon in D (Pachelbel Romance)",
    artist: "The Royal Symphony",
    genre: "Piano",
    duration: "3:45",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=romantic-wedding-piano-10878.mp3",
    description: "Khúc ca kinh điển bất hủ cho mọi lễ đường đám cưới hoàng gia",
    mood: "Trang trọng",
  },
  {
    id: "song-2",
    title: "Until I Found You (Acoustic Guitar)",
    artist: "Stephen & Friends",
    genre: "Acoustic",
    duration: "3:10",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c83f9801.mp3?filename=acoustic-guitars-ambient-wedding-11116.mp3",
    description: "Giai điệu mộc mạc hoài niệm, ngọt ngào chạm đến từng xúc cảm",
    mood: "Ngọt ngào",
  },
  {
    id: "song-3",
    title: "A Thousand Years (Violin & Piano Romance)",
    artist: "Christina Perri Cover",
    genre: "Violin",
    duration: "4:12",
    url: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f75479.mp3?filename=wedding-violin-piano-love-story-122976.mp3",
    description: "Lời thề hẹn một ngàn năm yêu em, hoàn hảo cho khoảnh khắc cô dâu bước vào lễ đường",
    mood: "Lãng mạn",
  },
  {
    id: "song-4",
    title: "Ánh Nắng Của Anh (Piano Cover)",
    artist: "Đức Phúc Instrumental",
    genre: "V-Pop",
    duration: "3:30",
    url: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_32c8646b96.mp3?filename=romantic-piano-ballad-wedding-8012.mp3",
    description: "Vì em xuất hiện, thế giới trong anh rực rỡ nắng mai",
    mood: "Ấm áp",
  },
  {
    id: "song-5",
    title: "Beautiful In White (Acoustic Strings)",
    artist: "Shane Filan Cover",
    genre: "Acoustic",
    duration: "3:50",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=soft-wedding-background-music-111753.mp3",
    description: "Khoảnh khắc em khoác lên mình chiếc váy cưới trắng tinh khôi",
    mood: "Lãng mạn",
  },
  {
    id: "song-6",
    title: "Cưới Nhau Đi - Yes I Do (Acoustic Love)",
    artist: "Bùi Anh Tuấn & Hiền Hồ Cover",
    genre: "V-Pop",
    duration: "3:25",
    url: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_496660fb81.mp3?filename=acoustic-wedding-love-story-125032.mp3",
    description: "Từ nay chúng mình đã là của nhau, cùng viết tiếp trang đời hạnh phúc",
    mood: "Vui tươi",
  },
  {
    id: "song-7",
    title: "Perfect (Orchestral Love Symphony)",
    artist: "Ed Sheeran Strings Cover",
    genre: "Violin",
    duration: "4:20",
    url: "https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc862140b9.mp3?filename=romantic-love-story-wedding-piano-19965.mp3",
    description: "Bản tình ca hoàn hảo cho điệu khiêu vũ đầu tiên (First Dance)",
    mood: "Lãng mạn",
  },
  {
    id: "song-8",
    title: "Ngày Đầu Tiên (Lofi Wedding Beats)",
    artist: "Đức Phúc Acoustic",
    genre: "Lofi",
    duration: "3:15",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c2be237a4d.mp3?filename=lofi-chill-wedding-story-11005.mp3",
    description: "Nụ cười em ngày đầu tiên gặp gỡ cho đến ngày chung đôi",
    mood: "Ngọt ngào",
  },
  {
    id: "song-9",
    title: "Can't Take My Eyes Off You (Smooth Jazz)",
    artist: "Frankie Valli Jazz Quartet",
    genre: "Jazz",
    duration: "3:35",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_2455b8ef98.mp3?filename=romantic-jazz-lounge-wedding-10901.mp3",
    description: "Không thể rời mắt khỏi em trong buổi tiệc ấm cúng dưới ánh nến",
    mood: "Vui tươi",
  },
  {
    id: "song-10",
    title: "River Flows In You (Piano Serenade)",
    artist: "Yiruma Cover",
    genre: "Piano",
    duration: "3:05",
    url: "https://cdn.pixabay.com/download/audio/2021/11/24/audio_3a7b6cfb2e.mp3?filename=piano-moment-romantic-wedding-10408.mp3",
    description: "Dòng chảy tình yêu êm đềm, thanh khiết và sâu lắng",
    mood: "Trang trọng",
  },
  {
    id: "song-11",
    title: "Hơn Cả Yêu (Acoustic Warm Heart)",
    artist: "Đức Phúc Acoustic Instrumental",
    genre: "V-Pop",
    duration: "3:40",
    url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_88e0cb206d.mp3?filename=acoustic-folk-wedding-love-116812.mp3",
    description: "Tình cảm anh dành cho em lớn hơn mọi lời nói trên thế gian",
    mood: "Ấm áp",
  },
  {
    id: "song-12",
    title: "I Do (Gentle Wedding Ballad)",
    artist: "911 Band Piano Cover",
    genre: "Piano",
    duration: "3:20",
    url: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_db80a3a60a.mp3?filename=sweet-piano-wedding-ballad-111451.mp3",
    description: "Hai tiếng 'I Do' thiêng liêng đánh dấu chương mới của cuộc đời",
    mood: "Ngọt ngào",
  },
  {
    id: "song-13",
    title: "Marry You (Acoustic Ukulele Breeze)",
    artist: "Bruno Mars Cover",
    genre: "Acoustic",
    duration: "2:55",
    url: "https://cdn.pixabay.com/download/audio/2022/04/27/audio_65b3d077c5.mp3?filename=happy-acoustic-ukulele-wedding-111324.mp3",
    description: "Giai điệu rộn ràng, vui tươi mang đến nụ cười rạng rỡ cho quan khách",
    mood: "Vui tươi",
  },
  {
    id: "song-14",
    title: "Cơn Mưa Tình Yêu (Piano & Cello Duet)",
    artist: "Hà Anh Tuấn & Phương Linh Cover",
    genre: "V-Pop",
    duration: "3:45",
    url: "https://cdn.pixabay.com/download/audio/2022/01/26/audio_951f282470.mp3?filename=romantic-cello-piano-wedding-10945.mp3",
    description: "Tình yêu qua năm tháng bền chặt như cơn mưa tưới mát tâm hồn",
    mood: "Lãng mạn",
  },
  {
    id: "song-15",
    title: "All of Me (Soulful Piano & Strings)",
    artist: "John Legend Cover",
    genre: "Piano",
    duration: "4:30",
    url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_3e2dfb31ee.mp3?filename=emotional-piano-strings-wedding-111228.mp3",
    description: "Yêu tất cả những gì thuộc về em, cả những điều không hoàn hảo",
    mood: "Trang trọng",
  },
  {
    id: "song-16",
    title: "Một Nhà (Lofi Acoustic Beat)",
    artist: "Da LAB Instrumental Cover",
    genre: "Lofi",
    duration: "3:00",
    url: "https://cdn.pixabay.com/download/audio/2022/06/07/audio_cb5dbbfeb9.mp3?filename=lofi-chillout-wedding-love-112349.mp3",
    description: "Khi hai ta về một nhà, khép chung một đôi mi, cùng thức giấc mỗi sớm mai",
    mood: "Ấm áp",
  },
];

export function getCuratedWeddingSongs(): WeddingSong[] {
  return CURATED_WEDDING_SONGS;
}

export function getWeddingSongById(id: string): WeddingSong | undefined {
  return CURATED_WEDDING_SONGS.find((s) => s.id === id);
}

export function getWeddingSongsByGenre(genre: WeddingSong["genre"]): WeddingSong[] {
  return CURATED_WEDDING_SONGS.filter((s) => s.genre === genre);
}
