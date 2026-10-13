/**
 * ZenLove Wedding - Animation Effects Catalog
 * Hệ thống hiệu ứng xuất hiện (Entrance) và biến mất (Exit) đa dạng phong cách cho thiệp cưới
 */

export type AnimationMode = "entrance" | "exit";
export type AnimationGroup = "entrance" | "exit" | "continuous";

export type AnimationCategory =
  | "all"
  | "minimal"
  | "romantic"
  | "zoom"
  | "dynamic"
  | "luxury3d"
  | "cinematic";

export interface AnimationItem {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  category: "minimal" | "romantic" | "zoom" | "dynamic" | "luxury3d" | "cinematic";
  desc: string;
  tag?: string;
}

export const ANIMATION_CATEGORIES: { id: AnimationCategory; label: string; icon: string }[] = [
  { id: "all", label: "Tất cả", icon: "✨" },
  { id: "minimal", label: "Tối giản", icon: "🍃" },
  { id: "romantic", label: "Lãng mạn", icon: "🕊️" },
  { id: "zoom", label: "Phóng thu", icon: "🔍" },
  { id: "dynamic", label: "Năng động", icon: "🤾" },
  { id: "luxury3d", label: "3D Thiệp", icon: "🃏" },
  { id: "cinematic", label: "Kịch tính", icon: "🌫️" },
];

/**
 * Danh sách các hiệu ứng Xuất hiện (Entrance Effects)
 */
export const ENTRANCE_EFFECTS: AnimationItem[] = [
  // --- Tối giản & Mượt mà ---
  {
    id: "none",
    name: "Không hiệu ứng",
    nameEn: "None",
    icon: "🚫",
    category: "minimal",
    desc: "Hiển thị tĩnh ban đầu",
  },
  {
    id: "fadeIn",
    name: "Mờ dần vào",
    nameEn: "Fade In",
    icon: "🌸",
    category: "minimal",
    desc: "Hiện rõ dần từ trong suốt",
  },
  {
    id: "fadeInUp",
    name: "Bay từ dưới lên",
    nameEn: "Fade In Up",
    icon: "⬆️",
    category: "minimal",
    desc: "Lướt từ dưới lên êm ái",
    tag: "Phổ biến",
  },
  {
    id: "fadeInDown",
    name: "Lướt từ trên xuống",
    nameEn: "Fade In Down",
    icon: "⬇️",
    category: "minimal",
    desc: "Rơi nhẹ nhàng từ phía trên",
  },
  {
    id: "fadeInLeft",
    name: "Trượt từ trái sang",
    nameEn: "Fade In Left",
    icon: "➡️",
    category: "minimal",
    desc: "Lướt vào từ mép trái màn hình",
  },
  {
    id: "fadeInRight",
    name: "Trượt từ phải sang",
    nameEn: "Fade In Right",
    icon: "⬅️",
    category: "minimal",
    desc: "Lướt vào từ mép phải màn hình",
  },

  // --- Lãng mạn & Bay bổng ---
  {
    id: "floatIn",
    name: "Bay lơ lửng vào",
    nameEn: "Float In",
    icon: "🕊️",
    category: "romantic",
    desc: "Chao lượn mềm mại như cánh bồ câu",
    tag: "Hot",
  },
  {
    id: "petalDrop",
    name: "Cánh hoa rơi",
    nameEn: "Petal Drop",
    icon: "🍃",
    category: "romantic",
    desc: "Lắc rắc rơi như cánh hoa anh đào",
    tag: "Lãng mạn",
  },
  {
    id: "swirlIn",
    name: "Xoay lướt mềm",
    nameEn: "Swirl In",
    icon: "💫",
    category: "romantic",
    desc: "Xoay tròn uyển chuyển vào khung",
  },
  {
    id: "heartPop",
    name: "Nở rộ trái tim",
    nameEn: "Heart Bloom",
    icon: "💖",
    category: "romantic",
    desc: "Phập phồng nở rộ đong đầy yêu thương",
  },
  {
    id: "shimmerIn",
    name: "Tỏa sáng hoàng kim",
    nameEn: "Shimmer Glow",
    icon: "✨",
    category: "romantic",
    desc: "Phát quang ánh vàng rực rỡ sang trọng",
    tag: "Sang trọng",
  },

  // --- Phóng thu & Đàn hồi ---
  {
    id: "zoomIn",
    name: "Phóng to dần",
    nameEn: "Zoom In",
    icon: "🔍",
    category: "zoom",
    desc: "Mở rộng từ tâm ra màn hình",
  },
  {
    id: "zoomInUp",
    name: "Phóng vút từ dưới",
    nameEn: "Zoom In Up",
    icon: "🚀",
    category: "zoom",
    desc: "Vút bay phóng to ấn tượng",
  },
  {
    id: "zoomInDown",
    name: "Phóng nhẹ từ trên",
    nameEn: "Zoom In Down",
    icon: "🪂",
    category: "zoom",
    desc: "Mở rộng từ trên cao xuống",
  },
  {
    id: "elasticIn",
    name: "Đàn hồi lò xo",
    nameEn: "Elastic Pop",
    icon: "🪀",
    category: "zoom",
    desc: "Co giãn đàn hồi cực bắt mắt",
    tag: "Độc đáo",
  },

  // --- Năng động & Vui tươi ---
  {
    id: "bounceIn",
    name: "Nảy bật vui nhộn",
    nameEn: "Bounce In",
    icon: "🤾",
    category: "dynamic",
    desc: "Nhún nhảy tưng bừng tràn đầy sức sống",
  },
  {
    id: "bounceInUp",
    name: "Bật nảy từ đáy",
    nameEn: "Bounce In Up",
    icon: "🎈",
    category: "dynamic",
    desc: "Bật tưng từ đáy lên vị trí chuẩn",
  },
  {
    id: "wobbleIn",
    name: "Rung lắc chào sân",
    nameEn: "Wobble In",
    icon: "🎪",
    category: "dynamic",
    desc: "Lắc lư vui tươi gây sự chú ý",
  },

  // --- 3D & Sang trọng ---
  {
    id: "flipInX",
    name: "Lật thẻ 3D ngang",
    nameEn: "Flip In Horizontal",
    icon: "🃏",
    category: "luxury3d",
    desc: "Lật úp mở thẻ bài 3D đẳng cấp",
    tag: "VIP",
  },
  {
    id: "flipInY",
    name: "Lật thẻ 3D dọc",
    nameEn: "Flip In Vertical",
    icon: "🪟",
    category: "luxury3d",
    desc: "Mở như cánh cửa sổ hoàng gia",
  },
  {
    id: "doorOpen",
    name: "Mở cánh thiệp 3D",
    nameEn: "Fold Open 3D",
    icon: "💌",
    category: "luxury3d",
    desc: "Mở nắp thiệp cưới trang trọng",
    tag: "Thiệp cưới",
  },
  {
    id: "rotate3dIn",
    name: "Góc nghiêng 3D",
    nameEn: "3D Perspective",
    icon: "💎",
    category: "luxury3d",
    desc: "Xoay từ không gian 3 chiều vào",
  },

  // --- Kịch tính & Nghệ thuật ---
  {
    id: "blurReveal",
    name: "Sương mờ tan hiện",
    nameEn: "Blur Reveal",
    icon: "🌫️",
    category: "cinematic",
    desc: "Hết lớp sương mờ tỏ rõ hình ảnh",
    tag: "Nghệ thuật",
  },
  {
    id: "curtainUnveil",
    name: "Trượt rèm lễ đường",
    nameEn: "Curtain Unveil",
    icon: "🎭",
    category: "cinematic",
    desc: "Kéo rèm mở ra khoảnh khắc đẹp",
  },
  {
    id: "flashIn",
    name: "Chớp sáng máy ảnh",
    nameEn: "Camera Flash",
    icon: "⚡",
    category: "cinematic",
    desc: "Ánh chớp lưu giữ khoảnh khắc thiêng liêng",
  },
];

/**
 * Danh sách các hiệu ứng Biến mất (Exit Effects)
 */
export const EXIT_EFFECTS: AnimationItem[] = [
  {
    id: "none",
    name: "Không biến mất",
    nameEn: "None",
    icon: "🚫",
    category: "minimal",
    desc: "Giữ nguyên trạng thái hiển thị",
  },
  {
    id: "fadeOut",
    name: "Mờ dần tan biến",
    nameEn: "Fade Out",
    icon: "🌫️",
    category: "minimal",
    desc: "Mờ dần và biến mất êm dịu",
  },
  {
    id: "fadeOutUp",
    name: "Bay lên biến mất",
    nameEn: "Fade Out Up",
    icon: "⬆️",
    category: "minimal",
    desc: "Bay nhẹ lên trên rồi tan biến",
  },
  {
    id: "fadeOutDown",
    name: "Rơi xuống biến mất",
    nameEn: "Fade Out Down",
    icon: "⬇️",
    category: "minimal",
    desc: "Rơi nhẹ xuống dưới rồi biến mất",
  },
  {
    id: "fadeOutLeft",
    name: "Trượt sang trái tan biến",
    nameEn: "Fade Out Left",
    icon: "⬅️",
    category: "minimal",
    desc: "Lướt sang mép trái màn hình",
  },
  {
    id: "fadeOutRight",
    name: "Trượt sang phải tan biến",
    nameEn: "Fade Out Right",
    icon: "➡️",
    category: "minimal",
    desc: "Lướt sang mép phải màn hình",
  },
  {
    id: "zoomOut",
    name: "Thu nhỏ tan biến",
    nameEn: "Zoom Out",
    icon: "🫧",
    category: "zoom",
    desc: "Thu nhỏ dần về tâm rồi biến mất",
  },
  {
    id: "bounceOut",
    name: "Bật lùi biến mất",
    nameEn: "Bounce Out",
    icon: "🪂",
    category: "dynamic",
    desc: "Nảy lùi lại rồi rút lui",
  },
  {
    id: "flipOutX",
    name: "Lật úp 3D biến mất",
    nameEn: "Flip Out 3D",
    icon: "🃏",
    category: "luxury3d",
    desc: "Lật úp thẻ bài 3D thu lại",
  },
  {
    id: "flipOutY",
    name: "Khép cánh 3D",
    nameEn: "Fold Close 3D",
    icon: "🪟",
    category: "luxury3d",
    desc: "Khép cánh cửa dọc biến mất",
  },
  {
    id: "rotateOut",
    name: "Xoay tròn rút lui",
    nameEn: "Spin Out",
    icon: "🌀",
    category: "dynamic",
    desc: "Xoay tròn thu nhỏ rồi biến mất",
  },
  {
    id: "blurOut",
    name: "Mờ sương tan biến",
    nameEn: "Blur Dissolve",
    icon: "💨",
    category: "cinematic",
    desc: "Hóa thành làn mây khói ảo ảnh",
  },
  {
    id: "shrinkSink",
    name: "Lún sâu tan biến",
    nameEn: "Sink & Shrink",
    icon: "🕳️",
    category: "cinematic",
    desc: "Chìm xuống nền và mờ dần",
  },
];
 
/**
 * Danh sách các hiệu ứng Chuyển động Liên tục (Continuous / Loop Effects)
 */
export interface ContinuousEffectItem {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  desc: string;
  tag?: string;
  defaultDuration?: number;
}

export const CONTINUOUS_EFFECTS: ContinuousEffectItem[] = [
  {
    id: "none",
    name: "Không có",
    nameEn: "Static None",
    icon: "🚫",
    desc: "Đứng yên tĩnh lặng",
    defaultDuration: 3,
  },
  {
    id: "float",
    name: "Bay lơ lửng",
    nameEn: "Gentle Float",
    icon: "🕊️",
    desc: "Bồng bềnh lơ lửng như mây trời",
    tag: "Lãng mạn",
    defaultDuration: 3.2,
  },
  {
    id: "pulse",
    name: "Nhịp tim đập",
    nameEn: "Heartbeat Pulse",
    icon: "💓",
    desc: "Co bóp nhịp đập của tình yêu",
    tag: "Đặc biệt",
    defaultDuration: 2.0,
  },
  {
    id: "bounce",
    name: "Nhún nhảy",
    nameEn: "Playful Bounce",
    icon: "🤾",
    desc: "Nảy nhẹ nhàng tuần hoàn êm ái",
    tag: "Vui tươi",
    defaultDuration: 4.5,
  },
  {
    id: "wobble",
    name: "Rung rinh",
    nameEn: "Breeze Wobble",
    icon: "🎈",
    desc: "Đung đưa nhè nhẹ như đón gió",
    defaultDuration: 3.5,
  },
  {
    id: "wiggle",
    name: "Lắc lư điệu đà",
    nameEn: "Sweet Wiggle",
    icon: "💃",
    desc: "Lắc lư uyển chuyển duyên dáng",
    defaultDuration: 3.0,
  },
  {
    id: "shake",
    name: "Rung chuông ngân",
    nameEn: "Bell Shake",
    icon: "🔔",
    desc: "Rung nhẹ báo hiệu tin vui",
    defaultDuration: 3.0,
  },
];

export function getContinuousEffectById(id: string): ContinuousEffectItem | undefined {
  return CONTINUOUS_EFFECTS.find((item) => item.id === id);
}

/**
 * Tùy chọn thời gian chuyển động (Duration Presets)
 */
export const DURATION_PRESETS = [
  { label: "Nhanh (0.6s)", value: 0.6 },
  { label: "Chuẩn (1.2s)", value: 1.2 },
  { label: "Chậm (2.0s)", value: 2.0 },
  { label: "Thư thái (3.0s)", value: 3.0 },
];

/**
 * Tùy chọn độ trễ (Delay Presets)
 */
export const DELAY_PRESETS = [
  { label: "0s (Ngay)", value: 0 },
  { label: "0.2s", value: 0.2 },
  { label: "0.5s", value: 0.5 },
  { label: "1.0s", value: 1.0 },
];

/**
 * Tùy chọn kiểu gia tốc chuyển động (Easing Options)
 */
export const EASING_OPTIONS = [
  {
    id: "cubic-bezier(0.16, 1, 0.3, 1)",
    label: "Mượt mà (Smooth Ease)",
    desc: "Tự nhiên, thanh lịch và êm ái",
  },
  {
    id: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    label: "Đàn hồi (Bouncy Spring)",
    desc: "Bật nảy vui nhộn, tràn đầy năng lượng",
  },
  {
    id: "ease-out",
    label: "Chậm dần (Ease Out)",
    desc: "Nhanh lúc đầu, êm ái khi dừng lại",
  },
  {
    id: "linear",
    label: "Đều đặn (Linear)",
    desc: "Chuyển động tốc độ không đổi",
  },
];

/**
 * Bảng ánh xạ chuyển đổi id sang keyframe CSS tương ứng
 */
export const ANIMATION_KEYFRAME_MAP: Record<string, string> = {
  // Entrance
  "none": "none",
  "fadeIn": "fadeIn",
  "fadeInUp": "fadeInUp",
  "fadeInDown": "fadeInDown",
  "fadeInLeft": "fadeInLeft",
  "fadeInRight": "fadeInRight",
  "floatIn": "floatIn",
  "petalDrop": "petalDrop",
  "swirlIn": "swirlIn",
  "heartPop": "heartPop",
  "shimmerIn": "shimmerIn",
  "zoomIn": "zoomIn",
  "zoomInUp": "zoomInUp",
  "zoomInDown": "zoomInDown",
  "elasticIn": "elasticIn",
  "bounceIn": "bounceIn",
  "bounceInUp": "bounceInUp",
  "wobbleIn": "wobbleIn",
  "flipInX": "flipInX",
  "flipInY": "flipInY",
  "doorOpen": "doorOpen",
  "rotate3dIn": "rotate3dIn",
  "blurReveal": "blurReveal",
  "curtainUnveil": "curtainUnveil",
  "flashIn": "flashIn",
  // Kebab-case compatibility
  "fade-in": "fadeIn",
  "slide-up": "slideInUp",
  "slide-down": "slideInDown",
  "slide-left": "fadeInLeft",
  "slide-right": "fadeInRight",
  "scale-in": "zoomIn",
  "bounce-in": "bounceIn",
  "flip-in": "flipInY",
  "zoom-in": "zoomIn",
  // Exit
  "fadeOut": "fadeOut",
  "fadeOutUp": "fadeOutUp",
  "fadeOutDown": "fadeOutDown",
  "fadeOutLeft": "fadeOutLeft",
  "fadeOutRight": "fadeOutRight",
  "zoomOut": "zoomOut",
  "bounceOut": "bounceOut",
  "flipOutX": "flipOutX",
  "flipOutY": "flipOutY",
  "rotateOut": "rotateOut",
  "blurOut": "blurOut",
  "shrinkSink": "shrinkSink",
};

/**
 * Tìm kiếm thông tin hiệu ứng theo ID
 */
export function getAnimationById(id: string, mode: AnimationMode = "entrance"): AnimationItem | undefined {
  const list = mode === "entrance" ? ENTRANCE_EFFECTS : EXIT_EFFECTS;
  return list.find((item) => item.id === id);
}

/**
 * Tạo CSS Style cho phần tử dựa trên cấu hình transition
 */
export function buildTransitionStyle(transition?: {
  effectEnabled?: boolean;
  effectType?: string;
  exitEffectType?: string;
  effectDuration?: number;
  effectDelay?: number;
  effectEasing?: string;
}): React.CSSProperties {
  if (!transition || transition.effectEnabled === false) {
    return {};
  }

  const effectType = transition.effectType;
  if (!effectType || effectType === "none") {
    return {};
  }

  const animName = ANIMATION_KEYFRAME_MAP[effectType] || effectType;

  return {
    animationName: animName,
    animationDuration: `${transition.effectDuration ?? 1.2}s`,
    animationDelay: `${transition.effectDelay ?? 0}s`,
    animationTimingFunction: transition.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
    animationFillMode: "both",
  };
}


/**
 * Bộ phối Combo hiệu ứng 1-chạm (1-Click Animation Combos)
 */
export interface AnimationCombo {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  desc: string;
  badge?: string;
  entranceEffect: string;
  loopEffect: string;
  hoverEffect: string;
  duration: number;
  easing: string;
}

export const ANIMATION_COMBOS: AnimationCombo[] = [
  {
    id: "sweet-romance",
    name: "Lãng mạn Ngọt ngào",
    nameEn: "Sweet Romance",
    icon: "🕊️",
    desc: "Cánh hoa chao lượn, bay bổng êm ái",
    badge: "Hot",
    entranceEffect: "floatIn",
    loopEffect: "float",
    hoverEffect: "scale-up-gentle",
    duration: 1.4,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  {
    id: "royal-luxury",
    name: "Hoàng gia Sang trọng",
    nameEn: "Royal Luxury",
    icon: "👑",
    desc: "Lật thẻ 3D dát vàng, nhịp tim ấm áp",
    badge: "VIP",
    entranceEffect: "flipInX",
    loopEffect: "pulse",
    hoverEffect: "glow-soft",
    duration: 1.2,
    easing: "ease-out",
  },
  {
    id: "modern-minimal",
    name: "Tối giản Thanh lịch",
    nameEn: "Modern Minimal",
    icon: "🌿",
    desc: "Mờ dần tinh tế, tĩnh lặng nhẹ nhàng",
    badge: "Tinh tế",
    entranceEffect: "fadeIn",
    loopEffect: "none",
    hoverEffect: "scale-up-gentle",
    duration: 0.8,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  {
    id: "joyful-party",
    name: "Trẻ trung Tươi vui",
    nameEn: "Joyful Party",
    icon: "🎉",
    desc: "Bật nảy đàn hồi, nhún nhảy tưng bừng",
    badge: "Vui tươi",
    entranceEffect: "bounceIn",
    loopEffect: "bounce",
    hoverEffect: "bounce-tap",
    duration: 1.0,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  {
    id: "vintage-card",
    name: "Thiệp cưới Cổ điển",
    nameEn: "Vintage Card",
    icon: "💌",
    desc: "Mở cánh thiệp trang trọng, nghiêng góc 3D",
    badge: "Cổ điển",
    entranceEffect: "doorOpen",
    loopEffect: "wiggle",
    hoverEffect: "tilt-3d",
    duration: 1.6,
    easing: "ease-out",
  },
  {
    id: "cinematic-reveal",
    name: "Điện ảnh Nghệ thuật",
    nameEn: "Cinematic Reveal",
    icon: "🌫️",
    desc: "Sương mờ tan hiện, phát quang ánh vàng",
    badge: "Pro",
    entranceEffect: "blurReveal",
    loopEffect: "float",
    hoverEffect: "glow-soft",
    duration: 1.6,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
];

/**
 * Hiệu ứng tương tác khi chạm / rê chuột (Hover & Tap Micro-interactions)
 */
export interface HoverEffectItem {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  desc: string;
  className: string;
}

export const HOVER_EFFECTS: HoverEffectItem[] = [
  {
    id: "none",
    name: "Không có",
    nameEn: "None",
    icon: "🚫",
    desc: "Không phản ứng khi chạm",
    className: "",
  },
  {
    id: "scale-up-gentle",
    name: "Phóng to êm ái",
    nameEn: "Gentle Scale",
    icon: "🔍",
    desc: "Phóng to nhẹ nhàng 104%",
    className: "hover-effect-scale-up-gentle",
  },
  {
    id: "glow-soft",
    name: "Tỏa sáng ấm áp",
    nameEn: "Rose Glow",
    icon: "✨",
    desc: "Tỏa ánh hào quang hồng",
    className: "hover-effect-glow-soft",
  },
  {
    id: "bounce-tap",
    name: "Nhún nảy đàn hồi",
    nameEn: "Bounce Tap",
    icon: "🎈",
    desc: "Nhún nảy lướt nhẹ lên",
    className: "hover-effect-bounce-tap",
  },
  {
    id: "tilt-3d",
    name: "Nghiêng góc 3D",
    nameEn: "3D Tilt",
    icon: "💎",
    desc: "Xoay nghiêng theo không gian",
    className: "hover-effect-tilt-3d",
  },
];

/**
 * Tự động tính toán độ trễ so le (Stagger Cascade) cho các node theo vị trí Y
 */
export function applyStaggerToNodes(
  nodes: Record<string, any>,
  stepDelay: number = 0.15,
  defaultEntrance: string = "fadeInUp"
): Record<string, any> {
  const nodeEntries = Object.entries(nodes).filter(([id]) => id !== "ROOT");
  nodeEntries.sort((a, b) => (Number(a[1].props?.top) || 0) - (Number(b[1].props?.top) || 0));

  const updatedNodes = { ...nodes };
  nodeEntries.forEach(([id, node], index) => {
    const curTransition = node.props?.transition || {};
    const effectType =
      curTransition.effectType && curTransition.effectType !== "none"
        ? curTransition.effectType
        : defaultEntrance;

    updatedNodes[id] = {
      ...node,
      props: {
        ...node.props,
        transition: {
          ...curTransition,
          effectEnabled: true,
          effectType,
          effectDelay: Number((index * stepDelay).toFixed(2)),
          effectDuration: curTransition.effectDuration ?? 1.2,
          effectEasing: curTransition.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
        },
        _previewKey: Date.now() + index,
      },
    };
  });

  return updatedNodes;
}

/**
 * Áp dụng trọn bộ Combo hiệu ứng chuyển động cho toàn bộ thiệp
 */
export function applyComboToNodes(
  nodes: Record<string, any>,
  combo: AnimationCombo,
  applyStagger: boolean = true,
  stepDelay: number = 0.12
): Record<string, any> {
  const nodeEntries = Object.entries(nodes).filter(([id]) => id !== "ROOT");
  if (applyStagger) {
    nodeEntries.sort((a, b) => (Number(a[1].props?.top) || 0) - (Number(b[1].props?.top) || 0));
  }

  const updatedNodes = { ...nodes };
  nodeEntries.forEach(([id, node], index) => {
    const delay = applyStagger ? Number((index * stepDelay).toFixed(2)) : 0;
    updatedNodes[id] = {
      ...node,
      props: {
        ...node.props,
        transition: {
          effectEnabled: true,
          effectType: combo.entranceEffect,
          effectDuration: combo.duration,
          effectDelay: delay,
          effectEasing: combo.easing,
          hoverEffect: combo.hoverEffect,
        },
        continuousAnimation: {
          type: combo.loopEffect,
          duration: combo.loopEffect === "pulse" ? 2 : combo.loopEffect === "bounce" ? 4.7 : 3.1,
          delay: 0,
        },
        _previewKey: Date.now() + index,
      },
    };
  });

  return updatedNodes;
}
