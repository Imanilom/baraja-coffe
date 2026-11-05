import jsPDF from "jspdf";

/**
 * Ekspor Laporan Penjualan Detil ke PDF Terkompresi
 * 
 * Menggunakan rendering teks murni jsPDF (prosedural) bukan screenshot canvas DOM.
 * Sangat efisien, menghasilkan berkas PDF berukuran kecil (50-200 KB) untuk ratusan data.
 */
export const exportSalesListPDF = async (rawData, fileName = "laporan-penjualan.pdf", headerInfo = []) => {
    // 1. Group data by ID Struk (karena rawData berupa flat item per baris)
    const grouped = {};
    rawData.forEach(row => {
        const trxId = row["ID Struk"] || "UNKNOWN";
        if (!grouped[trxId]) {
            grouped[trxId] = [];
        }
        grouped[trxId].push(row);
    });

    const transactions = Object.keys(grouped).map(trxId => {
        const items = grouped[trxId];
        const first = items[0];

        // Gabungkan produk
        const productsList = items.map(item => {
            const qty = item["Jumlah Produk"] || 1;
            const name = item["Nama Produk"] || "-";
            return `${qty}x ${name}`;
        }).join(", ");

        // Parse total harga dari baris pertama yang berisi subtotal/total
        const total = parseFloat(first["Total"]) || parseFloat(first["Penjualan Kotor"]) || 0;

        return {
            date: first["Tanggal & Waktu"] || "-",
            orderId: trxId,
            cashier: first["Kasir"] || "-",
            products: productsList,
            type: first["Tipe Penjualan"] || "-",
            paymentMethod: first["Metode Pembayaran"] || "-",
            paymentStatus: first["Status Pembayaran"] || "-",
            total: total
        };
    });

    // Urutkan transaksi berdasarkan tanggal secara descending
    transactions.sort((a, b) => b.orderId.localeCompare(a.orderId));

    // Hitung Grand Total
    const totalRevenue = transactions.reduce((sum, trx) => sum + trx.total, 0);
    const totalTrx = transactions.length;

    // Inisialisasi jsPDF (A4, portrait, mm)
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2); // 190mm

    // Format Currency Rupiah
    const formatCurrency = (amount) => {
        return "Rp " + Math.round(amount).toLocaleString("id-ID");
    };

    // Helper: Draw Header Laporan di Halaman Baru
    const drawHeader = (pageNum, totalPages = 1) => {
        pdf.setFillColor(0, 84, 41); // Brand Green Baraja #005429
        pdf.rect(margin, margin, contentWidth, 3, "F");

        // Judul Laporan
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(30, 41, 59); // Slate 800
        pdf.text("LAPORAN DETAIL PENJUALAN", margin, margin + 12);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100); // Slate 500
        pdf.text("Sistem Dashboard Baraja Coffee Backoffice", margin, margin + 17);

        // Halaman
        pdf.setFontSize(8);
        pdf.text(`Halaman ${pageNum}`, pageWidth - margin - 20, margin + 12);

        // Metadata box
        pdf.setFillColor(248, 250, 252); // Slate 50
        pdf.setDrawColor(226, 232, 240); // Slate 200
        pdf.rect(margin, margin + 22, contentWidth, 24, "FD");

        pdf.setTextColor(30, 41, 59);
        pdf.setFont("helvetica", "bold");
        pdf.text("METADATA LAPORAN", margin + 5, margin + 28);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        // Column 1
        headerInfo.forEach((info, idx) => {
            const yOffset = margin + 33 + (idx * 4);
            if (idx < 3 && yOffset < margin + 45) {
                pdf.text(`${info[0]}: ${info[1]}`, margin + 5, yOffset);
            }
        });

        // Column 2 (Ringkasan Keuangan)
        const col2X = margin + 110;
        pdf.setFont("helvetica", "bold");
        pdf.text("RINGKASAN:", col2X, margin + 28);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Total Transaksi: ${totalTrx} struk`, col2X, margin + 33);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 84, 41);
        pdf.text(`Total Omset: ${formatCurrency(totalRevenue)}`, col2X, margin + 38);

        pdf.setTextColor(0); // reset
    };

    // Draw Column Headers
    const colWidths = {
        no: 8,
        date: 24,
        id: 22,
        cashier: 20,
        products: 48,
        type: 15,
        payment: 20,
        status: 13,
        total: 20
    };

    const colX = {
        no: margin,
        date: margin + colWidths.no,
        id: margin + colWidths.no + colWidths.date,
        cashier: margin + colWidths.no + colWidths.date + colWidths.id,
        products: margin + colWidths.no + colWidths.date + colWidths.id + colWidths.cashier,
        type: margin + colWidths.no + colWidths.date + colWidths.id + colWidths.cashier + colWidths.products,
        payment: margin + colWidths.no + colWidths.date + colWidths.id + colWidths.cashier + colWidths.products + colWidths.type,
        status: margin + colWidths.no + colWidths.date + colWidths.id + colWidths.cashier + colWidths.products + colWidths.type + colWidths.payment,
        total: margin + colWidths.no + colWidths.date + colWidths.id + colWidths.cashier + colWidths.products + colWidths.type + colWidths.payment + colWidths.status
    };

    const drawTableHeaders = (y) => {
        pdf.setFillColor(0, 84, 41); // Sage Green Brand
        pdf.rect(margin, y, contentWidth, 7, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(255, 255, 255); // White text

        const cellCenterOffset = 3.5;
        pdf.text("NO", colX.no + 2, y + 5);
        pdf.text("TANGGAL", colX.date + 2, y + 5);
        pdf.text("ID STRUK", colX.id + 2, y + 5);
        pdf.text("KASIR", colX.cashier + 2, y + 5);
        pdf.text("PRODUK TERJUAL", colX.products + 2, y + 5);
        pdf.text("TIPE", colX.type + 2, y + 5);
        pdf.text("BAYAR", colX.payment + 2, y + 5);
        pdf.text("STATUS", colX.status + 1, y + 5);
        pdf.text("TOTAL (RP)", colX.total + 2, y + 5);

        pdf.setTextColor(0);
    };

    let currentPageNum = 1;
    drawHeader(currentPageNum);
    
    let yPos = 52;
    drawTableHeaders(yPos);
    yPos += 7;

    // Process rows
    transactions.forEach((trx, idx) => {
        // Wrap products text
        const wrappedProducts = pdf.splitTextToSize(trx.products, colWidths.products - 4);
        const maxLines = Math.max(1, wrappedProducts.length);
        const rowHeight = (maxLines * 3.5) + 3.5; // padding included

        // Cek apakah muat di halaman saat ini
        if (yPos + rowHeight > pageHeight - 15) {
            pdf.addPage();
            currentPageNum++;
            drawHeader(currentPageNum);
            yPos = 52;
            drawTableHeaders(yPos);
            yPos += 7;
        }

        // Draw zebra background stripe
        if (idx % 2 === 1) {
            pdf.setFillColor(248, 250, 252); // Slate 50
            pdf.rect(margin, yPos, contentWidth, rowHeight, "F");
        }

        // Row borders (very light grey horizontal lines)
        pdf.setDrawColor(241, 245, 249);
        pdf.line(margin, yPos + rowHeight, margin + contentWidth, yPos + rowHeight);

        // Draw cells
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(51, 65, 85); // Slate 700

        // No
        pdf.text((idx + 1).toString(), colX.no + 2, yPos + 4.5);
        
        // Date
        pdf.text(trx.date, colX.date + 1, yPos + 4.5);

        // Order ID (bold green key)
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 84, 41);
        pdf.text(trx.orderId, colX.id + 1, yPos + 4.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(51, 65, 85);

        // Cashier
        pdf.text(trx.cashier, colX.cashier + 1, yPos + 4.5);

        // Products (multiline wrapped)
        wrappedProducts.forEach((line, lineIdx) => {
            pdf.text(line, colX.products + 2, yPos + 4.5 + (lineIdx * 3.5));
        });

        // Type
        pdf.text(trx.type, colX.type + 1, yPos + 4.5);

        // Payment
        pdf.text(trx.paymentMethod, colX.payment + 1, yPos + 4.5);

        // Status
        const statusLabel = trx.paymentStatus === "Lunas" ? "LUNAS" : trx.paymentStatus;
        if (statusLabel === "LUNAS") {
            pdf.setTextColor(16, 185, 129); // Emerald 500
        } else {
            pdf.setTextColor(245, 158, 11); // Amber 500
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(statusLabel, colX.status + 1, yPos + 4.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(51, 65, 85);

        // Total (Right aligned)
        const totalText = Math.round(trx.total).toLocaleString("id-ID");
        const totalWidth = pdf.getTextWidth(totalText);
        pdf.setFont("helvetica", "bold");
        pdf.text(totalText, colX.total + colWidths.total - totalWidth - 2, yPos + 4.5);

        yPos += rowHeight;
    });

    // Draw Grand Total Row
    const totalRowHeight = 8;
    if (yPos + totalRowHeight > pageHeight - 15) {
        pdf.addPage();
        currentPageNum++;
        drawHeader(currentPageNum);
        yPos = 52;
        drawTableHeaders(yPos);
        yPos += 7;
    }

    pdf.setFillColor(241, 245, 249); // Darker stripe for total
    pdf.rect(margin, yPos, contentWidth, totalRowHeight, "F");
    pdf.setDrawColor(203, 213, 225); // Slate 300
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    pdf.line(margin, yPos + totalRowHeight, margin + contentWidth, yPos + totalRowHeight);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    pdf.text("GRAND TOTAL PENJUALAN", colX.no + 2, yPos + 5.5);

    const grandTotalText = formatCurrency(totalRevenue);
    const grandTotalWidth = pdf.getTextWidth(grandTotalText);
    pdf.setTextColor(0, 84, 41); // Brand green
    pdf.text(grandTotalText, colX.total + colWidths.total - grandTotalWidth - 2, yPos + 5.5);

    // Save the PDF
    pdf.save(fileName);
};
