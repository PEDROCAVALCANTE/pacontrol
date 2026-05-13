export type Client = {
  id: string;
  name: string;
  phone: string;
  responsible: string;
  value?: number;
  dueDay?: number;
  status: 'active' | 'inactive';
  createdAt: number;
};

export type Subscription = {
  id: string;
  // Legacy
  clientId?: string;
  paid?: boolean;
  lastPaymentDate?: number | null;
  
  // New merged fields
  clientName?: string;
  clientPhone?: string;
  responsible?: string;
  service?: string;
  
  monthlyValue: number;
  dueDay: number;
  status: 'active' | 'inactive';
  
  // Year-Month to paid boolean, e.g., '2024-05': true
  payments?: Record<string, boolean>;
  
  createdAt: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: number;
  createdAt: number;
  paid?: boolean;
};
