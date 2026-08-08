import api from '@/lib/api';

export interface CorporateGiftInquiryPayload {
  full_name: string;
  phone: string;
  email: string;
  company_name: string;
  customisation?: string;
  qty_requested?: number;
}

export async function submitCorporateGiftInquiry(payload: CorporateGiftInquiryPayload) {
  const { data } = await api.post('/corporate-inquiries', payload);
  return data;
}
