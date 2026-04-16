import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  });
};

const getRegistrationStatusLabel = (status) => {
  if (status === "validee") return "Validée";
  if (status === "refusee") return "Refusée";
  return "En attente";
};

const fitTitleLines = (doc, text, maxWidth) => {
  const safeText = text || "Événement";
  const fontSizes = [14, 13, 12, 11, 10];

  for (const size of fontSizes) {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(safeText, maxWidth);
    if (lines.length <= 3) {
      return { lines, fontSize: size };
    }
  }

  doc.setFontSize(10);
  const lines = doc.splitTextToSize(safeText, maxWidth).slice(0, 3);
  const lastLine = lines[2] || "";
  lines[2] = lastLine.length > 3 ? `${lastLine.slice(0, -3)}...` : `${lastLine}...`;
  return { lines, fontSize: 10 };
};

export async function generateTicketPDF({ event, registration }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(235, 68, 47); // Eventbrite-red variant
  doc.rect(0, 0, pageW, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EventFlow", margin, 14);

  // Order number top right
  const orderNum = registration.id ? registration.id.slice(-8).toUpperCase() : "--------";
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Commande N° ${orderNum}`, pageW - margin, 14, { align: "right" });

  // ── Ticket card border ────────────────────────────────────────────────────
  const cardTop = 30;
  const cardH = 130;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cardTop, contentW, cardH, 4, 4, "S");

  // ── Event title ───────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const titleBlock = fitTitleLines(doc, event.title, contentW - 12 - 36);
  const titleLines = titleBlock.lines;
  doc.setFontSize(titleBlock.fontSize);
  doc.text(titleLines, margin + 6, cardTop + 12);

  const titleLineHeight = titleBlock.fontSize <= 11 ? 5 : 6;
  const subtitleY = cardTop + 12 + titleLines.length * titleLineHeight;

  // ── Location + date ───────────────────────────────────────────────────────
  const infoY = subtitleY + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const locationStr = [event.location_name, event.address, event.city]
    .filter(Boolean)
    .join(", ");
  const locationLines = doc.splitTextToSize(locationStr || "Lieu non précisé", contentW - 12 - 36);
  doc.text(locationLines, margin + 6, infoY);

  const dateStr = event.date_start
    ? `${formatDate(event.date_start)} de ${formatTime(event.date_start)} à ${formatTime(event.date_end)} (heure Cameroun)`
    : "";
  doc.setFont("helvetica", "bold");
  const dateLines = doc.splitTextToSize(dateStr, contentW - 12 - 36);
  doc.text(dateLines, margin + 6, infoY + 8 + Math.max(0, locationLines.length - 1) * 4);

  // ── Price badge ───────────────────────────────────────────────────────────
  const priceLabel = !event.price || event.price === 0 ? "Entrée libre" : `${event.price} FCFA`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(priceLabel, margin + 6, infoY + 20);

  // ── Participant info ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Informations de commande", margin + 6, infoY + 30);

  const fullName = `${registration.first_name || ""} ${registration.last_name || ""}`.trim();
  const registrationStatus = getRegistrationStatusLabel(registration.status);
  const registeredOn = registration.created_date
    ? new Date(registration.created_date).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })
    : new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`Commandé par ${fullName} le ${registeredOn}`, margin + 6, infoY + 38);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Statut du billet: ${registrationStatus}`, margin + 6, infoY + 44);

  // ── QR Code ───────────────────────────────────────────────────────────────
  const qrData = JSON.stringify({
    order: orderNum,
    event: event.id,
    participant: fullName,
    phone: registration.phone || "",
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 96, margin: 1 });
    const qrSize = 36;
    const qrX = pageW - margin - qrSize - 4;
    const qrY = infoY - 6;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Print QR data text under QR
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text(orderNum, qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
  } catch {
    // QR generation failed silently
  }

  // ── Dashed separator (tear line) ──────────────────────────────────────────
  const sepY = cardTop + cardH + 8;
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, sepY, pageW - margin, sepY);
  doc.setLineDashPattern([], 0);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Présentez ce billet (imprimé ou sur smartphone) à l'entrée.", margin, sepY + 8);
  doc.text("EventFlow — Plateforme de gestion d'événements", margin, sepY + 14);

  const fileName = `billet-${(event.title || "evenement").replace(/\s+/g, "-").toLowerCase().slice(0, 40)}-${orderNum}.pdf`;
  doc.save(fileName);
}
