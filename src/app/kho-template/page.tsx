import { redirect } from "next/navigation";

/**
 * Trang Kho Template cũ đã chuyển hướng vĩnh viễn sang /templates
 */
export default function KhoTemplatePage() {
  redirect("/templates");
}
