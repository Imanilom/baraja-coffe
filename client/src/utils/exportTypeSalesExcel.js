import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportTypeSalesExcel = async ({
    data,
    grandTotal,
    summary,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tipe Penjualan");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN TIPE PENJUALAN";
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
        "Tipe Penjualan",
        "Jumlah Transaksi",
        "Total Transaksi",
        "Total Fee"
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
            item.orderType || "Unknown",
            item.count || 0,
            item.penjualanTotal || 0,
            0 // Total Fee (placeholder)
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);

            if (i === 0) {
                // Tipe Penjualan - left aligned
                cell.value = value;
                cell.alignment = { horizontal: "left" };
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
            grandTotal.penjualanTotal || 0,
            0 // Total Fee
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i === 0) {
                cell.alignment = { horizontal: "left" };
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

        const summaryData = [
            ["Total Tipe Penjualan", `${data.length} tipe`],
            ["Total Transaksi", `${summary.totalTransactions?.toLocaleString('id-ID') || 0} transaksi`],
            ["Total Pendapatan", `Rp ${summary.totalRevenue?.toLocaleString('id-ID') || 0}`],
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
        // 7. TIPE TERPOPULER
        // =====================
        if (data.length > 0) {
            currentRow += 1; // spasi

            // Cari tipe dengan transaksi terbanyak dan nilai tertinggi
            const topByCount = data.reduce((max, item) =>
                (item.count || 0) > (max.count || 0) ? item : max
            );

            const topByAmount = data.reduce((max, item) =>
                (item.penjualanTotal || 0) > (max.penjualanTotal || 0) ? item : max
            );

            const popularData = [];

            if (topByCount) {
                const percentage = grandTotal.count > 0
                    ? ((topByCount.count / grandTotal.count) * 100).toFixed(2)
                    : 0;

                popularData.push([
                    "🏆 Tipe Terpopuler (Transaksi)",
                    `${topByCount.orderType} (${topByCount.count?.toLocaleString('id-ID')} transaksi, ${percentage}%)`
                ]);
            }

            if (topByAmount && topByAmount.orderType !== topByCount.orderType) {
                const percentage = grandTotal.penjualanTotal > 0
                    ? ((topByAmount.penjualanTotal / grandTotal.penjualanTotal) * 100).toFixed(2)
                    : 0;

                popularData.push([
                    "💰 Tipe Tertinggi (Nilai)",
                    `${topByAmount.orderType} (Rp ${topByAmount.penjualanTotal?.toLocaleString('id-ID')}, ${percentage}%)`
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
        25,  // Tipe Penjualan
        20,  // Jumlah Transaksi
        20,  // Total Transaksi
        15   // Total Fee
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