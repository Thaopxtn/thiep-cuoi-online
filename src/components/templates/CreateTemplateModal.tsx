"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Save,
  Eye,
  Check,
  Smartphone,
  Music,
  Calendar,
  MapPin,
  Heart,
  Gift,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Download,
} from "lucide-react";
import { TemplateItem, generateDefaultModules } from "@/data/templatesData";
import { TemplateModule, ModuleType } from "@/components/modules/types";
import {
  AVAILABLE_MODULES,
  TEMPLATE_PRESETS,
  SAMPLE_PHOTOS,
  createModuleInstance,
} from "@/lib/availableModules";
import { saveCustomTemplate, slugify, exportTemplateAsJson } from "@/lib/templateStorage";
import ModuleRenderer from "../modules/ModuleRenderer";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdTemplate: TemplateItem) => void;
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTemplateModalProps) {
  const router = useRouter();

  // Wizard tab
  const [activeStep, setActiveStep] = useState<"info" | "modules" | "content" | "preview">(
    "info"
  );

  // Form State
  const [title, setTitle] = useState("Mẫu Thiệp Cưới Sang Trọng ZenLove");
  const [category, setCategory] = useState<TemplateItem["category"]>("wedding");
  const [tag, setTag] = useState<TemplateItem["tag"]>("MỚI");
  const [description, setDescription] = useState(
    "Thiết kế tinh tế kết hợp phong bì dập sáp và hiệu ứng lướt mượt mà"
  );
  const [image, setImage] = useState(
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop"
  );

  // Event Data State
  const [defaultData, setDefaultData] = useState<TemplateItem["defaultData"]>({
    eventTitle: "THIỆP MỜI CƯỚI",
    person1: "Văn Sâm",
    person2: "Mai Lan",
    date: "29.03.2026",
    time: "10:00",
    venue: "Trung Tâm Tiệc Cưới ZenLove",
    address: "123 Đường Hoa Hồng, Quận 1, TP. Hồ Chí Minh",
    mapUrl: "https://maps.google.com",
    quote: "Hạnh phúc không phải là điểm đến, mà là một hành trình cùng nhau chia sẻ mỗi ngày.",
    invitationBody: "Trân trọng kính mời quý khách đến dự lễ thành hôn của gia đình chúng tôi!",
    signature: "Văn Sâm & Mai Lan",
    mainPhoto: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
    albumPhotos: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
    ],
    musicTitle: "Beautiful In White - Shane Filan",
    musicUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
    bankInfo: {
      bankName: "Techcombank",
      accountNumber: "190345678912",
      accountHolder: "NONG VAN SAM",
    },
    initialWishes: [
      { id: "1", name: "Nguyễn Tuấn", message: "Chúc hai bạn trăm năm tình viên mãn, mãi hạnh phúc nhé!" },
      { id: "2", name: "Trần Mai", message: "Chúc mừng ngày vui đại hỷ, đầu bạc răng long!" },
    ],
  });

  // Selected Modules State
  const [modules, setModules] = useState<TemplateModule[]>(() => {
    const basePreset = TEMPLATE_PRESETS[0];
    return basePreset.moduleTypes.map((type) => createModuleInstance(type, defaultData));
  });

  // Add Module Picker modal state
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>("all");

  if (!isOpen) return null;

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    const p = TEMPLATE_PRESETS.find((x) => x.id === presetId);
    if (!p) return;

    setTitle(p.name);
    setCategory(p.category as any);
    setDescription(p.description);
    setImage(p.image);

    let updatedData = { ...defaultData };
    if (p.category === "graduation") {
      updatedData.eventTitle = "LỄ TỐT NGHIỆP";
      updatedData.person1 = "Thảo Nhi";
      updatedData.person2 = "";
      updatedData.signature = "Thảo Nhi";
      updatedData.quote = "Khép lại những năm tháng thanh xuân, mở ra tương lai rạng rỡ!";
    } else if (p.category === "birthday") {
      updatedData.eventTitle = "TIỆC SINH NHẬT";
      updatedData.person1 = "Bé Bắp";
      updatedData.person2 = "";
      updatedData.signature = "Gia đình Bé Bắp";
      updatedData.quote = "Chúc mừng bé yêu bước sang tuổi mới luôn khỏe mạnh và tươi vui!";
    }

    setDefaultData(updatedData);
    setModules(p.moduleTypes.map((type) => createModuleInstance(type, updatedData)));
  };

  // Module management
  const handleMoveModule = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;
    const copy = [...modules];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIdx, 0, item);
    setModules(copy);
  };

  const handleToggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleDeleteModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddModule = (type: ModuleType) => {
    const newMod = createModuleInstance(type, defaultData);
    setModules((prev) => [...prev, newMod]);
    setShowAddModuleModal(false);
  };

  // Build the complete template object
  const buildTemplateObject = (): TemplateItem => {
    const id = `custom-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const categoryName =
      category === "wedding"
        ? "Thiệp cưới"
        : category === "graduation"
        ? "Thiệp tốt nghiệp"
        : category === "birthday"
        ? "Thiệp sinh nhật"
        : category === "event"
        ? "Sự kiện"
        : "Kỷ niệm";

    return {
      id,
      title,
      slug: slugify(title),
      category,
      categoryName,
      image,
      scrollPercent: "75%",
      scrollDuration: "8.5s",
      tag,
      likes: 1,
      views: 1,
      description,
      type: category === "graduation" ? "graduation" : "wedding",
      modules,
      defaultData,
    };
  };

  const [formError, setFormError] = useState<string | null>(null);

  // Save template
  const handleSaveOnly = () => {
    setFormError(null);
    if (!title.trim()) {
      setFormError("Vui lòng nhập tên cho mẫu thiệp!");
      return;
    }

    const newTemplate = buildTemplateObject();
    const result = saveCustomTemplate(newTemplate);

    if (result.success) {
      if (onSuccess) onSuccess(newTemplate);
      onClose();
    } else {
      setFormError(`Lỗi khi lưu: ${result.error}`);
    }
  };

  // Save & Open Editor
  const handleSaveAndOpenEditor = () => {
    setFormError(null);
    if (!title.trim()) {
      setFormError("Vui lòng nhập tên cho mẫu thiệp!");
      return;
    }

    const newTemplate = buildTemplateObject();
    const result = saveCustomTemplate(newTemplate);

    if (result.success) {
      if (onSuccess) onSuccess(newTemplate);
      onClose();
      router.push(`/design-template/${newTemplate.id}`);
    } else {
      setFormError(`Lỗi khi lưu: ${result.error}`);
    }
  };

  // Export JSON directly
  const handleExportDirect = () => {
    const newTemplate = buildTemplateObject();
    exportTemplateAsJson(newTemplate);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] border border-gray-100"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-[#fffbfa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                Tự Tạo Template Thiệp Mới
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                Tùy biến cấu trúc Module, nội dung mẫu & phong cách thiết kế
              </p>
            </div>
          </div>

          {/* Quick preset selector */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Bắt đầu nhanh:</span>
            <select
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-zen-primary shadow-2xs"
            >
              <option value="">-- Chọn mẫu cấu hình sẵn --</option>
              {TEMPLATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-gray-100 text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
            <button
              onClick={() => setActiveStep("info")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
                activeStep === "info"
                  ? "bg-zen-primary text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>1. Thông tin chung</span>
            </button>
            <button
              onClick={() => setActiveStep("modules")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
                activeStep === "modules"
                  ? "bg-zen-primary text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Cấu trúc Modules ({modules.filter((m) => m.enabled).length})</span>
            </button>
            <button
              onClick={() => setActiveStep("content")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
                activeStep === "content"
                  ? "bg-zen-primary text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Dữ liệu sự kiện</span>
            </button>
            <button
              onClick={() => setActiveStep("preview")}
              className={`flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
                activeStep === "preview"
                  ? "bg-zen-primary text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>4. Xem trước</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{formError}</span>
            <button onClick={() => setFormError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
          </div>
        )}

        {/* Main Content Area: 2 Columns on Desktop */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Form Configuration */}
          <div
            className={`w-full lg:w-[58%] xl:w-[60%] p-5 sm:p-6 overflow-y-auto ${
              activeStep === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {/* STEP 1: Basic Info */}
            {activeStep === "info" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thông tin nhận diện mẫu thiệp
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Đặt tên, chọn danh mục và hình ảnh đại diện hiển thị trong kho
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên Template <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="VD: Thiệp Cưới Hoa Hồng Sáp Vàng"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Danh mục thiệp
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary shadow-2xs"
                      >
                        <option value="wedding">Thiệp cưới (Wedding)</option>
                        <option value="graduation">Thiệp tốt nghiệp (Graduation)</option>
                        <option value="birthday">Thiệp sinh nhật (Birthday)</option>
                        <option value="event">Sự kiện (Event)</option>
                        <option value="anniversary">Kỷ niệm (Anniversary)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Huy hiệu (Tag)
                      </label>
                      <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary shadow-2xs"
                      >
                        <option value="MỚI">MỚI (New)</option>
                        <option value="HOT">HOT (Thịnh hành)</option>
                        <option value="PREMIUM">PREMIUM (Cao cấp)</option>
                        <option value="FREE">FREE (Miễn phí)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mô tả ngắn về mẫu thiệp
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả phong cách thiệp..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary shadow-2xs"
                    />
                  </div>

                  {/* Thumbnail Image */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      URL Ảnh bìa / Thumbnail
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>

                    {/* Stock photos suggestion */}
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-gray-500 block mb-2">
                        Hoặc chọn ảnh chất lượng cao có sẵn:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {(SAMPLE_PHOTOS[category as keyof typeof SAMPLE_PHOTOS] || SAMPLE_PHOTOS.wedding).map(
                          (sample, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setImage(sample.url);
                                setDefaultData((prev) => ({ ...prev, mainPhoto: sample.url }));
                              }}
                              className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                image === sample.url
                                  ? "border-zen-primary ring-2 ring-zen-primary/20 scale-105"
                                  : "border-transparent hover:border-gray-300"
                              }`}
                            >
                              <img
                                src={sample.url}
                                alt={sample.label}
                                className="w-full h-full object-cover"
                              />
                              {image === sample.url && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zen-primary text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveStep("modules")}
                    className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 flex items-center gap-1.5 transition-all"
                  >
                    <span>Tiếp tục: Cấu trúc Modules</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Modules Structure */}
            {activeStep === "modules" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Cấu trúc Modules thiệp
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Bật/tắt, sắp xếp thứ tự và thêm các hiệu ứng, khối nội dung
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModuleModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-zen-primary text-xs font-bold border border-rose-200 shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Module</span>
                  </button>
                </div>

                {/* List of modules */}
                <div className="space-y-2.5">
                  {modules.map((mod, index) => (
                    <div
                      key={mod.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        mod.enabled
                          ? "bg-white border-gray-200 shadow-2xs hover:border-zen-primary/30"
                          : "bg-gray-50/70 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                              {mod.name}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-gray-600 font-mono">
                              {mod.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {mod.description || "Khối nội dung thiệp"}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Up button */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveModule(index, "up")}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 flex items-center justify-center transition-colors"
                          title="Di chuyển lên trên"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        {/* Down button */}
                        <button
                          type="button"
                          disabled={index === modules.length - 1}
                          onClick={() => handleMoveModule(index, "down")}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 flex items-center justify-center transition-colors"
                          title="Di chuyển xuống dưới"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {/* Toggle button */}
                        <button
                          type="button"
                          onClick={() => handleToggleModule(mod.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            mod.enabled
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {mod.enabled ? "Bật" : "Tắt"}
                        </button>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors ml-1"
                          title="Xóa module này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep("info")}
                    className="px-4 py-2 rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep("content")}
                    className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 flex items-center gap-1.5 transition-all"
                  >
                    <span>Tiếp tục: Dữ liệu sự kiện</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Content / Event Data */}
            {activeStep === "content" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Dữ liệu mẫu sự kiện mặc định
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thông tin hiển thị mẫu cho người dùng khi bắt đầu áp dụng template này
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tiêu đề sự kiện
                      </label>
                      <input
                        type="text"
                        value={defaultData.eventTitle}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, eventTitle: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Chữ ký chân trang
                      </label>
                      <input
                        type="text"
                        value={defaultData.signature || ""}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, signature: e.target.value })
                        }
                        placeholder="VD: Văn Sâm & Mai Lan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên nhân vật 1 (Chú rể / Chủ tiệc)
                      </label>
                      <input
                        type="text"
                        value={defaultData.person1}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, person1: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên nhân vật 2 (Cô dâu)
                      </label>
                      <input
                        type="text"
                        value={defaultData.person2 || ""}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, person2: e.target.value })
                        }
                        placeholder="Để trống nếu là thiệp đơn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Ngày tổ chức (DD.MM.YYYY)
                      </label>
                      <input
                        type="text"
                        value={defaultData.date}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, date: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Giờ tổ chức
                      </label>
                      <input
                        type="text"
                        value={defaultData.time}
                        onChange={(e) =>
                          setDefaultData({ ...defaultData, time: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Địa điểm & Tên sảnh tiệc
                    </label>
                    <input
                      type="text"
                      value={defaultData.venue}
                      onChange={(e) =>
                        setDefaultData({ ...defaultData, venue: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      type="text"
                      value={defaultData.address}
                      onChange={(e) =>
                        setDefaultData({ ...defaultData, address: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Lời ngỏ / Trích dẫn tình yêu
                    </label>
                    <textarea
                      rows={2}
                      value={defaultData.quote}
                      onChange={(e) =>
                        setDefaultData({ ...defaultData, quote: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Ngân hàng
                      </label>
                      <input
                        type="text"
                        value={defaultData.bankInfo.bankName}
                        onChange={(e) =>
                          setDefaultData({
                            ...defaultData,
                            bankInfo: { ...defaultData.bankInfo, bankName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Số tài khoản
                      </label>
                      <input
                        type="text"
                        value={defaultData.bankInfo.accountNumber}
                        onChange={(e) =>
                          setDefaultData({
                            ...defaultData,
                            bankInfo: { ...defaultData.bankInfo, accountNumber: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên chủ tài khoản
                      </label>
                      <input
                        type="text"
                        value={defaultData.bankInfo.accountHolder}
                        onChange={(e) =>
                          setDefaultData({
                            ...defaultData,
                            bankInfo: { ...defaultData.bankInfo, accountHolder: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep("modules")}
                    className="px-4 py-2 rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndOpenEditor}
                    className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu & Mở Trình Thiết Kế</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Mobile Preview */}
          <div
            className={`w-full lg:w-[42%] xl:w-[40%] bg-stone-100 border-l border-gray-200 flex flex-col items-center justify-center p-4 relative ${
              activeStep === "preview" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="w-full max-w-[340px] flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-zen-primary" />
                <span>Bản xem thử trực tiếp</span>
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                {modules.filter((m) => m.enabled).length} modules
              </span>
            </div>

            {/* Smartphone device frame */}
            <div className="relative w-full max-w-[340px] h-[580px] bg-black rounded-[42px] p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-[4px] border-stone-800 flex flex-col overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>

              {/* Live Render Area */}
              <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white">
                <ModuleRenderer
                  modules={modules.filter((m) => m.enabled)}
                  bankInfo={defaultData.bankInfo}
                  musicUrl={defaultData.musicUrl}
                  musicTitle={defaultData.musicTitle}
                  initialWishes={defaultData.initialWishes}
                  interactive={true}
                  showOpeningIntro={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDirect}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-zen-primary text-zen-primary text-xs font-bold transition-all shadow-2xs"
            >
              Lưu vào Kho
            </button>
            <button
              type="button"
              onClick={handleSaveAndOpenEditor}
              className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 hover:shadow-zen-primary/40 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lưu & Bắt đầu thiết kế</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: Add Module Selector */}
      {showAddModuleModal && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAddModuleModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                Thêm Module Vào Mẫu Thiệp
              </h3>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex px-6 pt-3 gap-2 border-b border-gray-100 overflow-x-auto">
              {[
                { id: "all", label: "Tất cả" },
                { id: "hero", label: "Mở đầu (Hero)" },
                { id: "info", label: "Thông tin & Lịch" },
                { id: "gallery", label: "Album ảnh" },
                { id: "interactive", label: "Tương tác & Mừng cưới" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedModuleCategory(c.id)}
                  className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    selectedModuleCategory === c.id
                      ? "border-zen-primary text-zen-primary"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Modules grid */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {AVAILABLE_MODULES.filter(
                (m) =>
                  selectedModuleCategory === "all" ||
                  m.category === selectedModuleCategory
              ).map((mod) => (
                <div
                  key={mod.type}
                  onClick={() => handleAddModule(mod.type)}
                  className="p-3.5 rounded-2xl border border-gray-200 hover:border-zen-primary/60 bg-white hover:bg-rose-50/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-zen-primary transition-colors">
                        {mod.name}
                      </h4>
                      {mod.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          {mod.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-zen-primary group-hover:text-white text-gray-600 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
