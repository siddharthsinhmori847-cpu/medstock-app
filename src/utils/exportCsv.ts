import { StockItem, BatchItem, VitranEntry, TclLogEntry, RegisterProfile } from '../types/inventory';

export const exportStockDataToCsv = (
  stockItems: StockItem[],
  batches: BatchItem[],
  vitranEntries: VitranEntry[],
  tclLogs: TclLogEntry[],
  profile: RegisterProfile,
  getItemTotalStock: (id: string) => number
) => {
  const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel Gujarati rendering
  let csvContent = '';

  // 1. Header info
  csvContent += `"${profile.centerNameGu || 'આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર'}"\n`;
  csvContent += `"ઈન્ચાર્જ/માલિક","${profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી'}"\n`;
  csvContent += `"તારીખ","${new Date().toLocaleDateString('gu-IN')}"\n\n`;

  // 2. Stock Summary
  csvContent += `"--- ૧. સ્ટોક સારાંશ (STOCK SUMMARY) ---"\n`;
  csvContent += `"ક્રમ","દવા / સાધનનું નામ","કેટેગરી","હાલનો સ્ટોક","યુનિટ","મિનિમમ એલર્ટ લિમિટ"\n`;

  stockItems.forEach((item, index) => {
    const stock = getItemTotalStock(item.id);
    csvContent += `"${index + 1}","${item.nameGu}","${item.category || 'જનરલ'}","${stock}","${item.unitGu}","${item.minThreshold}"\n`;
  });

  // 3. Batches Detail
  csvContent += `\n"--- ૨. આવક બેચ વિગત (BATCH INWARD) ---"\n`;
  csvContent += `"ક્રમ","દવાનું નામ","બેચ નંબર","મળેલ જથ્થો","એક્સપાયરી તારીખ","ક્યાંથી મળ્યો"\n`;

  batches.forEach((b, index) => {
    const item = stockItems.find((i) => i.id === b.itemId);
    csvContent += `"${index + 1}","${item?.nameGu || 'દવા'}","${b.batchNumber}","${b.quantity}","${b.expiryDate || '-'}","${b.receivedFrom || '-'}"\n`;
  });

  // 4. Vitran Diary
  csvContent += `\n"--- ૩. દૈનિક વિતરણ ડાયરી (VITRAN DIARY) ---"\n`;
  csvContent += `"ક્રમ","તારીખ","પ્રકાર","દવાનું નામ","બેચ નંબર","ખુલતો જથ્થો","આવક જથ્થો","વિતરણ જથ્થો","કોને આપ્યો","બચત સ્ટોક","વાઉચર/રેફરન્સ"\n`;

  vitranEntries.forEach((v, index) => {
    const actionLabel = v.action === 'INWARD' ? 'આવક' : v.action === 'VITRAN' ? 'વિતરણ' : 'એડજસ્ટમેન્ટ';
    csvContent += `"${index + 1}","${v.date}","${actionLabel}","${v.itemNameGu}","${v.batchNumber}","${v.khultoJatho}","${v.malelJatho}","${v.vaprashJatho}","${v.koneAapiyo || '-'}","${v.bachat}","${v.referenceNo || '-'}"\n`;
  });

  // 5. TCL Well Chlorination
  csvContent += `\n"--- ૪. કુવા ક્લોરિનેશન રજિસ્ટર (TCL WELL CHLORINATION) ---"\n`;
  csvContent += `"ક્રમ","તારીખ","સ્થળ/ગામ","કુવા માલિક","આકાર","પાણી જથ્થો (લિટર)","TCL માત્રા (ગ્રામ)","કાર્યકરનું નામ"\n`;

  tclLogs.forEach((t, index) => {
    csvContent += `"${index + 1}","${t.date}","${t.location}","${t.wellOwnerName}","${t.shape === 'CIRCULAR' ? 'ગોળ' : 'ચોરસ'}","${t.waterVolumeLiters}","${t.tclUsedGrams}","${t.operatorName}"\n`;
  });

  // Create download link
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `MedStock_Register_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
