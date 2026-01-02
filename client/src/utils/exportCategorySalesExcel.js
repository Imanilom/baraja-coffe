import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportCategorySalesExcel = async ({
    data,
    grandTotal,
    fileName,
    headerInfo = []
}) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Penjualan Per Kategori");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "LAPORAN PENJUALAN PER KATEGORI";
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
        "Kategori",
        "Qty Terjual",
        "Penjualan Bersih",
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
            horizontal: i === 0 ? "left" : "right"
        };
    });

    const headerRowNumber = currentRow;
    currentRow++;

    // =====================
    // 4. DATA ROWS
    // =====================
    data.forEach(item => {
        const average =
            item.quantity > 0
                ? Math.round(item.subtotal / item.quantity)
                : 0;

        const rowData = [
            item.category || "-",
            item.quantity,
            item.subtotal,
            average
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;

            if (typeof value === "number") {
                cell.numFmt = "#,##0";
                cell.alignment = { horizontal: "right" };
            } else {
                cell.alignment = { horizontal: "left" };
            }

            cell.border = undefined;
        });

        currentRow++;
    });

    // =====================
    // 5. GRAND TOTAL
    // =====================
    const grandAverage =
        grandTotal.quantity > 0
            ? Math.round(grandTotal.subtotal / grandTotal.quantity)
            : 0;

    const grandRow = [
        "GRAND TOTAL",
        grandTotal.quantity,
        grandTotal.subtotal,
        grandAverage
    ];

    grandRow.forEach((value, i) => {
        const cell = sheet.getCell(currentRow, i + 1);
        cell.value = value;
        cell.font = { bold: true };

        if (typeof value === "number") {
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

    // =====================
    // 6. FREEZE HEADER
    // =====================
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    // =====================
    // 7. AUTO WIDTH
    // =====================
    sheet.columns.forEach(column => {
        let maxLength = 12;
        column.eachCell({ includeEmpty: true }, cell => {
            const val = cell.value ? cell.value.toString() : "";
            maxLength = Math.max(maxLength, val.length);
        });
        column.width = maxLength + 2;
    });

    // =====================
    // 8. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, fileName);
};
