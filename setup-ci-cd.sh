#!/bin/bash
# Setup completo CI/CD per FlashChat Pro
# Genera keystore e mostra istruzioni precise per GitHub

set -e

KEYSTORE_FILE="flashchat-pro.keystore"
KEYSTORE_PASS="flashchat2024"
KEY_ALIAS="flashchat"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       FlashChat Pro - Setup CI/CD GitHub Actions        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Genera keystore se non esiste
if [ -f "$KEYSTORE_FILE" ]; then
    echo "✅ Keystore già esistente: $KEYSTORE_FILE"
    read -p "Vuoi rigenerarlo? (s/N): " regen
    if [[ $regen =~ ^[Ss]$ ]]; then
        rm "$KEYSTORE_FILE"
        echo "🔄 Rigenerazione..."
    else
        echo "📝 Uso keystore esistente"
    fi
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "🔐 Generazione keystore Android..."
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=FlashChat Pro, OU=Mobile, O=FlashChat, L=Milan, ST=Italy, C=IT" \
        -storepass "$KEYSTORE_PASS" \
        -keypass "$KEYSTORE_PASS"
    echo "✅ Keystore generato!"
fi

# Step 2: Genera base64
echo ""
echo "📦 Conversione in base64..."
B64_CONTENT=$(base64 -w 0 "$KEYSTORE_FILE")
B64_LENGTH=${#B64_CONTENT}

echo "✅ Base64 generato ($B64_LENGTH caratteri)"

# Step 3: Salva in file
B64_FILE="flashchat-pro.keystore.b64"
echo "$B64_CONTENT" > "$B64_FILE"

# Step 4: Mostra istruzioni
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           📋 CONFIGURAZIONE GITHUB SECRETS              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 Apri questo link:"
echo "   https://github.com/andreaandretta/FlashChat-Pro/settings/secrets/actions"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""
echo "1️⃣  Crea il secret: ANDROID_KEYSTORE_BASE64"
echo ""
echo "   Metodo A - Copia dal file (consigliato):"
echo "   $ cat $B64_FILE | xclip -selection clipboard"
echo "   (poi incolla nel campo Value su GitHub)"
echo ""
echo "   Metodo B - Il base64 è stato salvato in: $B64_FILE"
echo "   Apri il file e copia TUTTO il contenuto"
echo ""
echo "   ⚠️  IMPORTANTE:"
echo "   • Deve essere UNA SOLA riga lunghissima"
echo "   • NO spazi all'inizio o alla fine"
echo "   • NO virgolette"
echo "   • NO newline"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""
echo "2️⃣  Crea gli altri 3 secrets:"
echo ""
echo "   ┌─────────────────────┬──────────────────┐"
echo "   │ Secret Name         │ Value            │"
echo "   ├─────────────────────┼──────────────────┤"
echo "   │ KEYSTORE_PASSWORD   │ $KEYSTORE_PASS   │"
echo "   │ KEY_ALIAS           │ $KEY_ALIAS       │"
echo "   │ KEY_PASSWORD        │ $KEYSTORE_PASS   │"
echo "   └─────────────────────┴──────────────────┘"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Step 5: Verifica locale
echo "3️⃣  Verifica locale:"
if keytool -list -keystore "$KEYSTORE_FILE" -storepass "$KEYSTORE_PASS" >/dev/null 2>&1; then
    echo "   ✅ Keystore valido"
else
    echo "   ❌ Keystore corrotto!"
    exit 1
fi

# Verifica base64 decodifica
if echo "$B64_CONTENT" | base64 --decode > /tmp/test.keystore 2>/dev/null; then
    if keytool -list -keystore /tmp/test.keystore -storepass "$KEYSTORE_PASS" >/dev/null 2>&1; then
        echo "   ✅ Base64 valido (decode OK)"
    else
        echo "   ⚠️  Base64 decodifica ma keystore invalido"
    fi
    rm -f /tmp/test.keystore
else
    echo "   ❌ Base64 corrotto!"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                      ✅ FATTO!                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Prossimi passi:"
echo "   1. Configura i 4 secrets su GitHub (vedi sopra)"
echo "   2. Vai su Actions → Build Android APK → Run workflow"
echo "   3. Scarica l'APK dagli artifacts"
echo ""
echo "🚀 Per testare subito:"
echo "   git add . && git commit -m \"Setup CI/CD\" && git push"
echo ""
echo "📁 Files generati:"
echo "   • $KEYSTORE_FILE (🔒 NON committare!)"
echo "   • $B64_FILE (🗑️ puoi cancellarlo dopo aver copiato)"
echo ""

# Aggiungi a .gitignore se non c'è
if ! grep -q "$KEYSTORE_FILE" .gitignore 2>/dev/null; then
    echo "$KEYSTORE_FILE" >> .gitignore
    echo "$B64_FILE" >> .gitignore
    echo "✅ Aggiunto a .gitignore"
fi
