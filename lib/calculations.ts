import {
  Expense,
  MemberBalance,
  Settlement,
  TripSummary,
  User,
} from './types';

export function calculateTripSummary(
  expenses: Expense[],
  members: User[]
): TripSummary {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Build balance map
  const balanceMap: Record<string, { paid: number; owed: number }> = {};
  for (const member of members) {
    balanceMap[member.id] = { paid: 0, owed: 0 };
  }

  for (const expense of expenses) {
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) continue;
    const perPerson = expense.amount / splitCount;

    // Credit the payer
    if (balanceMap[expense.paidBy]) {
      balanceMap[expense.paidBy].paid += expense.amount;
    }
    // Debit each person in the split
    for (const uid of expense.splitAmong) {
      if (balanceMap[uid]) {
        balanceMap[uid].owed += perPerson;
      }
    }
  }

  const memberBalances: MemberBalance[] = members.map((member) => {
    const { paid, owed } = balanceMap[member.id] || { paid: 0, owed: 0 };
    return {
      userId: member.id,
      name: member.name,
      totalPaid: paid,
      totalOwed: owed,
      netBalance: paid - owed,
    };
  });

  // Settlement algorithm (greedy)
  const settlements: Settlement[] = [];

  // Separate debtors and creditors
  const debtors = memberBalances
    .filter((mb) => mb.netBalance < -0.01)
    .map((mb) => ({ ...mb }))
    .sort((a, b) => a.netBalance - b.netBalance);

  const creditors = memberBalances
    .filter((mb) => mb.netBalance > 0.01)
    .map((mb) => ({ ...mb }))
    .sort((a, b) => b.netBalance - a.netBalance);

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(-debtor.netBalance, creditor.netBalance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.netBalance += amount;
    creditor.netBalance -= amount;

    if (Math.abs(debtor.netBalance) < 0.01) d++;
    if (Math.abs(creditor.netBalance) < 0.01) c++;
  }

  return { totalExpenses, memberBalances, settlements };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  transport: 'Transport',
  accommodation: 'Accommodation',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activities: '🎯',
  shopping: '🛍️',
  other: '💼',
};
