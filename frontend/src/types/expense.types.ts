export interface Expense {
  id: number;
  vendorName: string;
  amount: number;
  expenseDate: string;
  categoryId?: number;
  categoryName?: string;
  categoryColor?: string;
  description: string;
  receiptUrl: string;
  isDuplicate: boolean;
  duplicateReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequest {
  vendorName: string;
  amount: number;
  expenseDate: string;
  categoryId?: number;
  category?: string; // used for AI parsing only
  description: string;
  receiptUrl: string;
}
