/**
 * Printer configuration utilities for thermal printing
 */

export interface PrinterSettings {
  paper_width: string;
  page_size: number;
  font_size: number;
  delivery_font_size: number;
  scale: number;
  margin_left: number;
  margin_top: number;
  margin_bottom: number;
  auto_print_delivery?: boolean;
}

export const defaultPrinterSettings: PrinterSettings = {
  paper_width: '80mm',
  page_size: 300,
  font_size: 14,
  delivery_font_size: 14,
  scale: 1,
  margin_left: 0,
  margin_top: 1,
  margin_bottom: 1,
  auto_print_delivery: false
};

/**
 * Load printer settings from localStorage
 */
export const loadPrinterSettings = (): PrinterSettings => {
  try {
    const savedSettings = localStorage.getItem('pdv_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.printer_layout) {
        return { ...defaultPrinterSettings, ...settings.printer_layout };
      }
    }
  } catch (error) {
    console.error('Error loading printer settings:', error);
  }
  return defaultPrinterSettings;
};

/**
 * Save printer settings to localStorage
 */
export const savePrinterSettings = (settings: PrinterSettings): void => {
  try {
    const currentSettings = localStorage.getItem('pdv_settings');
    const pdvSettings = currentSettings ? JSON.parse(currentSettings) : {};
    
    pdvSettings.printer_layout = settings;
    localStorage.setItem('pdv_settings', JSON.stringify(pdvSettings));
    
    console.log('✅ Printer settings saved successfully');
  } catch (error) {
    console.error('❌ Error saving printer settings:', error);
  }
};

/**
 * Generate CSS for thermal printing based on settings
 */
export const generateThermalPrintCSS = (settings: PrinterSettings): string => {
  return `
    @media print {
      @page {
        size: 80mm auto;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.2;
        color: black;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      
      .print\\:hidden {
        display: none !important;
      }
      
      .thermal-receipt {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 2mm !important;
        background: white;
        color: black;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.3;
        overflow: visible !important;
        max-height: none !important;
        transform: none !important;
        transform-origin: top left;
        box-sizing: border-box !important;
        display: block !important;
        position: static !important;
      }
      
      /* Force colors for thermal printing */
      * {
        color: black !important;
        background: white !important;
        border-color: black !important;
        box-sizing: border-box !important;
      }
      
      /* Remove any container restrictions */
      .fixed, .relative, .absolute {
        position: static !important;
      }
      
      .max-w-sm, .max-w-md, .max-w-lg, .max-w-xl {
        max-width: 100% !important;
      }
      
      .w-full {
        width: 100% !important;
      }
      
      /* Remove flexbox centering */
      .flex {
        display: block !important;
      }
      
      .items-center, .justify-center {
        align-items: stretch !important;
        justify-content: flex-start !important;
      }
      
      .thermal-receipt h1 {
        font-size: 18px !important;
        font-weight: bold !important;
        margin: 0 !important;
      }
      
      .thermal-receipt .text-xs {
        font-size: 12px !important;
      }
      
      .thermal-receipt .text-lg {
        font-size: 16px !important;
      }
      
      .thermal-receipt .font-bold {
        font-weight: bold !important;
      }
      
      /* Remove scroll bars */
      html, body, * {
        overflow: hidden !important;
      }
      
      /* Ensure no page breaks */
      .thermal-receipt * {
        page-break-inside: avoid !important;
      }
      
      /* Remove any transforms or scaling */
      * {
        transform: none !important;
        transform-origin: initial !important;
      }
      
      /* Ensure full width usage */
      #print-container, .print-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;
};

/**
 * Apply printer settings to current page
 */
export const applyPrinterSettings = (settings?: PrinterSettings): void => {
  const printerSettings = settings || loadPrinterSettings();
  
  // Remove existing printer styles
  const existingStyle = document.getElementById('thermal-printer-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Add new printer styles
  const style = document.createElement('style');
  style.id = 'thermal-printer-styles';
  style.textContent = generateThermalPrintCSS(printerSettings);
  document.head.appendChild(style);
};

/**
 * Initialize printer settings on page load
 */
export const initializePrinterSettings = (): void => {
  // Set default settings if none exist
  const currentSettings = localStorage.getItem('pdv_settings');
  if (!currentSettings) {
    savePrinterSettings(defaultPrinterSettings);
  }
  
  // Apply current settings
  applyPrinterSettings();
};