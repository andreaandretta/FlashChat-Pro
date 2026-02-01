# 🚀 Setup CI/CD - Istruzioni Passo-Passo

Questa guida risolve l'errore `missing required GitHub Actions secrets`.

---

## ❌ Errore che stai vedendo

```
Your job failed due to missing required GitHub Actions secrets:
- ANDROID_KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD
```

**Causa:** I secrets non sono stati caricati su GitHub, oppure sono stati copiati male.

---

## ✅ Soluzione Completa

### STEP 1: Genera il Keystore (io lo faccio per te)

Esegui in terminal:

```bash
./setup-ci-cd.sh
```

Questo script:
1. Genera il file `flashchat-pro.keystore`
2. Crea la versione base64 in `flashchat-pro.keystore.b64`
3. Mostra le istruzioni precise

**Output atteso:**
```
✅ Keystore generato!
✅ Base64 generato (XXXX caratteri)
```

---

### STEP 2: Copia il Base64 (ATTENZIONE!)

Questo è il punto dove tutti sbagliano. **Devi copiare ESATTAMENTE così:**

#### Metodo A: Comando rapido (se hai `xclip`)

```bash
cat flashchat-pro.keystore.b64 | xclip -selection clipboard
```

Poi vai su GitHub e incolla.

#### Metodo B: Manuale sicuro

```bash
# Mostra il contenuto
cat flashchat-pro.keystore.b64

# Seleziona TUTTO con il mouse (è una riga lunghissima)
# Copia (Ctrl+C)
```

⚠️ **IMPORTANTISSIMO:**
- Il base64 è **UNA SOLA RIGA** (anche se sembra che vada a capo nel terminale)
- NON aggiungere spazi
- NON aggiungere virgolette `"`
- NON aggiungere newline

---

### STEP 3: Aggiungi i Secrets su GitHub

Vai su: **https://github.com/andreaandretta/FlashChat-Pro/settings/secrets/actions**

Clicca **"New repository secret"** per ognuno di questi:

#### Secret #1: ANDROID_KEYSTORE_BASE64

| Campo | Valore |
|-------|--------|
| **Name** | `ANDROID_KEYSTORE_BASE64` |
| **Value** | Incolla il contenuto di `flashchat-pro.keystore.b64` (tutta la riga!) |

#### Secret #2: KEYSTORE_PASSWORD

| Campo | Valore |
|-------|--------|
| **Name** | `KEYSTORE_PASSWORD` |
| **Value** | `flashchat2024` |

#### Secret #3: KEY_ALIAS

| Campo | Valore |
|-------|--------|
| **Name** | `KEY_ALIAS` |
| **Value** | `flashchat` |

#### Secret #4: KEY_PASSWORD

| Campo | Valore |
|-------|--------|
| **Name** | `KEY_PASSWORD` |
| **Value** | `flashchat2024` |

---

### STEP 4: Verifica

Dovresti vedere questa lista su GitHub:

```
Repository secrets
├── ANDROID_KEYSTORE_BASE64  ✅
├── KEYSTORE_PASSWORD        ✅
├── KEY_ALIAS                ✅
└── KEY_PASSWORD             ✅
```

---

### STEP 5: Testa il Build

1. Vai su: **https://github.com/andreaandretta/FlashChat-Pro/actions**
2. Clicca su: **"🚀 Build Android APK"**
3. Clicca: **"Run workflow"** → **"Run workflow"**
4. Attendi ~5-10 minuti
5. Scarica l'APK dalla sezione "Artifacts"

---

## 🔧 Debug - Se ancora fallisce

### Errore: "Invalid base64 input"

**Causa:** Hai copiato il base64 male (con newline o spazi).

**Fix:**
```bash
# Rigenera pulito
rm flashchat-pro.keystore.b64
base64 -w 0 flashchat-pro.keystore > flashchat-pro.keystore.b64

# Ora copia di nuovo su GitHub (update secret)
```

### Errore: "Keystore was tampered with"

**Causa:** Password sbagliata nel secret.

**Fix:** Verifica che `KEYSTORE_PASSWORD` e `KEY_PASSWORD` siano entrambi: `flashchat2024`

---

## 📁 Files Importanti

| File | Descrizione | Committare? |
|------|-------------|-------------|
| `flashchat-pro.keystore` | Chiave privata di firma | ❌ NO - Secret! |
| `flashchat-pro.keystore.b64` | Versione base64 | ❌ NO - Cancellalo dopo |
| `.github/workflows/build-android.yml` | Pipeline CI/CD | ✅ SÌ |

---

## 🎯 Riepilogo Rapido

```bash
# 1. Genera keystore e base64
./setup-ci-cd.sh

# 2. Copia su GitHub i 4 secrets (vedi STEP 3 sopra)

# 3. Committa il workflow
git add .github/workflows/build-android.yml
git commit -m "Add Android CI/CD pipeline"
git push

# 4. Triggera build su GitHub Actions
```

---

**Se ancora non funziona, mandami:**
1. Screenshot della pagina secrets su GitHub (con i nomi censurati)
2. Il log completo dell'errore GitHub Actions
