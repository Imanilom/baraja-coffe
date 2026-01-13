import jsPDF from "jspdf";

export const handleDownloadPDF = async (transactionData, formatDateTime, formatCurrency, fileName = "download.pdf") => {
    const pdf = new jsPDF("p", "mm", [80, 200]); // Thermal receipt size (80mm width)

    let yPos = 10;
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    // Helper functions
    const addText = (text, size = 8, style = 'normal', align = 'left') => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);

        if (align === 'center') {
            const textWidth = pdf.getTextWidth(text);
            pdf.text(text, (pageWidth - textWidth) / 2, yPos);
        } else if (align === 'right') {
            const textWidth = pdf.getTextWidth(text);
            pdf.text(text, pageWidth - margin - textWidth, yPos);
        } else {
            pdf.text(text, margin, yPos);
        }
    };

    const addLine = (text1, text2, size = 8) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', 'normal');
        pdf.text(text1, margin, yPos);
        const text2Width = pdf.getTextWidth(text2);
        pdf.text(text2, pageWidth - margin - text2Width, yPos);
    };

    const addDashedLine = () => {
        // Just add spacing without drawing line
        yPos += 3;
    };

    const checkPageHeight = () => {
        if (yPos > 190) {
            pdf.addPage([80, 200]);
            yPos = 10;
        }
    };

    // Header - Logo & Address
    try {
        // Load logo image
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";

        await new Promise((resolve, reject) => {
            logoImg.onload = () => {
                // Add logo centered
                const imgWidth = 25; // 25mm width
                const imgHeight = (logoImg.height / logoImg.width) * imgWidth;
                const xPos = (pageWidth - imgWidth) / 2;

                pdf.addImage(logoImg, 'PNG', xPos, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 3;
                resolve();
            };
            logoImg.onerror = () => {
                console.log("Logo not found, skipping...");
                resolve(); // Continue without logo
            };
            logoImg.src = "/images/logo_resi.png";
        });
    } catch (error) {
        console.log("Error loading logo:", error);
    }

    addText(transactionData.cashierId?.outlet?.[0]?.outletId?.name || "Restoran", 10, 'bold', 'center');
    yPos += 5;

    // Address (wrapped)
    const address = transactionData.cashierId?.outlet?.[0]?.outletId?.address || "";
    const addressLines = pdf.splitTextToSize(address, contentWidth);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    addressLines.forEach(line => {
        pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 3;
    });
    yPos += 3;

    // Transaction Info
    addDashedLine();
    addLine("Kode Struk", transactionData.order_id, 7);
    yPos += 4;
    addLine("Tanggal", formatDateTime(transactionData.createdAt), 7);
    yPos += 4;
    addLine("Kasir", transactionData.groId?.name ? `${transactionData.groId?.name} (GRO)` : transactionData.cashierId?.username || "-", 7);
    yPos += 4;
    addLine("Pelanggan", transactionData.user, 7);
    yPos += 4;
    addLine("No Meja", transactionData.tableNumber, 7);
    yPos += 5;

    // Order Type
    pdf.setFillColor(240, 253, 244);
    pdf.rect(margin, yPos - 3, contentWidth, 5, 'F');
    addText(transactionData.orderType, 8, 'bold', 'center');
    yPos += 5;

    addDashedLine();

    // Items
    transactionData.items?.forEach((item, index) => {
        checkPageHeight();

        // Item name & quantity
        const itemName = item.menuItemData?.name || "Item";
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(itemName, margin, yPos);
        yPos += 4;

        // Quantity & Price
        pdf.setFontSize(7);
        addLine(`  ${item.quantity} x ${formatCurrency(item.subtotal / item.quantity)}`, formatCurrency(item.subtotal), 7);
        yPos += 3;

        // Addons
        if (item.addons && item.addons.length > 0) {
            yPos += 1;
            pdf.setFontSize(6);
            pdf.setTextColor(100);
            item.addons.forEach(addon => {
                checkPageHeight();
                const addonText = `  + ${addon.name}: ${addon.options?.map(opt => opt.label).join(", ")}`;
                pdf.text(addonText, margin, yPos);
                yPos += 3;
            });
            pdf.setTextColor(0);
        }

        // Notes
        if (item.notes) {
            yPos += 1;
            pdf.setFontSize(6);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100);

            // Display notes in single line without wrapping - allow overflow
            const noteText = `  Note: ${item.notes}`;
            pdf.text(noteText, margin, yPos); // Allow wider width to prevent wrap
            yPos += 3.5;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0);
        }

        yPos += 2;
    });

    // Custom Amount Items
    if (transactionData.customAmountItems && transactionData.customAmountItems.length > 0) {
        transactionData.customAmountItems.forEach(customItem => {
            checkPageHeight();
            pdf.setFontSize(8);
            pdf.setTextColor(30, 64, 175);
            pdf.text(`[Custom] ${customItem.name || "Custom Amount"}`, margin, yPos);
            yPos += 4;
            addLine("  1 x " + formatCurrency(customItem.amount), formatCurrency(customItem.amount), 7);
            pdf.setTextColor(0);
            yPos += 5;
        });
    }

    addDashedLine();

    // Totals
    addLine("Sub Total", formatCurrency(transactionData.totalBeforeDiscount), 8);
    yPos += 4;

    // Discounts
    if (transactionData.discounts) {
        pdf.setTextColor(22, 163, 74);
        if (transactionData.discounts.autoPromoDiscount > 0) {
            addLine("Promo Diskon", "-" + formatCurrency(transactionData.discounts.autoPromoDiscount), 7);
            yPos += 4;
        }
        if (transactionData.discounts.manualDiscount > 0) {
            addLine("Manual Diskon", "-" + formatCurrency(transactionData.discounts.manualDiscount), 7);
            yPos += 4;
        }
        if (transactionData.discounts.voucherDiscount > 0) {
            addLine("Voucher Diskon", "-" + formatCurrency(transactionData.discounts.voucherDiscount), 7);
            yPos += 4;
        }
        pdf.setTextColor(0);
    }

    // Tax
    const taxName = transactionData.taxAndServiceDetails?.[0]?.name || "Tax";
    const taxAmount = transactionData.taxAndServiceDetails?.[0]?.amount || 0;
    addLine(taxName, formatCurrency(taxAmount), 7);
    yPos += 5;

    // Grand Total
    addDashedLine();
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 128, 61);
    addLine("TOTAL HARGA", formatCurrency(transactionData.grandTotal), 10);
    pdf.setTextColor(0);
    yPos += 6;

    addDashedLine();

    // Payment Details
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Detail Pembayaran", margin, yPos);
    yPos += 5;

    pdf.setFont('helvetica', 'normal');
    const paymentMethod = transactionData.paymentDetails?.method_type ||
        transactionData.actualPaymentMethod ||
        transactionData.paymentMethod || "N/A";
    addLine("Metode Pembayaran", paymentMethod, 7);
    yPos += 4;

    const changeAmount = transactionData.paymentDetails?.change_amount || 0;
    addLine("Kembali", formatCurrency(changeAmount), 7);
    yPos += 6;

    addDashedLine();

    // Footer
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    addText("Terima kasih atas kunjungan Anda", 7, 'normal', 'center');
    yPos += 4;
    addText("Simpan struk ini sebagai bukti pembayaran", 6, 'normal', 'center');

    pdf.save(fileName);
};