#!/bin/bash
# Script per verificare che i secrets GitHub siano configurati correttamente
# Esegui in locale prima del push

echo "=================================="
echo "🔐 VERIFICA GITHUB SECRETS"
echo "=================================="
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Valori attesi (modifica se hai usato password diverse)
EXPECTED_KEYSTORE="flashchat-pro.keystore"
EXPECTED_ALIAS="flashchat"

echo "1️⃣  Controllo keystore locale..."
if [ -f "$EXPECTED_KEYSTORE" ]; then
    echo -e "${GREEN}✅ Keystore trovato: $EXPECTED_KEYSTORE${NC}"
    
    # Verifica validità keystore
    if keytool -list -keystore "$EXPECTED_KEYSTORE" -storepass flashchat2024 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Keystore valido${NC}"
    else
        echo -e "${RED}❌ Keystore corrotto o password errata${NC}"
    fi
else
    echo -e "${RED}❌ Keystore NON trovato: $EXPECTED_KEYSTORE${NC}"
    echo "   Esegui prima: ./generate-keystore.sh"
fi

echo ""
echo "2️⃣  Generazione base64 per copia..."
if [ -f "$EXPECTED_KEYSTORE" ]; then
    # Genera base64 senza newline (-w 0)
    B64_CONTENT=$(base64 -w 0 "$EXPECTED_KEYSTORE")
    B64_LENGTH=${#B64_CONTENT}
    
    echo -e "${GREEN}✅ Base64 generato${NC}"
    echo "   Lunghezza: $B64_LENGTH caratteri"
    echo ""
    echo "📋 COPIA QUESTO NEIL SECRET ANDROID_KEYSTORE_BASE64:"
    echo "─────────────────────────────────────────────────────────"
    echo "$B64_CONTENT"
    echo "─────────────────────────────────────────────────────────"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   - Copia TUTTA la riga sopra (è lunga!)"
    echo "   - Deve essere UNA SOLA riga, senza spazi extra"
    echo "   - Non aggiungere virgolette"
    echo ""
fi

echo ""
echo "3️⃣  Istruzioni per GitHub:"
echo "─────────────────────────────────────────────────────────"
echo "Vai su: https://github.com/andreaandretta/FlashChat-Pro/settings/secrets/actions"
echo ""
echo "Crea questi 4 secrets:"
echo ""
echo "┌──────────────────────────┬──────────────────────────────┐"
echo "│ Secret Name              │ Value                        │"
echo "├──────────────────────────┼──────────────────────────────┤"
echo "│ ANDROID_KEYSTORE_BASE64  │ (copia base64 sopra)         │"
echo "│ KEYSTORE_PASSWORD        │ flashchat2024                │"
echo "│ KEY_ALIAS                │ flashchat                    │"
echo "│ KEY_PASSWORD             │ flashchat2024                │"
echo "└──────────────────────────┴──────────────────────────────┘"
echo ""
echo "─────────────────────────────────────────────────────────"
