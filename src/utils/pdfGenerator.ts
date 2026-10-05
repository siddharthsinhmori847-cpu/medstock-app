import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface PdfGenerationOptions {
  fileName?: string;
  title?: string;
  orientation?: 'p' | 'portrait' | 'l' | 'landscape';
  isPrintAction?: boolean;
}

/**
 * Native APK File Saver and Sharing via Capacitor
 * Saves PDF to cache directory and triggers Android native Intent Chooser (Print, Save, Drive, WhatsApp)
 */
export const saveAndShareNativePdf = async (
  fileName: string,
  base64Data: string,
  title: string = 'મેડસ્ટોક રિપોર્ટ',
  isPrintAction: boolean = false
): Promise<{ success: boolean; action: 'shared' | 'downloaded'; uri?: string }> => {
  try {
    // 1. Write the PDF file to Android Cache directory
    const fileResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    console.log('PDF saved to Android storage:', fileResult.uri);

    // 2. Trigger native Android share sheet with FileProvider URI
    await Share.share({
      title: title,
      text: `${title} - MedStock રજિસ્ટર`,
      url: fileResult.uri,
      dialogTitle: isPrintAction ? 'પ્રિન્ટ કરવા માટે પસંદ કરો (Print / Save)' : 'PDF સાચવો અથવા પ્રિન્ટ કરો',
    });

    return { success: true, action: 'shared', uri: fileResult.uri };
  } catch (err: any) {
    // If user cancelled the share dialog, consider it completed
    if (err?.name === 'AbortError' || err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
      return { success: true, action: 'shared' };
    }
    console.error('Capacitor native share error:', err);
    throw err;
  }
};

/**
 * Downloads a File or shares it in Web / Mobile Browser
 */
export const downloadOrShareFile = async (
  file: File,
  blobUrl: string,
  title: string = 'રિપોર્ટ'
): Promise<'shared' | 'downloaded'> => {
  // 1. Web Share API with file support
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: `${title} - MedStock રજિસ્ટર`,
      });
      return 'shared';
    } catch (err: any) {
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
 * Converts a DOM element into a crisp A4 PDF using html2canvas-pro and jsPDF
 * Works seamlessly in both Native APK (Capacitor) and Web Browsers
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
    const isPrintAction = !!options.isPrintAction;

    const isNative = Capacitor.isNativePlatform();
    // Use scale 1.5 on native mobile to prevent Out-Of-Memory while maintaining crisp print quality
    const scale = isNative ? 1.5 : 2;

    // 1. Render element to high-res canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
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

    // 3. Native APK Handling (Android)
    if (isNative) {
      try {
        // Extract pure base64 data string
        const base64Data = pdf.output('dataurlstring').split(',')[1];
        const res = await saveAndShareNativePdf(fileName, base64Data, title, isPrintAction);
        return { success: true, action: res.action };
      } catch (nativeErr: any) {
        console.warn('Native save/share failed, falling back to browser download:', nativeErr);
      }
    }

    // 4. Web Browser Handling
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Try native jsPDF save
    try {
      pdf.save(fileName);
    } catch (saveErr) {
      console.warn('pdf.save warning, using downloadOrShareFile:', saveErr);
    }

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
