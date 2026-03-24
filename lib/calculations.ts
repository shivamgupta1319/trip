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
  const realExpenses = expenses.filter(e => e.title !== 'Settlement Payment');
  const settlementExpenses = expenses.filter(e => e.title === 'Settlement Payment');

  const totalExpenses = realExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Build balance map
  const balanceMap: Record<string, { paid: number; owed: number; netSettlements: number }> = {};
  for (const member of members) {
    balanceMap[member.id] = { paid: 0, owed: 0, netSettlements: 0 };
  }

  // 1. Process real trip expenses for exact share metrics
  for (const expense of realExpenses) {
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) continue;
    const perPerson = expense.amount / splitCount;

    if (balanceMap[expense.paidBy]) {
      balanceMap[expense.paidBy].paid += expense.amount;
    }
    for (const uid of expense.splitAmong) {
      if (balanceMap[uid]) {
        balanceMap[uid].owed += perPerson;
      }
    }
  }

  // 2. Process settlement payments for net balances only
  for (const expense of settlementExpenses) {
    const splitCount = expense.splitAmong.length;
    if (splitCount === 0) continue;
    const perPerson = expense.amount / splitCount;

    if (balanceMap[expense.paidBy]) {
      balanceMap[expense.paidBy].netSettlements += expense.amount; // They paid a debt
    }
    for (const uid of expense.splitAmong) {
      if (balanceMap[uid]) {
        balanceMap[uid].netSettlements -= perPerson; // They received debt payment
      }
    }
  }

  const memberBalances: MemberBalance[] = members.map((member) => {
    const { paid, owed, netSettlements } = balanceMap[member.id] || { paid: 0, owed: 0, netSettlements: 0 };
    return {
      userId: member.id,
      name: member.name,
      totalPaid: paid,
      totalOwed: owed,
      netBalance: (paid - owed) + netSettlements,
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
