export interface ClientActivity {
  id: number;
  actionType: string;
  description: string;
  timestamp: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags: string[];
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface ClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  outstandingBalance?: number;
}
