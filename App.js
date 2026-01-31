import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Linking, Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions, AppState, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import TextRecognition from '@react-native-ml-kit/text-recognition';

const { width } = Dimensions.get('window');

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState('off');
  const [clipboardNumber, setClipboardNumber] = useState(null);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [detectedNumbers, setDetectedNumbers] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => {
    checkClipboard();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkClipboard();
      }
    });
    return () => subscription.remove();
  }, []);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        const clean = text.replace(/[^0-9]/g, '');
        if (clean.length >= 9 && clean.length <= 13) {
          setClipboardNumber(clean);
        } else {
          setClipboardNumber(null);
        }
      }
    } catch (e) {
      console.log("Clipboard error", e);
    }
  };

  const quickMessages = [
    "Ciao! Sono il corriere, sono sotto casa.",
    "Buongiorno, ho un pacco per lei. C'è qualcuno?",
    "Le ho lasciato il pacco in portineria.",
    "Purtroppo non ho trovato nessuno, ripasso domani."
  ];

  const formatNumber = (num) => {
    if (!num) return '';
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('00')) {
      return clean.substring(2);
    }
    return clean;
  };

  const openWhatsApp = (num = phoneNumber, msg = message) => {
    const formatted = formatNumber(num);
    if (!formatted || formatted.length < 8) {
      Alert.alert("Errore", "Inserisci un numero di telefono valido.");
      return;
    }
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert("Errore", "Impossibile aprire WhatsApp."));
    addToHistory(formatted);
  };

  const makeCall = (num = phoneNumber) => {
    const formatted = formatNumber(num);
    if (!formatted || formatted.length < 8) {
      Alert.alert("Errore", "Inserisci un numero di telefono valido.");
      return;
    }
    const url = `tel:${formatted}`;
    Linking.openURL(url).catch(() => Alert.alert("Errore", "Impossibile avviare la chiamata."));
    addToHistory(formatted);
  };

  const addToHistory = (num) => {
    if (!num) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item !== num);
      return [num, ...filtered].slice(0, 5);
    });
  };

  const startCamera = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permesso negato", "L'app ha bisogno della fotocamera per funzionare.");
        return;
      }
    }
    setShowCamera(true);
  };

  const extractItalianMobileNumbers = (text) => {
    // Regex per numeri di cellulare italiani che iniziano con 3
    const phoneRegex = /(?:\+39|0039|39)?[\s.-]?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})/g;
    
    // Normalizziamo il testo per facilitare la ricerca di parole chiave
    const normalizedText = text.toLowerCase();
    
    const numbers = [];
    const seen = new Set();
    let match;

    while ((match = phoneRegex.exec(text)) !== null) {
      const mobileNumber = match[1] + match[2] + match[3];
      
      if (mobileNumber.length === 10 && mobileNumber.startsWith('3')) {
        if (!seen.has(mobileNumber)) {
          seen.add(mobileNumber);
          
          // Cerchiamo il contesto intorno al numero (circa 50 caratteri prima)
          const index = match.index;
          const context = normalizedText.substring(Math.max(0, index - 60), index);
          
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

    // Ordiniamo mettendo i destinatari per primi
    return numbers.sort((a, b) => {
      if (a.type === 'Destinatario' && b.type !== 'Destinatario') return -1;
      if (a.type !== 'Destinatario' && b.type === 'Destinatario') return 1;
      return 0;
    });
  };

  const selectNumber = (number) => {
    setPhoneNumber(number);
    setShowNumberPicker(false);
    setDetectedNumbers([]);
    setShowCamera(false);
    Alert.alert("Numero Selezionato", `Il numero ${number} è stato inserito.`);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      const result = await TextRecognition.recognize(photo.uri);

      if (result && result.text) {
        console.log("OCR Result:", result.text);

        const foundNumbers = extractItalianMobileNumbers(result.text);

        if (foundNumbers.length === 0) {
          Alert.alert(
            "Nessun Numero Trovato",
            "Non è stato trovato nessun numero di cellulare italiano (che inizia con 3). Inquadra meglio l'etichetta."
          );
        } else if (foundNumbers.length === 1) {
          // Un solo numero trovato, usalo direttamente
          setPhoneNumber(foundNumbers[0].number);
          setShowCamera(false);
          Alert.alert("Numero Rilevato", `Il numero ${foundNumbers[0].number} è stato estratto.`);
        } else {
          // Più numeri trovati, mostra il menu di selezione
          setDetectedNumbers(foundNumbers);
          setShowNumberPicker(true);
        }
      } else {
        Alert.alert("OCR", "Impossibile leggere il testo. Riprova.");
      }
    } catch (e) {
      console.log("OCR Error", e);
      Alert.alert("Errore OCR", "Assicurati di aver installato i moduli ML Kit correttamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={flash === 'on'}
        />
        
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.flashButton} 
            onPress={() => setFlash(prev => prev === 'off' ? 'on' : 'off')}
          >
            <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.scannerFrame}>
            <View style={styles.frame} />
            <Text style={styles.scanText}>Inquadra l'etichetta e premi il tasto bianco per l'OCR intelligente</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={takePicture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeCamera} onPress={() => setShowCamera(false)}>
          <Ionicons name="close-circle" size={50} color="white" />
        </TouchableOpacity>

        {/* Modal per la selezione del numero */}
        <Modal
          visible={showNumberPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Numeri Trovati</Text>
              <Text style={styles.modalSubtitle}>Seleziona il numero del destinatario:</Text>
              
              <ScrollView style={{maxHeight: 300}}>
                {detectedNumbers.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.numberOption, 
                      item.type === 'Destinatario' && styles.destinatarioOption
                    ]}
                    onPress={() => selectNumber(item.number)}
                  >
                    <View>
                      <Text style={styles.numberOptionText}>{item.number}</Text>
                      <Text style={styles.numberOptionType}>{item.type}</Text>
                    </View>
                    {item.type === 'Destinatario' && (
                      <Ionicons name="star" size={20} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowNumberPicker(false)}
              >
                <Text style={styles.closeModalText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ FlashChat PRO</Text>
        <Text style={styles.subLogo}>Strumento Corriere</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {clipboardNumber && clipboardNumber !== phoneNumber && (
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <Ionicons name="copy-outline" size={18} color="#25D366" />
              <Text style={styles.widgetTitle}>NUMERO COPIATO</Text>
            </View>
            <View style={styles.widgetBody}>
              <Text style={styles.widgetNumber}>+{clipboardNumber}</Text>
              <TouchableOpacity 
                style={styles.widgetButton} 
                onPress={() => {
                  setPhoneNumber(clipboardNumber);
                  setClipboardNumber(null);
                }}
              >
                <Text style={styles.widgetButtonText}>USA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.inputHeader}>
            <Text style={styles.label}>NUMERO DESTINATARIO:</Text>
            <TouchableOpacity onPress={startCamera}>
              <Ionicons name="camera" size={32} color="#25D366" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Es: 333 123 4567"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.button, styles.whatsappButton, !phoneNumber && {opacity: 0.5}]} 
              onPress={() => openWhatsApp()}
              disabled={!phoneNumber}
            >
              <Ionicons name="logo-whatsapp" size={20} color="white" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>WHATSAPP</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.callButton, !phoneNumber && {opacity: 0.5}]} 
              onPress={() => makeCall()}
              disabled={!phoneNumber}
            >
              <Ionicons name="call" size={20} color="white" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>CHIAMA</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>MESSAGGI RAPIDI</Text>
        <View style={styles.quickMsgContainer}>
          {quickMessages.map((msg, index) => (
            <TouchableOpacity key={index} style={styles.quickMsgBadge} onPress={() => {
              openWhatsApp(phoneNumber, msg);
            }}>
              <Text style={styles.quickMsgText}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>ULTIMI CONTATTATI</Text>
            {history.map((num, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyText}>+{num}</Text>
                <View style={{flexDirection: 'row'}}>
                  <TouchableOpacity onPress={() => openWhatsApp(num)} style={styles.miniButton}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => makeCall(num)} style={styles.miniButton}>
                    <Ionicons name="call" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 25, 
    backgroundColor: '#075E54', 
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: { fontSize: 26, fontWeight: '900', color: 'white' },
  subLogo: { fontSize: 13, color: '#DCF8C6', marginTop: 5 },
  scrollContent: { padding: 20 },
  card: { 
    backgroundColor: 'white', 
    padding: 25, 
    borderRadius: 25, 
    marginBottom: 25, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12
  },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  input: { 
    backgroundColor: '#F0F2F5', 
    borderRadius: 15, 
    padding: 18, 
    fontSize: 22, 
    marginBottom: 20, 
    color: '#075E54',
    fontWeight: '600'
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 0.48, padding: 18, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  whatsappButton: { backgroundColor: '#25D366' },
  callButton: { backgroundColor: '#128C7E' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#075E54', marginBottom: 15, marginTop: 10 },
  quickMsgContainer: { marginBottom: 20 },
  quickMsgBadge: { 
    backgroundColor: 'white', 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 12, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  quickMsgText: { color: '#075E54', fontSize: 15 },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: 'white', 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 10, 
    elevation: 2 
  },
  historyText: { fontSize: 17, fontWeight: '600', color: '#333' },
  miniButton: { padding: 8, marginLeft: 10 },
  widgetCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  widgetTitle: { fontSize: 11, fontWeight: '900', color: '#2E7D32', marginLeft: 6, letterSpacing: 1 },
  widgetBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  widgetNumber: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  widgetButton: { backgroundColor: '#25D366', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  widgetButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: width * 0.8, height: 200, justifyContent: 'center', alignItems: 'center' },
  frame: { width: '100%', height: '100%', borderWidth: 2, borderColor: '#25D366', borderRadius: 15 },
  scanText: { color: 'white', fontSize: 14, marginTop: 20, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  closeCamera: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  flashButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    width: '100%',
    elevation: 10
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075E54',
    textAlign: 'center',
    marginBottom: 10
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  numberOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  destinatarioOption: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderColor: '#25D366',
    borderWidth: 1,
  },
  numberOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  numberOptionType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  closeModalButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center'
  },
  closeModalText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16
  }
});
