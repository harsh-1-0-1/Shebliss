import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FAQItem } from '@/types';

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "What is your quality guarantee?",
    answer: "Every order is checked before shipping. If any item arrives damaged, defective, or incorrect, simply submit our Damage Replacement form with a photo within 48 hours, and we'll ship a replacement immediately, completely free of charge. No return shipment required!"
  },
  {
    question: "Where do you deliver?",
    answer: "We deliver to over 15,000 pin codes across India, covering all major metropolitan areas and tier 1 and tier 2 cities."
  },
  {
    question: "How long does delivery take?",
    answer: "Standard deliveries take 3 to 7 business days depending on your location. Metro orders are typically delivered faster within 2 to 4 days."
  },
  {
    question: "Can I cancel or modify my order?",
    answer: "You can cancel or modify your order within 2 hours of placing it. Please call or WhatsApp our support team to request changes."
  }
];

interface ProductFaqProps {
  faqs?: FAQItem[] | null;
}

export default function ProductFaq({ faqs }: ProductFaqProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const items = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="product-faqs" className="mt-10 border-t border-gray-100 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="product-faqs-title">
      <div className="mx-auto w-full max-w-3xl px-0">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <h2
            id="product-faqs-title"
            className="text-2xl font-bold tracking-normal text-gray-950 sm:text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Got questions about orders, shipping, or returns? We've got you covered.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <article
                key={index}
                onClick={() => toggleExpand(index)}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none"
              >
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm sm:text-base font-bold text-[#0a3b2c]">
                    {faq.question}
                  </h3>
                  <button
                    className={`text-[#0e4d3a] p-1 rounded-lg hover:bg-emerald-50 transition shrink-0 ${
                      isExpanded ? 'bg-emerald-50' : ''
                    }`}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    onClick={(e) => {
                      // Prevent double triggering from card onClick
                      e.stopPropagation();
                      toggleExpand(index);
                    }}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 text-xs sm:text-sm leading-relaxed text-gray-600 border-t border-gray-100 pt-4 animate-[fadeInScale_0.15s_ease-out]">
                    {faq.answer}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
