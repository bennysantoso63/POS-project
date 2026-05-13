import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BarcodePrintModal({ product, onClose }) {
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (product?.sku || product?.barcode) {
      const generate = async () => {
        try {
          const text = product.barcode || product.sku;
          const dataUrl = await window.api.generateBarcode(text);
          setBarcodeImage(dataUrl);
        } catch (err) {
          console.error("Gagal generate barcode:", err);
          toast.error("Gagal membuat barcode");
        } finally {
          setLoading(false);
        }
      };
      generate();
    }
  }, [product]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Barcode - ${product.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              font-family: sans-serif;
            }
            .label {
              border: 1px solid #ccc;
              padding: 20px;
              text-align: center;
              width: 300px;
            }
            img { width: 100%; height: auto; }
            .name { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
            .price { font-size: 18px; font-weight: 900; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${product.name}</div>
            <img src="${barcodeImage}" />
            <div class="price">Rp ${product.price_retail.toLocaleString('id-ID')}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(product.barcode || product.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Kode produk disalin");
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div className="bg-brand-card w-full max-w-md rounded-[3rem] border border-brand-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-10 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Label <span className="text-brand-primary">Barcode</span></h2>
            <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mt-2">Pratinjau cetak untuk label produk</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        <div className="p-12 flex flex-col items-center">
          <div className="w-full bg-white p-10 rounded-[2.5rem] border border-brand-border flex flex-col items-center shadow-inner mb-10">
             <p className="text-black font-bold text-center text-sm mb-6 leading-tight">{product.name}</p>
             
             {loading ? (
               <div className="h-24 w-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
               </div>
             ) : (
               <img src={barcodeImage} alt="Barcode" className="max-w-full h-auto" />
             )}

             <p className="text-black font-black text-2xl tracking-tighter mt-6">Rp {product.price_retail.toLocaleString('id-ID')}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full">
            <button 
              onClick={handleCopy}
              className="flex items-center justify-center gap-4 px-8 py-5 bg-brand-card border border-brand-border text-brand-text rounded-3xl font-bold text-[10px] tracking-widest hover:border-brand-primary transition-all active:scale-95"
            >
              {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />} 
              {copied ? 'SALIN BERHASIL' : 'SALIN KODE'}
            </button>
            <button 
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center justify-center gap-4 px-8 py-5 bg-brand-primary text-white rounded-3xl font-bold text-[10px] tracking-widest hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 active:scale-95 disabled:opacity-50"
            >
              <Printer size={18} /> CETAK LABEL
            </button>
          </div>
        </div>

        <div className="p-8 bg-brand-bg/50 border-t border-brand-border text-center">
           <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.3em] opacity-40">Standard Code-128 Generator • Ling-Ling POS</p>
        </div>
      </div>
    </div>
  );
}
