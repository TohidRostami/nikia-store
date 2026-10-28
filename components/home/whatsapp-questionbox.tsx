"use client";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "989128838364";
const DEFAULT_MESSAGE = "سلام، سوالی درباره‌ی محصولات هاشور دارم.";

const GLASS =
  "border border-white/35 bg-white/20 shadow-lg shadow-black/10 backdrop-blur-md";

export function WhatsAppButton() {
  if (!WHATSAPP_NUMBER) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-1 transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <span
        className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold text-[#1e1a17] ${GLASS}`}
      >
        ارتباط با پشتیبانی
      </span>
      <div
        rel="noopener noreferrer"
        aria-label="تماس با ما در واتساپ"
        title="سوالی دارید؟ در واتساپ بپرسید"
        className={`flex size-10 items-center justify-center rounded-full text-[#25D366] ${GLASS}`}
      >
        <FaWhatsapp size={30} />
      </div>
    </a>
  );
}
