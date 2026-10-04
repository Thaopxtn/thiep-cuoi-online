"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
  Download,
  Calendar,
  User,
  Heart,
} from "lucide-react";
import { TemplateItem } from "@/data/templatesData";
import { validateTemplateJson, saveImportedTemplates } from "@/lib/templateStorage";

interface ImportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedTemplates: TemplateItem[]) => void;
}

export default function ImportTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [dragActive, setDragActive] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Validation states
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    isBatch?: boolean;
    templates?: TemplateItem[];
  } | null>(null);

  const [overwriteConflict, setOverwriteConflict] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setValidationResult(null);
    setFileName(null);
    setJsonText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processJsonData = (rawText: string, sourceName?: string) => {
    try {
      const parsed = JSON.parse(rawText);
      const res = validateTemplateJson(parsed);
      setValidationResult(res);
      if (sourceName) setFileName(sourceName);
    } catch (e: any) {
      setValidationResult({
        valid: false,
        error: `Lỗi cú pháp JSON: ${e?.message || "Dữ liệu không đúng định dạng JSON"}.`,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setValidationResult({
        valid: false,
        error: "Vui lòng chọn tệp tin có phần mở rộng .json",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonData(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith(".json")) {
        setValidationResult({
          valid: false,
          error: "Vui lòng chỉ thả tệp tin có định dạng .json",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processJsonData(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      processJsonData(text, "Dán từ clipboard");
    } catch {
      alert("Không thể đọc bộ nhớ tạm. Hãy dán trực tiếp bằng phím Ctrl+V vào ô bên dưới.");
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult || !validationResult.valid || !validationResult.templates) return;

    setIsProcessing(true);
    try {
      const res = saveImportedTemplates(validationResult.templates, {
        overwrite: overwriteConflict,
      });

      if (res.error) {
        alert(`Không thể nhập: ${res.error}`);
        setIsProcessing(false);
        return;
      }

      onSuccess(validationResult.templates);
      handleReset();
      onClose();
    } catch (err: any) {
      alert(`Đã xảy ra lỗi: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffbfa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-zen-primary shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                Nhập Mẫu Thiệp (Import Template)
              </h2>
              <p className="text-xs text-gray-500">
                Nhập mẫu từ tệp tin JSON cấu hình hoặc mã chia sẻ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {!validationResult && (
          <div className="flex border-b border-gray-100 px-6 pt-3 bg-white">
            <button
              onClick={() => setActiveTab("file")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "file"
                  ? "border-zen-primary text-zen-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Tải tệp tin .JSON</span>
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "text"
                  ? "border-zen-primary text-zen-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Dán mã JSON trực tiếp</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Input method */}
          {!validationResult ? (
            activeTab === "file" ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-zen-primary bg-rose-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-zen-primary bg-gray-50/50 hover:bg-rose-50/20"
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zen-primary mb-1 border border-rose-100">
                    <Upload className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">
                    Kéo và thả tệp .JSON vào đây
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Hoặc bấm để duyệt tệp tin từ máy tính của bạn (hỗ trợ tệp cấu hình thiệp đơn hoặc gói sao lưu nhiều mẫu)
                  </p>
                  <button
                    type="button"
                    className="mt-2 px-5 py-2 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Chọn tệp từ thiết bị
                  </button>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Mẹo:</strong> Tệp tin JSON xuất từ ZenLove có định dạng chuẩn, chứa đầy đủ cấu hình module, hiệu ứng và nội dung thiệp để bạn tái sử dụng tức thì.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Dán nội dung JSON vào khung dưới đây:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-xs text-zen-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Dán từ bộ nhớ tạm (Clipboard)
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='{\n  "schemaVersion": "1.0",\n  "type": "single",\n  "templates": [...]\n}'
                  className="w-full p-3.5 text-xs font-mono border border-gray-200 rounded-2xl focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary bg-stone-50"
                />
                <button
                  type="button"
                  disabled={!jsonText.trim()}
                  onClick={() => processJsonData(jsonText, "Mã JSON thủ công")}
                  className="w-full py-2.5 rounded-xl bg-zen-primary hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold shadow transition-all"
                >
                  Kiểm tra & Xem trước mẫu
                </button>
              </div>
            )
          ) : (
            /* Step 2: Validation result & preview */
            <div className="space-y-4">
              {validationResult.valid ? (
                <div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm">
                          Cấu trúc dữ liệu hợp lệ!
                        </h4>
                        <p className="text-xs text-emerald-700">
                          {fileName ? `Từ tệp: ${fileName}` : "Dữ liệu hợp lệ"} • Tìm thấy{" "}
                          <strong>{validationResult.templates?.length || 0}</strong> mẫu thiệp
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-500 hover:text-gray-800 underline"
                    >
                      Chọn tệp khác
                    </button>
                  </div>

                  {/* List of templates ready to import */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {validationResult.templates?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-zen-primary/40 transition-colors"
                      >
                        <img
                          src={item.image || "/assets/templates/t1.webp"}
                          alt={item.title}
                          className="w-16 h-20 object-cover rounded-xl border border-gray-100 shadow-2xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-zen-primary border border-rose-100">
                              {item.categoryName || item.category}
                            </span>
                            {item.tag && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm truncate mt-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate max-w-[120px]">
                                {item.defaultData?.person1}{" "}
                                {item.defaultData?.person2 ? `& ${item.defaultData?.person2}` : ""}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{item.defaultData?.date || "Chưa đặt ngày"}</span>
                            </span>
                          </div>
                          {item.modules && (
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{item.modules.length} modules được cấu hình</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overwrite option */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="overwriteConflict"
                      checked={overwriteConflict}
                      onChange={(e) => setOverwriteConflict(e.target.checked)}
                      className="rounded text-zen-primary focus:ring-zen-primary w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor="overwriteConflict"
                      className="text-xs text-gray-700 cursor-pointer select-none"
                    >
                      Ghi đè nếu mẫu đã tồn tại trùng ID trong kho (mặc định sẽ tạo bản sao ID mới)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 text-sm">
                      Dữ liệu JSON không hợp lệ!
                    </h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      {validationResult.error}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                      Thử lại với tệp khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Hủy bỏ
          </button>

          {validationResult?.valid && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 hover:shadow-zen-primary/40 transition-all duration-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing
                  ? "Đang lưu..."
                  : `Xác nhận nhập ${validationResult.templates?.length || 1} mẫu vào kho`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
