import { useState, useEffect } from 'react';
import { Lunar } from 'lunar-javascript';

/**
 * Custom Hook untuk menghitung kalender Imlek (Lunar Whisper)
 * Digunakan untuk mengetahui tanggal Ce It (1) dan Cap Go (15) 
 * tanpa memerlukan koneksi internet (Zero External API).
 */
export const useLunar = () => {
  const [lunarInfo, setLunarInfo] = useState({
    isSembahyangDay: false,
    lunarDateStr: '',
    daysToNextEvent: 0,
    nextEventName: '',
    currentEventName: null
  });

  useEffect(() => {
    try {
      const today = Lunar.fromDate(new Date());
      const day = today.getDay();
      const month = today.getMonth();
      
      // Kalkulasi hari menuju event (Ce It / Cap Go) berikutnya
      let cursor = today;
      let counter = 0;
      // Jarak maksimal ke event berikutnya adalah 15 hari
      while (counter < 31) {
        if (counter > 0 && (cursor.getDay() === 1 || cursor.getDay() === 15)) {
          break;
        }
        cursor = cursor.next(1);
        counter++;
      }
      
      const nextEvent = cursor.getDay() === 1 ? 'Ce It' : 'Cap Go';
      const currentEvent = day === 1 ? 'Ce It' : (day === 15 ? 'Cap Go' : null);

      setLunarInfo({
        isSembahyangDay: (day === 1 || day === 15),
        lunarDateStr: `${day} bulan ${month} Imlek`,
        daysToNextEvent: counter,
        nextEventName: nextEvent,
        currentEventName: currentEvent
      });
    } catch (error) {
      console.error("Gagal menghitung kalender Lunar:", error);
    }
  }, []);

  return lunarInfo;
};
