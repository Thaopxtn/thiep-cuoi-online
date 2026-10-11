import { redirect } from "next/navigation";

/**
 * Trình tạo thiệp dạng form cũ đã được nâng cấp lên Studio kéo thả Craft.js tại /design-template/[id]
 * Chuyển hướng người dùng sang Kho giao diện /templates
 */
export default function TemplateBuilderPage() {
  redirect("/templates");
}
