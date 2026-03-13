import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportTypeTransactionExcel = async ({
    data,
    grandTotal,
    summary,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Status Penjualan");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:I1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN STATUS PENJUALAN";
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
        "Order ID",
        "Tanggal & Waktu",
        "Outlet",
        "Tipe Order",
        "Pelanggan",
        "Metode Pembayaran",
        "Status",
        "Total",
        "Kasir"
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
            horizontal: (i === 7) ? "right" : "left" // Total right aligned
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const rowData = [
            item.order_id || "-",
            item.createdAt ? formatDateTime(item.createdAt) : "-",
            item.outlet?.name || "-",
            item.orderType || "-",
            item.customer?.name || "Guest",
            item.payments?.[0]?.payment_method || "-",
            item.status || "-",
            item.grandTotal || 0,
            item.cashier?.name || "-"
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);

            if (i === 7) {
                // Total - numeric with currency format
                cell.value = value;
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            } else if (i === 6) {
                // Status - with color coding
                cell.value = value;
                cell.alignment = { horizontal: "left" };

                // Add color based on status
                let bgColor = "FFFFFFFF"; // default white
                switch (value) {
                    case "Completed":
                        bgColor = "FFD4EDDA"; // green
                        break;
                    case "Pending":
                        bgColor = "FFFFF3CD"; // yellow
                        break;
                    case "Cancelled":
                        bgColor = "FFF8D7DA"; // red
                        break;
                    case "OnProcess":
                        bgColor = "FFD1ECF1"; // blue
                        break;
                    case "Waiting":
                        bgColor = "FFE2E3E5"; // gray
                        break;
                }

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: bgColor }
                };
            } else {
                // Text columns
                cell.value = value;
                cell.alignment = { horizontal: "left" };
            }

            cell.border = undefined;
        });

        currentRow++;
    });

    // =====================
    // 5. GRAND TOTAL
    // =====================
    if (grandTotal !== undefined) {
        const grandRow = [
            "GRAND TOTAL",
            "",
            "",
            "",
            "",
            "",
            "",
            grandTotal,
            ""
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i === 0) {
                cell.alignment = { horizontal: "left" };
            } else if (i === 7) {
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            } else {
                cell.alignment = { horizontal: "left" };
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
            ["Total Transaksi", `${summary.totalTransactions?.toLocaleString('id-ID') || 0} transaksi`],
            ["Total Pendapatan", `Rp ${summary.totalRevenue?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Transaksi", `Rp ${summary.averageTransaction?.toLocaleString('id-ID') || 0}`]
        ];

        // Add status breakdown if available
        if (summary.statusBreakdown) {
            summaryData.push(["", ""]); // spacer
            summaryData.push(["BREAKDOWN STATUS", ""]);

            Object.entries(summary.statusBreakdown).forEach(([status, count]) => {
                summaryData.push([`  ${status}`, `${count} transaksi`]);
            });
        }

        summaryData.forEach(([label, value]) => {
            const labelCell = sheet.getCell(`A${currentRow}`);
            const valueCell = sheet.getCell(`B${currentRow}`);

            labelCell.value = label;
            if (label && !label.startsWith("  ")) {
                labelCell.font = { bold: true };
            }

            valueCell.value = value;
            valueCell.alignment = { horizontal: "left" };

            currentRow++;
        });

        // =====================
        // 7. OUTLET & PAYMENT METHOD TERPOPULER
        // =====================
        if (summary.topOutlet || summary.topPaymentMethod) {
            currentRow += 1; // spasi

            const popularData = [];

            if (summary.topOutlet) {
                popularData.push([
                    "🏪 Outlet Terbanyak",
                    `${summary.topOutlet.name} (${summary.topOutlet.count} transaksi)`
                ]);
            }

            if (summary.topPaymentMethod) {
                popularData.push([
                    "💳 Metode Pembayaran Terpopuler",
                    `${summary.topPaymentMethod.method} (${summary.topPaymentMethod.count} transaksi)`
                ]);
            }

            if (summary.topOrderType) {
                popularData.push([
                    "📦 Tipe Order Terpopuler",
                    `${summary.topOrderType.type} (${summary.topOrderType.count} transaksi)`
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
        15,  // Order ID
        20,  // Tanggal & Waktu
        20,  // Outlet
        15,  // Tipe Order
        20,  // Pelanggan
        20,  // Metode Pembayaran
        15,  // Status
        15,  // Total
        20   // Kasir
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && (i === 0 || i === 2 || i === 4 || i === 8)) {
                maxLength = Math.min(val.length, 40); // cap at 40
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

// Helper function to format date time
const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};