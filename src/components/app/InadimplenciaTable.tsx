import { useFilialKpis } from "@/hooks/useFilialKpis";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function InadimplenciaTable() {
  const { data } = useFilialKpis();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filial</TableHead>
          <TableHead>Inadimplência (%)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map(row => (
          <TableRow key={row.filial_id}>
            <TableCell className="font-mono">{row.filial_id}</TableCell>
            <TableCell>{row.inadimplencia}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

