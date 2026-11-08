type QrFrameDecoder = (source: CanvasImageSource, width: number, height: number) => string | null;

/** Decode locally; no camera frame or uploaded image leaves the browser. */
export async function createQrFrameDecoder(maxDimension = 960): Promise<QrFrameDecoder> {
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Trình duyệt không hỗ trợ đọc ảnh QR. Hãy dán liên kết mời bên dưới.");

  return (source, width, height) => {
    if (width <= 0 || height <= 0) return null;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data || null;
  };
}

export async function decodeQrImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Hãy chọn một tệp ảnh có mã QR.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ảnh vượt quá 10 MB. Hãy chọn ảnh QR nhỏ hơn.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Không thể đọc ảnh này. Hãy chọn ảnh PNG, JPG hoặc WebP khác."));
      element.src = objectUrl;
    });
    if (image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("Kích thước ảnh quá lớn. Hãy cắt vùng mã QR rồi chọn lại.");
    }
    const decode = await createQrFrameDecoder(1600);
    const value = decode(image, image.naturalWidth, image.naturalHeight);
    if (!value) throw new Error("Không tìm thấy mã QR trong ảnh. Hãy chọn ảnh rõ nét hoặc dán liên kết mời.");
    return value;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
