import { StockItem, BatchItem, VitranEntry, RegisterProfile, TclLogEntry } from '../types/inventory';

export const initialRegisterProfile: RegisterProfile = {
  ownerName: 'સિદ્ધાર્થસિંહ મોરી (Admin)',
  phone: '9876543210',
  centerNameGu: 'આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર (Stock Care Dashboard)',
  centerNameEn: 'Personal Health & Water Stock Register',
  inchargeName: 'સિદ્ધાર્થસિંહ મોરી',
  villageTaluka: 'મોરબી / રાજકોટ',
  district: 'રાજકોટ',
};

// 4 Essential health & water sanitation items (Master catalog)
export const initialStockItems: StockItem[] = [
  {
    id: 'item-1',
    key: 'clorine-powder',
    nameGu: 'ક્લોરિન પાવડર (T.C.L.)',
    nameEn: 'Chlorine Bleaching Powder 25%',
    category: 'જળ શુદ્ધિકરણ (Water Sanitation)',
    unitGu: 'કિ.ગ્રા. (Kg)',
    unitEn: 'Kg',
    minThreshold: 25,
    description: 'કુવા, ટાંકી અને પીવાના પાણીના જળાશયના જીવાણુનાશક ક્લોરિનેશન માટે T.C.L. પાવડર',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    key: 'clorine-tablet',
    nameGu: 'ક્લોરિન ટેબ્લેટ (ગોળી)',
    nameEn: 'Chlorine Water Tablets (NaDCC)',
    category: 'જળ શુદ્ધિકરણ (Water Sanitation)',
    unitGu: 'ગોળી (Tabs)',
    unitEn: 'Tabs',
    minThreshold: 500,
    description: 'ઘરેલુ પીવાના પાણીના માટલા અને ટાંકીના શુદ્ધિકરણ માટે ક્લોરિન ગોળી (૦.૫ ગ્રામ / ૧૦૦૦ લિટર)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    key: 'iron-tablet-small',
    nameGu: 'આયર્ન ગોળી નાની (Pink)',
    nameEn: 'Iron Folic Acid Tablet - Small',
    category: 'પોષણ / રક્તહીનતા (Nutrition / Anemia)',
    unitGu: 'ગોળી (Tabs)',
    unitEn: 'Tabs',
    minThreshold: 400,
    description: 'બાળકો (૫ થી ૧૦ વર્ષ) અને કિશોરો માટે એનિમિયા નિવારણ અર્થે આયર્ન ફોલિક એસિડ ગુલાબી ગોળી',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    key: 'iron-tablet-big',
    nameGu: 'આયર્ન ગોળી મોટી (Blue)',
    nameEn: 'Iron Folic Acid Tablet - Big',
    category: 'પોષણ / રક્તહીનતા (Nutrition / Anemia)',
    unitGu: 'ગોળી (Tabs)',
    unitEn: 'Tabs',
    minThreshold: 500,
    description: 'કિશોરીઓ, સગર્ભા અને ધાત્રી માતાઓ માટે આયર્ન ફોલિક એસિડ મોટી વાદળી/બ્લુ ગોળી (૧૦૦ મિ.ગ્રા.)',
    createdAt: new Date().toISOString(),
  },
];

// Clean fresh arrays (All mock data removed as requested)
export const initialBatches: BatchItem[] = [];
export const initialVitranEntries: VitranEntry[] = [];
export const initialTclLogs: TclLogEntry[] = [];
