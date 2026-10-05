# સ્વાસ્થ્ય સ્ટોક રજિસ્ટર (Personal Stock & Vitran Ledger App)

એક આધુનિક, ઓફલાઇન-ફર્સ્ટ સ્વાસ્થ્ય સબ-સેન્ટર દવા સ્ટોક અને કુવા ક્લોરિનેશન રજિસ્ટર એપ્લિકેશન.

## મુખ્ય સુવિધાઓ (Key Features)
- **ક્લોરિન પાવડર (T.C.L.)**: હાજર સ્ટોક, બેચ ટ્રેકિંગ અને ઇન/આઉટ હિસાબ.
- **ક્લોરિન ટેબ્લેટ**: પાણી શુદ્ધિકરણ ગોળીઓની દૈનિક ગણતરી.
- **આયર્ન ગોળી નાની & મોટી**: WIFS અને માતૃ આરોગ્ય વિતરણ.
- **TCL કુવા ક્લોરિનેશન રજિસ્ટર**: ગોળ કુવા અને ચોરસ ટાંકીના પાણીના કદ અને જરૂરી TCL પાવડરની ઓટોમેટિક ગણતરી.
- **ઓફલાઇન સપોર્ટ**: ઇન્ટરનેટ વગર પણ તમામ ડેટા લોકલ સેવ રહે છે.
- **પ્રિન્ટ & એક્સપોર્ટ**: સત્તાવાર સરકારી ફોર્મેટમાં પ્રિન્ટ અને CSV / Excel ડાઉનલોડ.

---

## GitHub પરથી સીધી Android APK ડાઉનલોડ કરવાની રીત (Automated APK Build via GitHub Actions)

આ રીપોઝીટરીમાં `.github/workflows/build-apk.yml` વર્કફ્લો પહેલેથી જ કોન્ફિગર કરેલ છે:

1. આ કોડને તમારા GitHub એકાઉન્ટમાં Push કરો:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for MedStock APK app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/medstock-app.git
   git push -u origin main
   ```
2. GitHub પર તમારા રીપોઝીટરી પેજ પર જાઓ અને **"Actions"** ટેબ પર ક્લિક કરો.
3. ત્યાં **"Build Android APK"** વર્કફ્લો ઓટોમેટિક શરૂ થઈ જશે.
4. બિલ્ડ પૂર્ણ થતાં જ (૧ થી ૨ મિનિટમાં), **Artifacts** સેક્શનમાંથી **`MedStock-Android-APK` (app-debug.apk)** ફાઇલ ૧-ક્લિકમાં ડાઉનલોડ કરી શકશો!

---

## લોકલ રન કરવા માટે (Local Development)
```bash
npm install
npm run dev
```
બ્રાઉઝરમાં `http://localhost:3000` ખોલો.
