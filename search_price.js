const fs = require('fs');
const content = fs.readFileSync('c:/Users/wewe/.gemini/antigravity/scratch/barcode-sistem/src/components/CashierView.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('price_retail') || line.includes('price_wholesale') || line.includes('price_online')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
