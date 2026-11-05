import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportMenuItemsExcel = async (menuItems) => {
    if (!menuItems || menuItems.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daftar Menu");

    // =====================
    // 1. JUDUL
    // =====================
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "DATABASE DAFTAR MENU PRODUK";
    titleCell.font = { bold: true, size: 16, color: { argb: "FF005429" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    // =====================
    // 2. HEADER INFO
    // =====================
    sheet.getCell("A2").value = "Tanggal Unduh:";
    sheet.getCell("A2").font = { bold: true };
    sheet.getCell("B2").value = new Date().toLocaleString("id-ID");

    sheet.getCell("A3").value = "Total Menu:";
    sheet.getCell("A3").font = { bold: true };
    sheet.getCell("B3").value = `${menuItems.length} produk`;

    // =====================
    // 3. HEADER TABEL
    // =====================
    const columns = [
        "No",
        "ID Menu",
        "Nama Menu",
        "Kategori",
        "Tempat (Workstation)",
        "Harga",
        "Status",
    ];

    const headerRowIndex = 5;

    columns.forEach((col, i) => {
        const cell = sheet.getCell(headerRowIndex, i + 1);
        cell.value = col;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF005429" } // Sage green brand color
        };
        cell.alignment = {
            horizontal: i === 0 || i === 1 || i === 4 || i === 6 ? "center" : i === 5 ? "right" : "left",
            vertical: "middle"
        };
        cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } }
        };
    });

    // =====================
    // 4. DATA ROWS
    // =====================
    let currentRow = 6;
    menuItems.forEach((item, index) => {
        const catName = Array.isArray(item.category)
            ? item.category.map(c => c.name).join(", ")
            : item.category?.name || "-";
        const workstation = item.workstation === "bar" ? "Bar" : "Dapur";
        const status = item.isActive ? "Aktif" : "Nonaktif";

        const rowData = [
            index + 1,
            item.id || item._id || "-",
            item.name || "-",
            catName,
            workstation,
            item.originalPrice || 0,
            status
        ];

        rowData.forEach((value, i) => {
            const cell = sheet.getCell(currentRow, i + 1);
            cell.value = value;
            cell.alignment = {
                horizontal: i === 0 || i === 1 || i === 4 || i === 6 ? "center" : i === 5 ? "right" : "left",
                vertical: "middle"
            };
            if (i === 5) {
                cell.numFmt = "Rp #,##0";
            }
            // Style active status green, nonactive red
            if (i === 6) {
                cell.font = {
                    bold: true,
                    color: { argb: item.isActive ? "FF10B981" : "FFE53E3E" }
                };
            }
            cell.border = {
                top: { style: "thin", color: { argb: "FFE2E8F0" } },
                left: { style: "thin", color: { argb: "FFE2E8F0" } },
                bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                right: { style: "thin", color: { argb: "FFE2E8F0" } }
            };
        });
        currentRow++;
    });

    // =====================
    // 5. AUTO WIDTH
    // =====================
    const columnWidths = [6, 26, 30, 20, 22, 16, 12];
    sheet.columns.forEach((column, i) => {
        column.width = columnWidths[i] || 15;
    });

    // =====================
    // 6. SAVE FILE
    // =====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(blob, `Daftar_Menu_Backoffice_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
