import { WhatsAppIcon } from '@/components/layout/Navbar/WhatsAppIcon';

const WHATSAPP_NUMBER = '917083883105';

export default function FloatingWhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I want to enquire about corporate gifting / bulk orders.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0e4d3a] text-white shadow-[0_10px_24px_rgba(10,59,44,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0a3b2c] md:bottom-7 md:right-7 md:h-14 md:w-14"
    >
      <span className="md:hidden">
        <WhatsAppIcon size={30} />
      </span>
      <span className="hidden md:block">
        <WhatsAppIcon size={36} />
      </span>
    </a>
  );
}
