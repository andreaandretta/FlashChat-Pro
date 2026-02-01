# 📸 Tech Snapshot - FlashChat Pro

> **Documento di Architettura Tecnica** | Versione 1.0 | Data: 2026-01-31  
> **Progetto:** FlashChat Pro - App Mobile per Corrieri  
> **Repository:** `https://github.com/andreaandretta/FlashChat-Pro` (Privata/Codespaces)

---

## 1. EXECUTIVE SUMMARY

| Attributo | Valore |
|-----------|--------|
| **Tipo Progetto** | Mobile App (Android) |
| **Stack Principale** | React Native 0.81.5 + Expo SDK 54 + JavaScript |
| **Stato Maturità** | 🟡 MVP / Pre-Production |
| **Health Check** | 🟡 Debito Tecnico Gestibile |
| **Complessità** | **Bassa** - Single-file architecture con logica inline. Nessuno stato globale, nessuna API backend, operazioni 100% client-side. |

**Overview:** FlashChat Pro è un'utility mobile per corrieri che semplifica la comunicazione con i destinatari. Il core value è la funzione "Smart Recipient" che utilizza OCR on-device (ML Kit) per estrarre numeri di telefono dalle etichette di spedizione, distinguendo automaticamente tra Mittente e Destinatario tramite analisi del contesto testuale.

---

## 2. ARCHITETTURA & DATA FLOW

### Pattern Architetturale
**Simple Component Pattern** - L'intera applicazione è contenuta in un unico file `App.js` con un componente React principale che gestisce:
- State management locale (React hooks: `useState`, `useEffect`, `useRef`)
- UI monolitica (styles inline con StyleSheet)
- Business logic inline (OCR processing, regex matching)

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLASHCHAT PRO                               │
│                        Data Flow Architecture                       │
└─────────────────────────────────────────────────────────────────────┘

[USER INPUT]          [CAMERA OCR]              [CLIPBOARD]
     │                      │                        │
     ▼                      ▼                        ▼
┌─────────┐      ┌──────────────────┐      ┌──────────────┐
│TextInput│      │  CameraView      │      │Clipboard API │
│(Manual) │      │  (expo-camera)   │      │(AppState)    │
└────┬────┘      └────────┬─────────┘      └──────┬───────┘
     │                    │                       │
     │                    ▼                       │
     │           ┌────────────────┐               │
     │           │ takePicture()  │               │
     │           └───────┬────────┘               │
     │                   │                        │
     │                   ▼                        │
     │           ┌────────────────┐               │
     │           │ ML Kit OCR     │               │
     │           │ TextRecognition│               │
     │           └───────┬────────┘               │
     │                   │                        │
     └───────────────────┼────────────────────────┘
                         ▼
            ┌────────────────────────┐
            │ extractItalianMobile   │
            │ Numbers()              │
            │ - Regex: /3\d{9}/      │
            │ - Context analysis     │
            │ - Type classification  │
            └───────────┬────────────┘
                        ▼
            ┌────────────────────────┐
            │ Smart Recipient Logic  │
            │ Keyword matching:      │
            │ "destinatario"=Rcv     │
            │ "mittente"=Sender      │
            └───────────┬────────────┘
                        ▼
            ┌────────────────────────┐
            │    phoneNumber State   │
            └───────────┬────────────┘
                        ▼
        ┌───────────────────────────────┐
        │      Action Execution         │
        │  ┌─────────┐  ┌────────────┐  │
        │  │WhatsApp │  │  Phone Call│  │
        │  │(wa.me)  │  │  (tel:)    │  │
        │  └─────────┘  └────────────┘  │
        └───────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  history State  │
              │  (last 5 nums)  │
              └─────────────────┘
```

### Componenti Core

| Componente/Funzione | Responsabilità |
|---------------------|----------------|
| `App` (Main) | Entry point, stato globale applicazione, gestione permessi |
| `CameraView` | Interfaccia camera live, capture foto, controllo flash |
| `extractItalianMobileNumbers()` | Core OCR processor - regex extraction + context classification |
| `formatNumber()` | Normalizzazione numeri (rimozione prefissi, validazione) |
| `openWhatsApp()` | Deep linking verso WhatsApp Web (wa.me) |
| `makeCall()` | Deep linking verso dialer nativo (tel:) |
| `checkClipboard()` | Monitoring clipboard per numeri telefonici |
| `quickMessages[]` | Template messaggi predefiniti per corrieri |

### Dipendenze Esterne Critiche

| Libreria | Versione | Scopo | Criticità |
|----------|----------|-------|-----------|
| `@react-native-ml-kit/text-recognition` | 1.5.2 | OCR on-device | 🔴 Alta - Core feature |
| `expo-camera` | 17.0.10 | Accesso fotocamera | 🔴 Alta - Core feature |
| `expo-clipboard` | 8.0.8 | Clipboard monitoring | 🟡 Media - UX enhancement |
| `expo-linking` | 8.0.11 | Deep linking WA/Tel | 🟡 Media - Integrazione esterna |
| `@expo/vector-icons` | 15.0.3 | UI Icons | 🟢 Bassa - Solo UI |

---

## 3. INVENTARIO TECNICO

### Stack Completo

| Area | Tecnologia | Versione | Stato |
|------|------------|----------|-------|
| Framework | React Native | 0.81.5 | ✅ Aggiornato |
| Runtime | React | 19.1.0 | ✅ Aggiornato |
| Platform | Expo SDK | 54.0.32 | ✅ Latest |
| Language | JavaScript | ES2023 | ✅ OK |
| OCR Engine | ML Kit (Google) | 1.5.2 | ✅ OK |
| Camera | expo-camera | 17.0.10 | ✅ OK |
| Build Tool | Expo EAS CLI | ≥12.0.0 | ✅ Configurato |
| Bundler | Metro (via Expo) | Default | ✅ OK |

### File Critici

| File | Righe | Responsabilità |
|------|-------|----------------|
| `App.js` | 555 | **Core Application** - UI, State, Business Logic, OCR processing |
| `app.json` | 46 | Configurazione Expo - metadata app, permessi, asset |
| `eas.json` | 25 | Configurazione build EAS - profili dev/preview/production |
| `metro.config.js` | 16 | Configurazione bundler - fix minifier SDK 54 |
| `package.json` | 28 | Dipendenze e scripts npm |
| `babel.config.js` | 15 | Configurazione transpilazione |

### Metriche Codice

| Metrica | Valore |
|---------|--------|
| **Linee di codice totali** | ~650 LOC (JS/JSON) |
| **File JavaScript** | 3 (App.js + 2 config) |
| **Test coverage** | ❌ 0% - Nessun test suite presente |
| **Componenti React** | 1 (monolitico) |
| **Funzioni principali** | 12 |

---

## 4. DEBITI TECNICI & TECHNICAL DEBT

### 🔴 Critico

| Issue | Impatto | Mitigazione |
|-------|---------|-------------|
| **Single File Architecture** | 555 LOC in unico file rende manutenzione difficile, testing impossibile | Refactoring moduli separati |
| **Nessun Test Suite** | Zero unit test, zero integration test, zero E2E | Implementare Jest + React Native Testing Library |
| **No Error Boundaries** | Crash app non gestiti possono terminare esperienza utente | Aggiungere ErrorBoundary React |
| **Hardcoded Configuration** | Messaggi rapidi, regex pattern, stili inline | Estrarre in file config dedicati |

### 🟠 Alto

| Issue | Dettaglio |
|-------|-----------|
| **No Type Safety** | JavaScript puro, nessun TypeScript. Errori runtime probabili su tipi |
| **No State Management** | State locale sparso, potenziali inconsistenze con scaling |
| **OCR Locale Limitato** | ML Kit italiano dipende da modelli on-device (peso APK) |
| **No Analytics/Monitoring** | Zero visibility su utilizzo feature, crash reporting |
| **Deep Linking Fragile** | Dipendenza da app esterne (WA) senza fallback handling |

### 🟡 Medio

| Issue | Dettaglio |
|-------|-----------|
| **Stili Inline Pesanti** | StyleSheet monolitico (160+ righe), difficile override temi |
| **Magic Numbers** | Valori hardcoded (padding, colors, dimensions) |
| **No Internationalization** | Testi solo italiano, no i18n framework |
| **Clipboard Polling** | `AppState` listener potenzialmente inefficiente |

### 🟢 Basso

- Minor linter warnings (non verificato, presunto ESLint standard)
- Ottimizzazione immagini asset (PNG non compressi)

---

## 5. SECURITY AUDIT (Lightweight)

### Gestione Secrets

| Aspetto | Stato | Dettaglio |
|---------|-------|-----------|
| **API Keys** | ✅ N/A | Nessuna API key esterna utilizzata |
| **Hardcoded Secrets** | ✅ Nessuno | Codice pulito da credenziali |
| **Local Storage** | ✅ N/A | Nessun dato sensibile persistito |
| **Clipboard Data** | ⚠️ Monitorata | Solo numeri telefonici, no dati PII |

### Input Validation

| Input | Validazione | Stato |
|-------|-------------|-------|
| Phone Number | Regex `/[^0-9]/g` + length check | ✅ OK |
| OCR Text | Sanitizzazione implicita via regex | ✅ OK |
| Clipboard | Length filter 9-13 chars | ✅ OK |

### Autenticazione/Autorizzazione

**N/A** - L'app non richiede autenticazione utente. Zero auth layer.

### Dipendenze Vulnerabili

```bash
# Eseguire per verifica:
npm audit
# Stima: Expo SDK 54 è recente, vulnerabilità critiche improbabili
# ma va verificato prima del rilascio production
```

| Libreria | CVE Check | Stato |
|----------|-----------|-------|
| expo@54.0.32 | Da verificare | ⏳ Pendente |
| react-native@0.81.5 | Da verificare | ⏳ Pendente |
| ml-kit@1.5.2 | Native lib | ⏳ Pendente |

---

## 6. API & INTERFACCE

### Deep Links Esterni (App-to-App)

| Protocollo | URL Pattern | Scopo | Fallback |
|------------|-------------|-------|----------|
| WhatsApp | `https://wa.me/{number}?text={msg}` | Apri chat WA | Alert errore generico |
| Phone | `tel:{number}` | Avvia chiamata | Alert errore generico |

### Interfacce Interne

#### Funzioni Pubbliche (Export)

```javascript
// Entry Point
export default function App()

// Core Functions (internal scope)
formatNumber(num: string): string
openWhatsApp(num?: string, msg?: string): void
makeCall(num?: string): void
extractItalianMobileNumbers(text: string): Array<{number, type}>
startCamera(): Promise<void>
takePicture(): Promise<void>
checkClipboard(): Promise<void>
addToHistory(num: string): void
selectNumber(number: string): void
```

#### Schemi Dati

```javascript
// Detected Number Object
{
  number: string,  // E.g. "3331234567"
  type: "Destinatario" | "Mittente" | "Sconosciuto"
}

// History Array
string[]  // Max 5 elements, LIFO order

// App State
{
  phoneNumber: string,
  message: string,
  history: string[],
  showCamera: boolean,
  permission: PermissionResponse,
  isProcessing: boolean,
  flash: "on" | "off",
  clipboardNumber: string | null,
  showNumberPicker: boolean,
  detectedNumbers: Array<{number, type}>
}
```

### Breaking Changes

- **Nessuna** - Prima release, nessuna API deprecata.

---

## 7. BUILD & DEPLOYMENT

### Build System

| Componente | Tecnologia | Configurazione |
|------------|------------|----------------|
| **Bundler** | Metro (via Expo) | `metro.config.js` - fix minifier SDK 54 |
| **Compiler** | Babel | `babel.config.js` - preset expo |
| **Build Tool** | Expo EAS | `eas.json` - profili configurati |

### Configurazione EAS

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "apk" } }
  }
}
```

### CI/CD Pipeline

| Aspekto | Stato | Nota |
|---------|-------|------|
| **GitHub Actions** | ❌ Non configurato | **TODO IMMEDIATO** |
| **Automated Build** | ❌ Manuale EAS | Target: CI/CD self-hosted |
| **Code Quality** | ❌ Nessuno | Aggiungere linting, type check |
| **Test Automation** | ❌ Nessuno | Pipeline deve includere test |

### Ambienti

| Ambiente | Configurazione | Stato |
|----------|----------------|-------|
| **Development** | `expo start` locale | ✅ Attivo |
| **Preview** | EAS internal distribution | ✅ Configurato |
| **Production** | EAS build APK | ✅ Configurato |

### Containerizzazione

**N/A** - Mobile app nativa, non containerizzata.

---

## 8. SCALABILITY & PERFORMANCE

### Bottlenecks Identificati

| Componente | Issue | Impatto | Mitigazione |
|------------|-------|---------|-------------|
| **OCR Processing** | Sincrono su UI thread | Lag potenziale con immagini grandi | Spostare in Worker/Background |
| **Camera Preview** | No resolution limit | Batteria/consumo memoria | Aggiungere `pictureSize` limit |
| **History State** | Array in memoria | Max 5 elementi = trascurabile | Persistenza AsyncStorage? |
| **Clipboard Polling** | AppState listener | Trigger su ogni foreground | Debounce/check diff |

### Ottimizzazioni Presenti

| Ottimizzazione | Implementazione |
|----------------|-----------------|
| **Photo Quality** | `quality: 0.8` - bilanciamento qualità/dimensione |
| **Regex Early Exit** | `Set` per deduplicazione numeri |
| **Lazy Camera** | CameraView montato on-demand |
| **History Limit** | Max 5 elementi con `.slice(0, 5)` |

### Limiti Architetturali

| Limite | Descrizione |
|--------|-------------|
| **No Offline Storage** | Cronografia persa su reinstallazione |
| **No Sync** | Dati isolati per device |
| **Single User** | No multi-profile |
| **Locale Only** | OCR dipende da modelli locali (dimensione APK ~+15MB) |

---

## 9. DOCUMENTAZIONE ESISTENTE

| Documento | Stato | Valutazione |
|-----------|-------|-------------|
| **README.md** | ⚠️ Minimale | Solo titolo progetto, nessuna istruzione setup |
| **Code Comments** | ⚠️ Parziale | Funzioni OCR ben commentate, UI meno |
| **ADR** | ❌ Assenti | Nessun Architecture Decision Record |
| **API Docs** | N/A | Nessuna API esterna proprietaria |
| **This Document** | ✅ Completato | Tech Snapshot completo |

### Code Documentation

```javascript
// Esempio buona documentazione (presente)
const extractItalianMobileNumbers = (text) => {
  // Regex per numeri di cellulare italiani che iniziano con 3
  const phoneRegex = /(?:\+39|0039|39)?[\s.-]?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})/g;
  // ...
}

// Esempio carente (molti stili inline)
// Nessun JSDoc per componenti/funzioni principali
```

---

## 10. RACCOMANDAZIONI STRATEGICHE

### 🚨 Immediate (Questa settimana)

| Priorità | Task | Impatto | Sforzo |
|----------|------|---------|--------|
| 1 | **Setup CI/CD GitHub Actions** | 🔴 Alto | Medio - Build APK auto su push |
| 2 | **Generazione Keystore** | 🔴 Alto | Basso - `keytool` + secrets GH |
| 3 | `npm audit` + fix vulnerabilità | 🔴 Alto | Basso - Sicurezza baseline |
| 4 | **Aggiornamento Icona App** | 🟡 Medio | Basso - Asset design nuovo |

### 📅 Short-term (Questo mese)

| Priorità | Task | Impatto | Sforzo |
|----------|------|---------|--------|
| 5 | Implementare test suite base | 🔴 Alto | Alto - Jest + React Native Testing Library |
| 6 | Refactoring modularizzazione | 🟡 Medio | Alto - Separare UI/Logic/Utils |
| 7 | Aggiungere Error Boundaries | 🔴 Alto | Basso - Crash protection |
| 8 | Integrare Sentry/Crashlytics | 🟡 Medio | Medio - Monitoring errori |
| 9 | Setup TypeScript | 🟡 Medio | Medio - Type safety |

### 🎯 Long-term (Prossimo trimestre)

| Priorità | Task | Impatto | Sforzo |
|----------|------|---------|--------|
| 10 | Persistent storage (AsyncStorage) | 🟡 Medio | Medio - History permanente |
| 11 | Feature flags system | 🟢 Basso | Medio - A/B testing capability |
| 12 | iOS support (se richiesto) | 🟡 Medio | Alto - Test + build pipeline |
| 13 | OCR cloud fallback | 🟢 Basso | Alto - Backup se ML Kit fallisce |
| 14 | Analytics integration | 🟢 Basso | Medio - Usage tracking |

---

## APPENDICE

### A. Asset Checklist

| Asset | File | Stato |
|-------|------|-------|
| Icona App | `assets/icon.png` | ⚠️ Da aggiornare |
| Adaptive Icon | `assets/adaptive-icon.png` | ⚠️ Da aggiornare |
| Splash Screen | `assets/splash-icon.png` | ✅ OK |
| Favicon Web | `assets/favicon.png` | ✅ OK |

### B. Permessi Android

```xml
<!-- AndroidManifest.xml generato -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Nota:** `RECORD_AUDIO` incluso di default da expo-camera ma non utilizzato dall'app.

### C. Comandi Utili

```bash
# Development
npx expo start              # Avvio server sviluppo
npx expo start --android    # Avvio su emulatore Android
npx expo start --ios        # Avvio su simulatore iOS

# Build EAS (attuale - costo)
eas build --profile preview --platform android

# Build locale APK (target CI/CD)
# Vedere workflow GitHub Actions da implementare
```

### D. CI/CD GitHub Actions Template (Da Implementare)

```yaml
# .github/workflows/build-android.yml (suggerimento)
name: Build Android APK
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test  # Aggiungere test prima
      - run: eas build --local --platform android --profile preview
        env:
          EAS_LOCAL_BUILD_ARTIFACTS_DIR: ./artifacts
```

---

## Riepilogo Stato Progetto

| Categoria | Valutazione | Trend |
|-----------|-------------|-------|
| **Codice** | 🟡 Funzionale ma monolitico | 📈 Migliorabile |
| **Sicurezza** | 🟢 Buono (superficie d'attacco ridotta) | ✅ Stabile |
| **Testing** | 🔴 Assente | 📉 Critico |
| **DevOps** | 🟡 EAS configurato, manca CI/CD | 📈 In progress |
| **Documentazione** | 🟡 Questo doc compensa carenze | 📈 Migliorato |
| **Manutenibilità** | 🟡 Debito tecnico gestibile | 📈 Refactoring needed |

---

> **Prossima Review Consigliata:** Post-implementazione CI/CD e refactoring modulare.
> 
> **Document Owner:** Principal Software Architect  
> **Last Updated:** 2026-01-31
