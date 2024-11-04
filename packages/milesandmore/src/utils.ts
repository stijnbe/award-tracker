export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const value = item[key] as string;
      (groups[value] = groups[value] || []).push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

export function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}
