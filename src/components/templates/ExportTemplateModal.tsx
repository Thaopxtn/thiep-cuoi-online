"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  Sparkles,
  Archive,
  Eye,
} from "lucide-react";
import { TemplateItem } from "@/data/templates";
import {
  exportTemplateAsJson,
  exportTemplatesAsJson,
  exportAllCustomTemplates,
  copyTemplateToClipboard,
  getCustomTemplates,
} from "@/lib/templateStorage";

interface ExportTemplateModalProps {
  template?: TemplateItem | null;
  templates?: TemplateItem[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportTemplateModal({
  template,
  templates,
  isOpen,
  onClose,
}: ExportTemplateModalProps) {
  const [copied, setCopied] = useState(false);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  const customTemplates = getCustomTemplates();
  const isMultiple = Boolean(templates && templates.length > 1);
  const activeList: TemplateItem[] = templates && templates.length > 0
    ? templates
    : template
    ? [template]
    : [];

  const singleTemplate = activeList[0] || null;

  if (!isOpen || activeList.length === 0) return null;

  const handleCopyJson = async () => {
    if (singleTemplate) {
      const success = await copyTemplateToClipboard(singleTemplate);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert("Không thể sao chép vào bộ nhớ tạm");
      }
    }
  };

  const handleDownload = () => {
    if (isMultiple) {
      exportTemplatesAsJson(activeList);
    } else if (singleTemplate) {
      exportTemplateAsJson(singleTemplate);
    }
  };

  const handleDownloadAllCustom = () => {
    exportAllCustomTemplates();
  };

  const jsonSnippet = JSON.stringify(
    {
      schemaVersion: "1.1",
      source: "ZenLove Template Studio",
      exportedAt: new Date().toISOString(),
      type: isMultiple ? "collection" : "single",
      templatesCount: activeList.length,
      templates: activeList.slice(0, 3).map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        recipe: t.recipe,
        modulesCount: t.modules?.length || 0,
        author: t.meta?.author || "ZenLove",
      })),
      ...(activeList.length > 3 ? { note: `... và ${activeList.length - 3} mẫu khác` } : {}),
    },
    null,
    2
  );

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffbfa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-zen-primary shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                {isMultiple
                  ? `Xuất ${activeList.length} Mẫu Thiệp (Bộ Sưu Tập)`
                  : "Xuất Mẫu Thiệp (Export Template)"}
              </h2>
              <p className="text-xs text-gray-500">
                Lưu tệp tin JSON cấu hình hoặc sao chép để chia sẻ, sao lưu
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Card Summary */}
          {isMultiple ? (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-900">
                  Danh sách {activeList.length} mẫu đã chọn xuất:
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Gói Collection v1.1
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeList.map((tpl, i) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-gray-200/60 shadow-2xs"
                  >
                    <span className="font-semibold text-gray-800 truncate mr-2">
                      {i + 1}. {tpl.title}
                    </span>
                    <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-stone-100 shrink-0">
                      {tpl.categoryName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : singleTemplate ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <img
                src={singleTemplate.image || "/assets/templates/t1.webp"}
                alt={singleTemplate.title}
                className="w-16 h-20 object-cover rounded-xl border border-gray-200 shadow-xs flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zen-primary text-white">
                    {singleTemplate.categoryName || singleTemplate.category}
                  </span>
                  {singleTemplate.tag && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {singleTemplate.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {singleTemplate.title}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {singleTemplate.description || "Mẫu thiệp điện tử cao cấp ZenLove"}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span>
                    Ngày: <strong>{singleTemplate.defaultData?.date || "Chưa đặt"}</strong>
                  </span>
                  <span>
                    Modules: <strong>{singleTemplate.modules?.length || 7} khối</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="p-4 rounded-2xl bg-zen-primary hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-zen-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1.5 text-center"
            >
              <Download className="w-5 h-5" />
              <span>
                {isMultiple
                  ? `Tải File JSON (${activeList.length} mẫu)`
                  : "Tải Tệp JSON Về Máy"}
              </span>
              <span className="text-[10px] font-normal text-rose-100">
                Tệp .json chuẩn tương thích cao
              </span>
            </button>

            {!isMultiple && (
              <button
                type="button"
                onClick={handleCopyJson}
                className="p-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-gray-800 font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1.5 text-center border border-gray-200"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">
                      Đã Sao Chép!
                    </span>
                    <span className="text-[10px] font-normal text-emerald-600">
                      Đã lưu vào bộ nhớ tạm
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-gray-600" />
                    <span>Sao Chép JSON</span>
                    <span className="text-[10px] font-normal text-gray-500">
                      Copy cấu hình để chia sẻ nhanh
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Backup All Custom Templates Option */}
          {customTemplates.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Sao lưu toàn bộ kho mẫu của bạn ({customTemplates.length} mẫu)
                  </h4>
                  <p className="text-[11px] text-gray-600">
                    Xuất một tệp JSON tổng hợp gồm tất cả mẫu bạn đã tạo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadAllCustom}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sao lưu hết</span>
              </button>
            </div>
          )}

          {/* Raw JSON Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowJsonRaw(!showJsonRaw)}
              className="text-xs font-semibold text-gray-500 hover:text-zen-primary flex items-center gap-1.5 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showJsonRaw ? "Thu gọn xem trước JSON" : "Xem trước cấu trúc JSON"}</span>
            </button>

            {showJsonRaw && (
              <div className="mt-2.5 p-3 rounded-2xl bg-stone-900 text-stone-300 text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800 shadow-inner">
                <pre>{jsonSnippet}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-stone-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tương thích hoàn toàn với tính năng "Nhập mẫu JSON"</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-stone-200 border border-gray-200 text-gray-700 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
