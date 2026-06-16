export function exportClientsToCsv(clients) {
  const headers = ["Nom et prénom", "Téléphone", "E-mail", "Ville", "Notes"];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = clients.map((c) =>
    [c.full_name, c.phone, c.email, c.city, c.notes].map(escape).join(",")
  );
  const csv = [headers.map(escape).join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}