import type { Transaction } from "@/app/api/upload/route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) return null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--kash-border)" }}
    >
      <Table>
        <TableHeader>
          <TableRow className="kash-table-header-row">
            <TableHead className="kash-th">Date</TableHead>
            <TableHead className="kash-th">Description</TableHead>
            <TableHead className="kash-th">Category</TableHead>
            <TableHead className="kash-th kash-th-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, i) => {
            const isPos = tx.amount > 0;
            const fmt = `${isPos ? "+" : "-"}$${Math.abs(tx.amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            const category = tx.category;
            return (
              <TableRow key={i} className="kash-table-row">
                <TableCell className="kash-td-muted">{tx.date}</TableCell>
                <TableCell className="kash-td-primary">{tx.description}</TableCell>
                <TableCell>
                  {category && (
                    <Badge
                      variant="outline"
                      className={`kash-cat-badge ${
                        isPos ? "kash-cat-income" : "kash-cat-default"
                      }`}
                    >
                      {category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell
                  className="kash-td-amount"
                  style={{ color: isPos ? "var(--green)" : "var(--red)" }}
                >
                  {fmt}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

