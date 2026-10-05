import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface PdfGenerationOptions {
  fileName?: string;
  title?: string;
  orientation?: 'p' | 'portrait' | 'l' | 'landscape';
}

/**
 * Downloads a File or shares it via Android system share sheet if inside an APK/WebView
 */
export const downloadOrShareFile = async (
  file: File,
  blobUrl: string,
  title: string = 'રિપોર્ટ'
): Promise<'shared' | 'downloaded'> => {
  // 1. If Web Share API with file support is available (e.g. Android Chrome / WebView / APK)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: `${title} - MedStock રજિસ્ટર`,
      });
      return 'shared';
    } catch (err: any) {
      // If user cancelled the share dialog, return gracefully
      if (err.name === 'AbortError') {
        return 'shared';
      }
      console.warn('Share API failed, falling back to download link:', err);
    }
  }

  // 2. Direct anchor click download (Blob URL)
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);
  } catch (err) {
    console.warn('Link download failed, attempting window.open:', err);
    window.open(blobUrl, '_blank');
  }

  return 'downloaded';
};

/**
 * Converts a DOM element into a crisp A4 PDF using html2canvas-pro (with full OKLCH support) and jsPDF
 */
export const generatePdfFromElement = async (
  element: HTMLElement,
  options: PdfGenerationOptions = {}
): Promise<{
  success: boolean;
  action: 'shared' | 'downloaded' | 'failed';
  blobUrl?: string;
  error?: string;
}> => {
  try {
    const orientation = options.orientation || 'p';
    const fileName = options.fileName || `MedStock_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    const title = options.title || 'મેડસ્ટોક રિપોર્ટ';

    // 1. Render element to high-res canvas (scale: 2 for 300+ DPI sharpness)
    // Using html2canvas-pro which has full support for Tailwind CSS v4's OKLCH color palette
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 2. Initialize jsPDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Remaining pages if long content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 3. Export as Blob and File
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    // 4. Try native jsPDF save first
    try {
      pdf.save(fileName);
    } catch (saveErr) {
      console.warn('pdf.save warning, using downloadOrShareFile:', saveErr);
    }

    // 5. Download or share (handles Android APK WebView natively)
    const action = await downloadOrShareFile(pdfFile, blobUrl, title);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 120000);

    return { success: true, action, blobUrl };
  } catch (error: any) {
    console.error('PDF Generation error:', error);
    return {
      success: false,
      action: 'failed',
      error: error?.message || 'PDF બનાવવામાં ભૂલ આવી.',
    };
  }
};
