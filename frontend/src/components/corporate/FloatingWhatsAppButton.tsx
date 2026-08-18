import { WhatsAppIcon } from '@/components/layout/Navbar/WhatsAppIcon';
import { WHATSAPP_NUMBER } from '@/components/layout/Navbar/navData';
import { useWhatsAppBottomClass } from '@/store/useFloatingUi';

export default function FloatingWhatsAppButton() {
  const mobileBottom = useWhatsAppBottomClass();
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Shebliss! I have a question about a product.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0e4d3a] text-white shadow-[0_10px_24px_rgba(10,59,44,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0a3b2c] md:bottom-7 md:right-7 md:h-14 md:w-14 ${mobileBottom}`}
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