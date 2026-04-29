export type Client = {
  id: string;
  name: string;
  phone: string;
  responsible: string;
  status: 'active' | 'inactive';
  createdAt: number;
};

export type Subscription = {
  id: string;
  clientId: string;
  monthlyValue: number;
  dueDay: number;
  status: 'active' | 'inactive';
  paid: boolean;
  lastPaymentDate: number | null;
  createdAt: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: number;
  createdAt: number;
};
