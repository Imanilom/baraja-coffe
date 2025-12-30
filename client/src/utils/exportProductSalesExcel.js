import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportProductSalesExcel = async ({
    data,
    grandTotal,
    metadata,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Penjualan Produk");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PENJUALAN PRODUK";
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
        "No",
        "Nama Produk",
        "Qty Terjual",
        "Total Penjualan",
        "Rata-rata"
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
            horizontal: i === 0 || i === 1 ? "left" : "right"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach((item, index) => {
        const rowData = [
            index + 1,
            item.productName || "-",
            item.quantity,
            item.subtotal,
            item.average
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;

            if (i === 0) {
                // No - left aligned
                cell.alignment = { horizontal: "left" };
            } else if (i === 1) {
                // Nama Produk - left aligned
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
    if (grandTotal) {
        const grandRow = [
            "",
            "GRAND TOTAL",
            grandTotal.quantity,
            grandTotal.subtotal,
            grandTotal.average
        ];

        grandRow.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.font = { bold: true };

            if (i === 0 || i === 1) {
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
    if (metadata && grandTotal) {
        currentRow += 2; // spasi

        const summaryTitleCell = sheet.getCell(`A${currentRow}`);
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        summaryTitleCell.value = "RINGKASAN";
        summaryTitleCell.font = { bold: true, size: 14 };
        currentRow++;

        const summaryData = [
            ["Total Produk", `${metadata.totalProducts || data.length} produk`],
            ["Total Orders", `${metadata.totalOrders?.toLocaleString() || 0} order`],
            ["Total Item Terjual", `${grandTotal.quantity?.toLocaleString() || 0} item`],
            ["Total Penjualan", `Rp ${grandTotal.subtotal?.toLocaleString('id-ID') || 0}`],
            ["Rata-rata per Item", `Rp ${grandTotal.average?.toLocaleString('id-ID') || 0}`]
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
    }

    // =====================
    // 7. FREEZE HEADER
    // =====================
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // =====================
    // 8. AUTO WIDTH
    // =====================
    const columnWidths = [
        8,   // No
        40,  // Nama Produk
        15,  // Qty Terjual
        20,  // Total Penjualan
        18   // Rata-rata
    ];

    sheet.columns.forEach((column, i) => {
        let maxLength = columnWidths[i] || 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            if (val.length > maxLength && i !== 1) {
                maxLength = val.length;
            }
        });
        column.width = maxLength + 2;
    });

    // =====================
    // 9. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, fileName);
};