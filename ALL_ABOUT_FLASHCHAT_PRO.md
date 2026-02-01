# ALL ABOUT FLASHCHAT PRO

> **PROMPT DI CONTESTO COMPLETO** per agenti AI successivi  
> **Progetto:** FlashChat Pro - App Mobile per Corrieri  
> **Ultimo aggiornamento:** 2026-01-31

---

## 📱 COS'È FLASHCHAT PRO (Business Context)

FlashChat Pro è un'**utility mobile Android** progettata specificamente per **corrieri e delivery driver**. Lo scopo è semplificare e velocizzare la comunicazione con i destinatari delle consegne.

### Caso d'uso tipico:
1. Il corriere ha un pacco da consegnare
2. Deve contattare il destinatario per avvisare che è arrivato / confermare presenza / organizzare ritiro
3. Invece di digitare manualmente il numero dall'etichetta di spedizione, punta la fotocamera
4. L'app legge automaticamente il numero di telefono dall'etichetta
5. **FEATURE CHIAVE - Smart Recipient:** L'app distingue automaticamente se il numero è del MITTENTE o del DESTINATARIO tramite analisi del contesto testuale
6. Con un tap apre WhatsApp o il dialer telefonico

### Value Proposition:
- Risparmio tempo (no digitazione manuale numeri)
- Riduzione errori (OCR automatico)
- Smart Recipient evita di chiamare il mittente invece del destinatario

---

## 🛠️ STACK TECNICO ESATTO

Questo è un progetto **React Native con Expo**. Non è un'app pura React Native (CLI), usa il managed workflow di Expo.

### Versioni precise (NON aggiornare senza test approfonditi):

| Componente | Versione | Nota |
|------------|----------|------|
| **React Native** | 0.81.5 | Latest stable, compatibile con Expo SDK 54 |
| **React** | 19.1.0 | Peer dependency di RN |
| **Expo SDK** | 54.0.32 | Latest SDK, rilasciato recentemente |
| **JavaScript** | ES2023 | NO TypeScript (per ora) |

### Dipendenze critiche (CORE FEATURES):

```json
{
  "@react-native-ml-kit/text-recognition": "^1.5.2",
  "expo-camera": "~17.0.10",
  "expo-clipboard": "~8.0.8",
  "expo-linking": "~8.0.11",
  "@expo/vector-icons": "^15.0.3"
}
```

#### Spiegazione dipendenze:

1. **`@react-native-ml-kit/text-recognition`** (v1.5.2)
   - **FUNZIONE:** OCR on-device di Google ML Kit
   - **PERCHÉ:** Legge testo dalle foto scattate, estrae numeri telefonici
   - **ATTENZIONE:** È una libreria nativa, richiede rebuild su modifiche

2. **`expo-camera`** (v17.0.10)
   - **FUNZIONE:** Accesso fotocamera, preview live, scatto foto
   - **CONFIGURAZIONE:** Già configurato in `app.json` con permessi
   - **NOTA:** Versione compatibile con SDK 54, CameraView API aggiornata

3. **`expo-clipboard`** (v8.0.8)
   - **FUNZIONE:** Monitora clipboard per numeri telefonici copiati
   - **COMPORTAMENTO:** Quando l'app torna in foreground (AppState), controlla se c'è un numero nella clipboard e mostra widget "USA"

4. **`expo-linking`** (v8.0.11)
   - **FUNZIONE:** Deep linking verso app esterne
   - **USO:** `wa.me` per WhatsApp, `tel:` per telefono

---

## 📁 STRUTTURA DEL CODICE

### Architettura: SINGLE FILE MONOLITH

**TUTTA l'applicazione è contenuta in un unico file: `App.js`** (555 righe).

NON c'è:
- Separazione componenti/funzioni in file diversi
- State management (Redux, Zustand, Context)
- Navigazione (React Navigation) - è una single-screen app
- API backend
- Database

### Struttura App.js:

```
App.js
├── Imports (React, Expo libs, ML Kit)
├── Constants (width, quickMessages array)
├── Componente App (default export)
│   ├── State hooks (useState x 10+ stati)
│   ├── useEffect (clipboard monitoring)
│   ├── Helper functions:
│   │   ├── formatNumber()
│   │   ├── openWhatsApp()
│   │   ├── makeCall()
│   │   ├── extractItalianMobileNumbers() ⭐ CORE
│   │   ├── addToHistory()
│   │   ├── startCamera()
│   │   └── takePicture()
│   ├── Render condizionale:
│   │   ├── if showCamera: CameraView fullscreen
│   │   └── else: Main UI
│   └── StyleSheet (160+ righe di stili inline)
```

### Logica "Smart Recipient" (CUORE DELL'APP):

Questa è la funzione più importante. Si trova in `App.js` righe 115-155.

```javascript
const extractItalianMobileNumbers = (text) => {
  // Regex per numeri italiani che iniziano con 3
  const phoneRegex = /(?:\+39|0039|39)?[\s.-]?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})/g;
  
  const normalizedText = text.toLowerCase();
  const numbers = [];
  const seen = new Set();
  let match;

  while ((match = phoneRegex.exec(text)) !== null) {
    const mobileNumber = match[1] + match[2] + match[3];
    
    if (mobileNumber.length === 10 && mobileNumber.startsWith('3')) {
      if (!seen.has(mobileNumber)) {
        seen.add(mobileNumber);
        
        // ANALISI CONTESTO (prende 60 caratteri prima del numero)
        const index = match.index;
        const context = normalizedText.substring(Math.max(0, index - 60), index);
        
        // CLASSIFICAZIONE
        let type = 'Sconosciuto';
        if (context.includes('destinatario') || context.includes('dest.') || context.includes(' rcv') || context.includes(' a:')) {
          type = 'Destinatario';
        } else if (context.includes('mittente') || context.includes('mitt.') || context.includes(' da:')) {
          type = 'Mittente';
        }
        
        numbers.push({ number: mobileNumber, type });
      }
    }
  }

  // ORDINAMENTO: Destinatari per primi
  return numbers.sort((a, b) => {
    if (a.type === 'Destinatario' && b.type !== 'Destinatario') return -1;
    if (a.type !== 'Destinatario' && b.type === 'Destinatario') return 1;
    return 0;
  });
};
```

**Cosa fa:**
1. Prende il testo OCR grezzo
2. Trova tutti i numeri che iniziano con 3 (cellulari italiani)
3. Per ogni numero, guarda i 60 caratteri precedenti nel testo
4. Cerca keyword: "destinatario", "dest.", " rcv", " a:" → marca come Destinatario
5. Cerca keyword: "mittente", "mitt.", " da:" → marca come Mittente
6. Ordina l'array mettendo i Destinatari per primi (UI li evidenzia con stella)

**User Flow OCR:**
1. Utente preme icona fotocamera → `startCamera()`
2. CameraView a schermo intero con frame scanner
3. Utente inquadra etichetta, preme bottone capture
4. `takePicture()` scatta foto (quality 0.8)
5. `TextRecognition.recognize(photo.uri)` → ritorna testo
6. `extractItalianMobileNumbers()` processa il testo
7. **Se 0 numeri:** Alert "Nessun numero trovato"
8. **Se 1 numero:** Inserisce automatico nel campo telefono
9. **Se 2+ numeri:** Apre modal con lista, Destinatari evidenziati con stella dorata, utente seleziona quello giusto

---

## ✅ STATO ATTUALE (Cosa Funziona vs Cosa Manca)

### ✅ FUNZIONA CORRETTAMENTE:

1. **Camera + OCR**
   - Preview live funzionante
   - Flash toggle (on/off)
   - Scatto foto e OCR ML Kit
   - Riconoscimento numeri cellulari italiani (prefisso 3)

2. **Smart Recipient Detection**
   - Regex funzionante
   - Context analysis funzionante
   - Ordinamento Destinatario > Mittente
   - UI modal con stella per destinatari

3. **Comunicazione**
   - Deep link WhatsApp (wa.me)
   - Deep link telefono (tel:)
   - Formattazione numeri (rimuove +39, 0039, spazi)

4. **UX Features**
   - Clipboard monitoring (widget "NUMERO COPIATO")
   - History ultimi 5 numeri
   - Quick messages predefinite
   - UI responsive, stili WhatsApp-themed

5. **Build System**
   - Expo SDK 54 configurato
   - EAS build configurato (preview/production)
   - Metro config fixato per SDK 54
   - Icona/splash configurati

### ❌ MANCA / DA FARE:

1. **CI/CD GitHub Actions** (PRIORITÀ ASSOLUTA)
   - Target: Build APK Android automatico su ogni push
   - Bypassare costi EAS usando GitHub Pro + runner self-hosted se necessario
   - Keystore Android da generare e configurare nei secrets

2. **Icona App**
   - Asset attuali in `assets/` sono placeholder
   - Serve nuovo design icon.png + adaptive-icon.png

3. **Testing**
   - Zero test unitari
   - Zero test integrazione
   - Zero test E2E

4. **TypeScript**
   - Codice è JavaScript puro
   - Nessun type checking

5. **Documentazione**
   - README.md è praticamente vuoto
   - Nessun ADR (Architecture Decision Records)

---

## ⚠️ ISTRUZIONI CRITICHE PER CHI PRENDE IN CARICO

### 🔴 NON TOCCARE (Funziona già, rischio regression):

1. **La regex OCR**
   ```javascript
   const phoneRegex = /(?:\+39|0039|39)?[\s.-]?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})/g;
   ```
   - È calibrata per numeri italiani che iniziano con 3
   - Modifiche possono rompere riconoscimento
   - Se devi estendere (es. numeri fissi), aggiungi pattern separato, non modificare questo

2. **La logica Smart Recipient**
   - Le keyword `destinatario`, `mittente`, `dest.`, `mitt.`, `rcv`, `a:`, `da:` sono state testate su etichette reali
   - Non rimuovere keyword esistenti, solo aggiungere se necessario
   - Il range di 60 caratteri di contesto è un buon compromesso

3. **Metro config fix**
   ```javascript
   config.transformer.minifierConfig = {
     keep_classnames: true,
     keep_fnames: true,
     mangle: { keep_fnames: true, keep_classnames: true },
   };
   ```
   - Necessario per Expo SDK 54
   - Rimuoverlo causa errore "Stripping types is currently unsupported"

4. **CameraView props**
   - `enableTorch={flash === 'on'}`
   - `facing="back"`
   - Non aggiungere `pictureSize` o altri props senza testare su device fisico

### 🟡 PUOI MODIFICARE (Ma con cautela):

1. **Stili (StyleSheet)**
   - I colori sono basati su palette WhatsApp (#25D366, #075E54, #128C7E)
   - Se cambi palette, mantieni coerenza
   - Gli stili sono inline in App.js, puoi estrarli in modulo separato

2. **Quick Messages**
   ```javascript
   const quickMessages = [
     "Ciao! Sono il corriere, sono sotto casa.",
     "Buongiorno, ho un pacco per lei. C'è qualcuno?",
     "Le ho lasciato il pacco in portineria.",
     "Purtroppo non ho trovato nessuno, ripasso domani."
   ];
   ```
   - Array di stringhe, puoi aggiungere/modificare
   - Lingua italiana (target utenti italiani)

3. **History limit**
   - Attualmente `.slice(0, 5)`
   - Puoi aumentare/diminuire

### 🟢 LIBERO DI IMPLEMENTARE:

1. **CI/CD Pipeline**
   - Nessuna configurazione esistente
   - Cartella `.github/workflows/` da creare
   - Target: build APK Android senza EAS (usare `expo prebuild` + Gradle)

2. **Test Suite**
   - Nessun test esistente
   - Aggiungere Jest + React Native Testing Library
   - Test prioritari: `extractItalianMobileNumbers()`, `formatNumber()`

3. **TypeScript Migration**
   - Nessun TS esistente
   - Puoi migrare gradualmente o tutto in una volta
   - Aggiungere `tsconfig.json` e rinominare `.js` → `.tsx`

4. **Refactoring modulare**
   - Estrarre funzioni in `utils/`
   - Estrarre componenti in `components/`
   - Creare custom hooks (es. `useClipboard`)

5. **Assets**
   - Nuove icone in `assets/`
   - Dimensioni richieste:
     - `icon.png`: 1024x1024
     - `adaptive-icon.png`: 1024x1024 (con padding per foreground)
     - `splash-icon.png`: 1242x1242
     - `favicon.png`: 48x48

---

## 🚀 WORKFLOW DI SVILUPPO

### Per testare modifiche:

```bash
# 1. Installa dipendenze
npm install

# 2. Avvia server sviluppo
npx expo start

# 3. Scannerizza QR code con Expo Go (Android)
#    oppure premi 'a' per aprire emulatore Android
```

### Per testare OCR (device fisico richiesto):

- Expo Go non supporta librerie native come ML Kit
- Devi fare build preview:
  ```bash
  eas build --profile preview --platform android
  ```
- Oppure sviluppo locale con:
  ```bash
  npx expo run:android
  ```

### Per generare keystore (nuova AI, questo è il tuo compito):

```bash
keytool -genkey -v -keystore flashchat-pro.keystore -alias flashchat -keyalg RSA -keysize 2048 -validity 10000
```
- Metti keystore in `secrets/` (gitignored)
- Configura in GitHub Actions secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS_PASSWORD`

---

## 📋 CHECKLIST PER NUOVA AI

Quando prendi in carico questo progetto, verifica:

- [ ] Hai letto tutto questo documento
- [ ] Hai capito la logica Smart Recipient (riga 115-155 App.js)
- [ ] Sai che Camera + OCR richiede device fisico o build preview
- [ ] Sai che CI/CD è la priorità #1
- [ ] Sai che la regex OCR non va toccata
- [ ] Hai controllato `TECH_SNAPSHOT.md` per documentazione più dettagliata

---

## 📞 CONTESTO AGGIUNTIVO

- **Target utente:** Corrieri italiani, spesso poco tech-savvy → UX deve essere super semplice
- **Device target:** Android (principalmente), telefoni di fascia media
- **Offline-first:** L'app funziona 100% offline, nessuna API remota
- **Privacy:** Zero dati inviati a server, OCR locale su device
- **Performance target:** OCR < 2 secondi su foto etichetta

---

**FINE DEL CONTESTO.**

Ora puoi lavorare su FlashChat Pro come se l'avessi sviluppato tu.
