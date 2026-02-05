import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportCustomerSalesExcel = async ({
    data,
    summary,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Penjualan Per Pelanggan");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PENJUALAN PER PELANGGAN";
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
        "Nama Pelanggan",
        "Tipe Pelanggan",
        "No Telepon",
        "Jumlah Transaksi",
        "Total Penjualan",
        "Rata-rata per Transaksi"
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
            horizontal: i < 3 ? "left" : "right"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const rowData = [
            item.customerName || "Walk-in Customer",
            item.customerType || "-",
            item.customerPhone || "-",
            item.transactionCount || 0,
            item.totalSales || 0,
            item.averagePerTransaction || 0
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;

            if (i < 3) {
                // Text columns - left aligned
                cell.alignment = { horizontal: "left" };
            } else {
                // Numeric columns - right aligned with number format
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
    if (summary) {
        const grandRow = [
            "GRAND TOTAL",
            "",
            "",
            summary.totalTransactions || 0,
            summary.totalSales || 0,
            summary.averagePerTransaction || 0
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i < 3) {
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
            ["Total Pelanggan", `${summary.totalCustomers?.toLocaleString('id-ID') || 0} pelanggan`],
            ["Total Transaksi", `${summary.totalTransactions?.toLocaleString('id-ID') || 0} transaksi`],
            ["Total Penjualan", `Rp ${summary.totalSales?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Transaksi", `Rp ${summary.averagePerTransaction?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Pelanggan", `Rp ${summary.averagePerCustomer?.toLocaleString('id-ID') || 0}`]
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
        // 7. TOP CUSTOMERS SECTION
        // =====================
        if (summary.topCustomers) {
            currentRow += 2; // spasi

            const topCustomersTitleCell = sheet.getCell(`A${currentRow}`);
            sheet.mergeCells(`A${currentRow}:B${currentRow}`);
            topCustomersTitleCell.value = "PELANGGAN TERATAS";
            topCustomersTitleCell.font = { bold: true, size: 14 };
            currentRow++;

            const topCustomersData = [];

            // Pelanggan paling sering transaksi
            if (summary.topCustomers.byTransactionCount) {
                const customer = summary.topCustomers.byTransactionCount;
                topCustomersData.push([
                    "🏆 Paling Sering Transaksi",
                    `${customer.customerName} (${customer.transactionCount?.toLocaleString('id-ID')} transaksi, Rp ${customer.totalSales?.toLocaleString('id-ID')})`
                ]);
            }

            // Pelanggan pembelian terbesar
            if (summary.topCustomers.bySales) {
                const customer = summary.topCustomers.bySales;
                topCustomersData.push([
                    "💰 Pembelian Terbesar",
                    `${customer.customerName} (Rp ${customer.totalSales?.toLocaleString('id-ID')}, ${customer.transactionCount?.toLocaleString('id-ID')} transaksi)`
                ]);
            }

            topCustomersData.forEach(([label, value]) => {
                const labelCell = sheet.getCell(`A${currentRow}`);
                const valueCell = sheet.getCell(`B${currentRow}`);

                labelCell.value = label;
                labelCell.font = { bold: true };
                labelCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF4E6" }
                };

                valueCell.value = value;
                valueCell.alignment = { horizontal: "left" };
                valueCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF4E6" }
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
        30,  // Nama Pelanggan
        20,  // Tipe Pelanggan
        18,  // No Telepon
        20,  // Jumlah Transaksi
        22,  // Total Penjualan
        25   // Rata-rata per Transaksi
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && i < 3) {
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