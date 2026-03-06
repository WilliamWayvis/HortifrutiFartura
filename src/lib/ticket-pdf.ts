import jsPDF from "jspdf";

interface TicketData {
  code: string;
  label: string;
  priority: boolean;
}

export function generateTicketPDF({ code, label, priority }: TicketData) {
  // Ticket size: 80mm x 120mm (typical thermal receipt width)
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 120],
  });

  const centerX = 40;
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("HORTIFRÚTI FARTURA", centerX, 15, { align: "center" });

  // Divider
  doc.setLineWidth(0.3);
  doc.line(5, 20, 75, 20);

  // Section label
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), centerX, 30, { align: "center" });

  if (priority) {
    doc.setFontSize(9);
    doc.text("FILA PRIORITÁRIA", centerX, 36, { align: "center" });
  }

  // Ticket number
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(code, centerX, priority ? 58 : 52, { align: "center" });

  // Date/time
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${date} - ${time}`, centerX, 75, { align: "center" });

  // Divider
  doc.line(5, 80, 75, 80);

  // Footer
  doc.setFontSize(8);
  doc.text("Aguarde ser chamado", centerX, 88, { align: "center" });
  doc.text("Obrigado pela preferência!", centerX, 93, { align: "center" });

  // Open print dialog directly
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
