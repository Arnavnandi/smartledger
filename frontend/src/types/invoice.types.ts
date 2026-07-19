export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  total?: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

export interface InvoiceRequest {
  clientId: number;
  issueDate: string;
  dueDate: string;
  status?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
}

export interface InvoiceStatusUpdateRequest {
  status: string;
  note?: string;
}

export interface InvoiceActivity {
  id: number;
  actionType: string;
  description: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}
