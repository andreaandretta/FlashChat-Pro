/**
 * FlashChat Pro - Asset Generator
 * Genera icone app programmaticamente usando node-canvas
 * 
 * Esegui con: node generate-assets.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Colori del brand
const WHATSAPP_GREEN = '#25D366';
const WHITE = '#FFFFFF';

/**
 * Disegna un fulmine stilizzato (simbolo "Flash")
 */
function drawLightningBolt(ctx, centerX, centerY, size) {
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  
  // Fulmine stilizzato - design moderno e riconoscibile
  const scale = size / 100;
  
  // Coordinate del fulmine (design custom)
  const points = [
    { x: 55, y: 5 },    // Punta superiore destra
    { x: 25, y: 45 },   // Rientro sinistro alto
    { x: 42, y: 45 },   // Punto interno alto
    { x: 15, y: 95 },   // Punta inferiore sinistra
    { x: 50, y: 55 },   // Rientro destro basso
    { x: 35, y: 55 },   // Punto interno basso
  ];
  
  // Trasla e scala i punti
  const translatedPoints = points.map(p => ({
    x: centerX + (p.x - 50) * scale,
    y: centerY + (p.y - 50) * scale
  }));
  
  ctx.moveTo(translatedPoints[0].x, translatedPoints[0].y);
  for (let i = 1; i < translatedPoints.length; i++) {
    ctx.lineTo(translatedPoints[i].x, translatedPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Aggiungi un leggero effetto ombra/glow
  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
  ctx.shadowBlur = size * 0.05;
  ctx.fill();
  ctx.shadowBlur = 0;
}

/**
 * Disegna una piccola icona chat accanto al fulmine
 */
function drawChatBubble(ctx, x, y, size) {
  ctx.fillStyle = WHITE;
  ctx.globalAlpha = 0.9;
  
  const bubbleWidth = size * 0.35;
  const bubbleHeight = size * 0.25;
  const radius = size * 0.06;
  
  // Bolla chat arrotondata
  ctx.beginPath();
  ctx.roundRect(
    x - bubbleWidth / 2,
    y - bubbleHeight / 2,
    bubbleWidth,
    bubbleHeight,
    radius
  );
  ctx.fill();
  
  // Triangolino della bolla (punta verso il basso a sinistra)
  ctx.beginPath();
  ctx.moveTo(x - bubbleWidth * 0.25, y + bubbleHeight / 2 - 2);
  ctx.lineTo(x - bubbleWidth * 0.4, y + bubbleHeight / 2 + size * 0.08);
  ctx.lineTo(x - bubbleWidth * 0.05, y + bubbleHeight / 2 - 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.globalAlpha = 1;
}

/**
 * Genera l'icona standard (1024x1024)
 */
function generateIcon(outputPath) {
  const SIZE = 1024;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  
  // Sfondo verde WhatsApp
  ctx.fillStyle = WHATSAPP_GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);
  
  // Cerchio bianco semi-trasparente come decorazione sottile
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE * 0.42, 0, Math.PI * 2);
  ctx.fill();
  
  // Fulmine principale (centrato, grande)
  drawLightningBolt(ctx, SIZE / 2, SIZE / 2, SIZE * 0.65);
  
  // Piccola bolla chat in alto a destra
  drawChatBubble(ctx, SIZE * 0.72, SIZE * 0.28, SIZE * 0.5);
  
  // Salva il file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generato: ${outputPath}`);
}

/**
 * Genera l'icona adattiva per Android (1024x1024)
 * L'icona adattiva ha più padding perché Android la ritaglia
 */
function generateAdaptiveIcon(outputPath) {
  const SIZE = 1024;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  
  // Sfondo verde WhatsApp (copre tutto per safe zone)
  ctx.fillStyle = WHATSAPP_GREEN;
  ctx.fillRect(0, 0, SIZE, SIZE);
  
  // Per le icone adattive, il contenuto deve stare nel 66% centrale
  // per evitare che venga tagliato dalle varie maschere Android
  const safeZone = SIZE * 0.66;
  const padding = (SIZE - safeZone) / 2;
  
  // Cerchio decorativo (più piccolo)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, safeZone * 0.45, 0, Math.PI * 2);
  ctx.fill();
  
  // Fulmine (più piccolo per stare nella safe zone)
  drawLightningBolt(ctx, SIZE / 2, SIZE / 2, safeZone * 0.55);
  
  // Bolla chat (riposizionata nella safe zone)
  drawChatBubble(ctx, SIZE / 2 + safeZone * 0.22, SIZE / 2 - safeZone * 0.22, safeZone * 0.45);
  
  // Salva il file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generato: ${outputPath}`);
}

/**
 * Genera la splash icon (più semplice, solo fulmine)
 */
function generateSplashIcon(outputPath) {
  const SIZE = 1024;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  
  // Sfondo trasparente per la splash (il colore viene da app.json)
  ctx.clearRect(0, 0, SIZE, SIZE);
  
  // Solo il fulmine bianco, centrato
  drawLightningBolt(ctx, SIZE / 2, SIZE / 2, SIZE * 0.5);
  
  // Salva il file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generato: ${outputPath}`);
}

/**
 * Genera favicon per web (piccola, semplificata)
 */
function generateFavicon(outputPath) {
  const SIZE = 48;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  
  // Sfondo verde
  ctx.fillStyle = WHATSAPP_GREEN;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Fulmine semplificato (per dimensioni piccole)
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  const scale = SIZE / 100;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  
  // Fulmine semplificato per favicon
  ctx.moveTo(cx + 10 * scale, cy - 35 * scale);
  ctx.lineTo(cx - 15 * scale, cy + 5 * scale);
  ctx.lineTo(cx + 2 * scale, cy + 5 * scale);
  ctx.lineTo(cx - 10 * scale, cy + 35 * scale);
  ctx.lineTo(cx + 15 * scale, cy - 5 * scale);
  ctx.lineTo(cx - 2 * scale, cy - 5 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Salva il file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generato: ${outputPath}`);
}

// === MAIN ===
function main() {
  const assetsDir = path.join(__dirname, 'assets');
  
  // Assicurati che la cartella assets esista
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  console.log('🎨 FlashChat Pro - Generazione Assets\n');
  console.log('📁 Cartella output:', assetsDir);
  console.log('');
  
  // Genera tutti gli asset
  generateIcon(path.join(assetsDir, 'icon.png'));
  generateAdaptiveIcon(path.join(assetsDir, 'adaptive-icon.png'));
  generateSplashIcon(path.join(assetsDir, 'splash-icon.png'));
  generateFavicon(path.join(assetsDir, 'favicon.png'));
  
  console.log('\n✨ Tutti gli asset sono stati generati con successo!');
  console.log('   Colore brand: ' + WHATSAPP_GREEN + ' (Verde WhatsApp)');
  console.log('   Design: Fulmine + Chat bubble');
}

main();
