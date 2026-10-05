export type StockItemKey =
  | 'clorine-powder'
  | 'clorine-tablet'
  | 'iron-tablet-small'
  | 'iron-tablet-big'
  | string;

export interface StockItem {
  id: string;
  key: StockItemKey;
  nameGu: string; // e.g. ક્લોરિન પાવડર (T.C.L.)
  nameEn: string; // e.g. Chlorine Powder
  category: string;
  unitGu: string; // e.g. કિ.ગ્રા. (Kg), ગોળી (Tabs)
  unitEn: string; // e.g. Kg, Packet, Tablets
  minThreshold: number; // Low stock alert threshold
  description?: string;
  createdAt: string;
}

export interface BatchItem {
  id: string;
  itemId: string;
  batchNumber: string; // બેચ નંબર
  mfgDate: string; // ઉત્પાદન તારીખ YYYY-MM-DD
  expiryDate: string; // એક્સપાયરી તારીખ YYYY-MM-DD
  quantity: number; // ઉપલબ્ધ જથ્થો (Current available in this batch)
  initialQuantity: number; // શરૂઆતનો જથ્થો
  receivedFrom?: string; // ક્યાંથી મળ્યો (e.g. CDHO Store, Govt Medical Depot)
  createdAt: string;
}

export type TransactionAction = 'INWARD' | 'VITRAN' | 'ADJUSTMENT';

export interface VitranEntry {
  id: string;
  timestamp: string;
  date: string; // તારીખ YYYY-MM-DD
  action: TransactionAction;
  itemId: string;
  itemNameGu: string;
  itemNameEn: string;
  unitGu: string;
  unitEn: string;
  batchId: string;
  batchNumber: string; // બેચ નંબર
  mfgDate: string; // ઉત્પાદન તારીખ
  expiryDate: string; // એક્સપાયરી તારીખ
  khultoJatho: number; // ખુલતો જથ્થો (Opening Stock before this entry)
  malelJatho: number; // મળેલ જથ્થો (Quantity received - for INWARD)
  vaprashJatho: number; // વિતરણ / વપરાશ જથ્થો (Quantity distributed - for VITRAN)
  koneAapiyo: string; // કોને આપ્યો (Recipient name / Anganwadi / Subcenter / ASHA / Person / Village)
  bachat: number; // બચત (Closing Balance stock after this entry)
  referenceNo?: string; // ચલન / વાઉચર / કેસ નંબર
  notes?: string; // વિશેષ નોંધ
}

// TCL Well Chlorination Log Book Entry
export interface TclLogEntry {
  id: string;
  timestamp: string;
  date: string; // તારીખ YYYY-MM-DD
  wellOwnerName: string; // કુવા માલિકનું નામ (Kuva Malik)
  location: string; // સ્થળ / ફળિયું / ગામ
  shape: 'CIRCULAR' | 'RECTANGULAR'; // કુવાનો આકાર: ગોળ કે લંબચોરસ
  wellDiameter?: number; // વ્યાસ (મીટરમાં - ગોળ કુવા માટે)
  length?: number; // લંબાઈ (મીટરમાં - લંબચોરસ માટે)
  width?: number; // પહોળાઈ (મીટરમાં - લંબચોરસ માટે)
  waterDepth: number; // પાણીની ઊંડાઈ (મીટરમાં)
  waterVolumeLiters: number; // પાણીનું કુલ કદ (લિટરમાં)
  desiredPpm: number; // ઇચ્છિત PPM (સામાન્ય રીતે 2.0 PPM - વરસાદમાં 2.5 PPM)
  tclUsedGrams: number; // વપરાયેલ TCL પાવડર (ગ્રામમાં)
  tclUsedKg: number; // વપરાયેલ TCL પાવડર (કિલોગ્રામમાં)
  testedPpm?: number; // ક્લોરિનેશન બાદ ટેસ્ટ કરેલ PPM (OT Test)
  operatorName: string; // ક્લોરિનેશન કરનાર કાર્યકર
  notes?: string;
}

export interface RegisterProfile {
  ownerName: string; // રજિસ્ટર સંચાલક e.g. સિદ્ધરાજસિંહ મોરી
  phone?: string;
  centerNameGu: string; // e.g. સ્વાસ્થ્ય સબસેન્ટર સ્ટોક રજિસ્ટર
  centerNameEn: string;
  inchargeName: string;
  villageTaluka: string;
  district: string;
}
