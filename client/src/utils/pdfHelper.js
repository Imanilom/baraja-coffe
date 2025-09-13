import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const handleDownloadPDF = async (targetId, fileName = "download.pdf") => {
    const input = document.getElementById(targetId);
    if (!input) {
        alert("Elemen dengan id '" + targetId + "' tidak ditemukan!");
        return;
    }

    // render full elemen, bukan cuma viewport
    const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // halaman pertama
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    // kalau konten lebih panjang → tambahin halaman baru
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(fileName);
};
