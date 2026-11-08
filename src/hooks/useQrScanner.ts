"use client";

import { useEffect, useRef, useState } from "react";
import { createQrFrameDecoder } from "@/lib/qrImageDecoder";

type ScannerState = "idle" | "starting" | "scanning" | "paused" | "error";

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera chưa được cấp quyền. Bạn có thể tải ảnh QR hoặc dán liên kết mời bên dưới.";
  }
  if (name === "NotFoundError") return "Không tìm thấy camera. Hãy tải ảnh QR hoặc dán liên kết mời.";
  if (name === "NotReadableError") return "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.";
  return error instanceof Error ? error.message : "Không thể mở camera. Hãy dùng ảnh QR hoặc liên kết mời.";
}

export function useQrScanner({
  enabled,
  scope,
  onDecode,
}: {
  enabled: boolean;
  scope: string;
  onDecode: (value: string) => void | Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbackRef = useRef(onDecode);
  callbackRef.current = onDecode;
  const [status, setStatus] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    let animationFrame = 0;
    const video = videoRef.current;
    setStatus("starting");
    setError(null);

    const stop = () => {
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera không khả dụng. Hãy mở trang qua HTTPS, tải ảnh QR hoặc dán liên kết mời.");
        }
        const decode = await createQrFrameDecoder();
        if (cancelled) return;
        const grantedStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          grantedStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = grantedStream;
        if (!video) throw new Error("Không thể khởi tạo khung camera. Hãy đóng bảng quét rồi mở lại.");
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("scanning");
        let lastRead = -Infinity;

        const scan = (now: number) => {
          if (cancelled) return;
          try {
            if (now - lastRead >= 200 && video.readyState >= 2) {
              lastRead = now;
              const value = decode(video, video.videoWidth, video.videoHeight);
              if (value) {
                // Pause before invoking application code so one QR cannot start two writes.
                setStatus("paused");
                stop();
                void Promise.resolve(callbackRef.current(value)).catch((reason: unknown) => {
                  if (!cancelled) { setError(cameraErrorMessage(reason)); setStatus("error"); }
                });
                return;
              }
            }
            animationFrame = requestAnimationFrame(scan);
          } catch (reason) {
            stop();
            setError(cameraErrorMessage(reason));
            setStatus("error");
          }
        };
        animationFrame = requestAnimationFrame(scan);
      } catch (reason) {
        stop();
        if (!cancelled) { setError(cameraErrorMessage(reason)); setStatus("error"); }
      }
    }
    void start();
    return () => { cancelled = true; stop(); };
  }, [enabled, scope]);

  return { videoRef, status, error };
}
