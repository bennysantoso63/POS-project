/**
 * LING-LING POS - STRUCTURED LOGGER
 * Fokus: Observabilitas sistem asinkron
 */
export const Logger = {
  info: (context, message, metadata = {}) => {
    console.log(JSON.stringify({ 
      level: 'INFO', 
      context, 
      message, 
      timestamp: new Date().toISOString(), 
      ...metadata 
    }));
  },
  error: (context, message, error) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      context, 
      message, 
      error: error?.message || error, 
      timestamp: new Date().toISOString() 
    }));
  }
};
