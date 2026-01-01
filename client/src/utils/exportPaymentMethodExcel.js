import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportPaymentMethodExcel = async ({
    data,
    grandTotal,
    summary,
    includeTax,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Metode Pembayaran");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN METODE PEMBAYARAN";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    // =====================
    // 2. HEADER INFO
    // =====================
    let currentRow = 3;
    headerInfo.forEach(([label, value]) => {
        sheet.getCell(`A${currentRow}`).value = label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
    });

    currentRow++; // spasi

    // =====================
    // 3. HEADER TABEL
    // =====================
    const columns = [
        "Metode Pembayaran",
        "Jumlah Transaksi",
        "Total",
        "Persentase"
    ];

    columns.forEach((col, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = col;
        cell.font = { bold: true };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" }
        };
        cell.alignment = {
            horizontal: i === 0 ? "left" : "right"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const rowData = [
            item.paymentMethod || "Unknown",
            item.count || 0,
            item.subtotal || 0,
            parseFloat(item.percentage || 0)
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);

            if (i === 0) {
                // Metode Pembayaran - left aligned
                cell.value = value;
                cell.alignment = { horizontal: "left" };
            } else if (i === 3) {
                // Persentase - with % symbol
                cell.value = value / 100; // Convert to decimal for percentage format
                cell.numFmt = "0.00%";
                cell.alignment = { horizontal: "right" };
            } else {
                // Numeric columns - right aligned with number format
                cell.value = value;
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            }

            cell.border = undefined;
        });

        currentRow++;
    });

    // =====================
    // 5. GRAND TOTAL
    // =====================
    if (grandTotal) {
        const grandRow = [
            "GRAND TOTAL",
            grandTotal.count || 0,
            grandTotal.subtotal || 0,
            1 // 100% in decimal
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i === 0) {
                cell.alignment = { horizontal: "left" };
            } else if (i === 3) {
                cell.numFmt = "0.00%";
                cell.alignment = { horizontal: "right" };
            } else {
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            }

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" }
            };

            cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } }
            };
        });

        currentRow++;
    }

    // =====================
    // 6. RINGKASAN SECTION
    // =====================
    if (summary) {
        currentRow += 2; // spasi

        const summaryTitleCell = sheet.getCell(`A${currentRow}`);
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        summaryTitleCell.value = "RINGKASAN";
        summaryTitleCell.font = { bold: true, size: 14 };
        currentRow++;

        const taxLabel = includeTax ? "(Dengan Pajak)" : "(Tanpa Pajak)";

        const summaryData = [
            ["Jenis Laporan", includeTax ? "Dengan Pajak" : "Tanpa Pajak"],
            ["Total Metode Pembayaran", `${data.length} metode`],
            ["Total Transaksi", `${summary.totalTransactions?.toLocaleString('id-ID') || 0} transaksi`],
            ["Total Order", `${summary.totalOrders?.toLocaleString('id-ID') || 0} order`],
            ["Total Pendapatan " + taxLabel, `Rp ${summary.totalRevenue?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Transaksi", `Rp ${summary.averageTransaction?.toLocaleString('id-ID') || 0}`]
        ];

        summaryData.forEach(([label, value]) => {
            const labelCell = sheet.getCell(`A${currentRow}`);
            const valueCell = sheet.getCell(`B${currentRow}`);

            labelCell.value = label;
            labelCell.font = { bold: true };

            valueCell.value = value;
            valueCell.alignment = { horizontal: "left" };

            currentRow++;
        });

        // =====================
        // 7. METODE TERPOPULER
        // =====================
        if (data.length > 0) {
            currentRow += 1; // spasi

            // Cari metode dengan transaksi terbanyak dan nilai tertinggi
            const topByCount = data.reduce((max, item) =>
                (item.count || 0) > (max.count || 0) ? item : max
            );

            const topByAmount = data.reduce((max, item) =>
                (item.subtotal || 0) > (max.subtotal || 0) ? item : max
            );

            const popularData = [];

            if (topByCount) {
                popularData.push([
                    "🏆 Metode Terpopuler (Transaksi)",
                    `${topByCount.paymentMethod} (${topByCount.count?.toLocaleString('id-ID')} transaksi, ${topByCount.percentage}%)`
                ]);
            }

            if (topByAmount && topByAmount.paymentMethod !== topByCount.paymentMethod) {
                popularData.push([
                    "💰 Metode Tertinggi (Nilai)",
                    `${topByAmount.paymentMethod} (Rp ${topByAmount.subtotal?.toLocaleString('id-ID')}, ${topByAmount.percentage}%)`
                ]);
            }

            popularData.forEach(([label, value]) => {
                const labelCell = sheet.getCell(`A${currentRow}`);
                const valueCell = sheet.getCell(`B${currentRow}`);

                labelCell.value = label;
                labelCell.font = { bold: true };
                labelCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFEF3C7" }
                };

                valueCell.value = value;
                valueCell.alignment = { horizontal: "left" };
                valueCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFEF3C7" }
                };

                currentRow++;
            });
        }
    }

    // =====================
    // 8. FREEZE HEADER
    // =====================
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // =====================
    // 9. AUTO WIDTH
    // =====================
    const columnWidths = [
        25,  // Metode Pembayaran
        20,  // Jumlah Transaksi
        20,  // Total
        15   // Persentase
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && i === 0) {
                maxLength = val.length;
            }
        });
        column.width = maxLength + 2;
    });

    // =====================
    // 10. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, fileName);
};