import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatPrice, getPaymentMethodName } from '../../utils/formatters';

interface PDVReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

const PDVReceiptModal: React.FC<PDVReceiptModalProps> = ({
  isOpen,
  onClose,
  sale
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Venda #${sale.sale_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
        </style>
      </head>
      <body>
        <div class="center separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div class="small">Comprovante de Venda</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: 38.130.139/0001-22</div>
        </div>
        
        <div class="separator">
          <div class="bold center">=== COMPROVANTE DE VENDA ===</div>
          <div class="small">Venda: #${sale.sale_number}</div>
          <div class="small">Data: ${new Date(sale.created_at).toLocaleDateString('pt-BR')}</div>
          <div class="small">Hora: ${new Date(sale.created_at).toLocaleTimeString('pt-BR')}</div>
          ${sale.customer_name ? `<div class="small">Cliente: ${sale.customer_name}</div>` : ''}
          ${sale.customer_phone ? `<div class="small">Telefone: ${sale.customer_phone}</div>` : ''}
        </div>
        
        <div class="separator">
          <div class="bold small">ITENS:</div>
          ${sale.items.map((item, index) => `
            <div style="margin-bottom: 8px;">
              <div class="bold">${item.product_name}</div>
              <div class="flex-between">
                <span class="small">${item.quantity}x ${formatPrice(item.unit_price || (item.price_per_gram * 1000) || 0)}</span>
                <span class="small">${formatPrice(item.subtotal)}</span>
              </div>
              ${item.weight_kg ? `<div class="small">Peso: ${(item.weight_kg * 1000).toFixed(0)}g</div>` : ''}
              ${item.discount_amount > 0 ? `<div class="small">Desconto item: -${formatPrice(item.discount_amount)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="separator">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>${formatPrice(sale.subtotal)}</span>
          </div>
          ${sale.discount_amount > 0 ? `
          <div class="flex-between">
            <span>Desconto Total:</span>
            <span>-${formatPrice(sale.discount_amount)}</span>
          </div>
          ` : ''}
          ${sale.discount_percentage > 0 ? `
          <div class="flex-between">
            <span>Desconto (${sale.discount_percentage}%):</span>
            <span>-${formatPrice(sale.subtotal * (sale.discount_percentage / 100))}</span>
          </div>
          ` : ''}
          <div class="flex-between bold" style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px;">
            <span>TOTAL:</span>
            <span>${formatPrice(sale.total_amount)}</span>
          </div>
        </div>
        
        <div class="separator">
          <div class="bold small">PAGAMENTO:</div>
          <div class="small">Forma: ${getPaymentMethodName(sale.payment_type)}</div>
          ${sale.change_amount > 0 ? `<div class="small">Troco: ${formatPrice(sale.change_amount)}</div>` : ''}
        </div>
        
        <div class="center small">
          <div class="bold">Obrigado pela preferência!</div>
          <div>Elite Açaí</div>
          <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Comprovante de Venda</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
            <div className="text-center mb-4">
              <p className="font-bold text-lg">ELITE AÇAÍ</p>
              <p className="text-sm">Comprovante de Venda</p>
              <p className="text-xs">Rua Um, 1614-C</p>
              <p className="text-xs">Residencial 1 - Cágado</p>
              <p className="text-xs">Tel: (85) 98904-1010</p>
              <p className="text-xs">CNPJ: 38.130.139/0001-22</p>
              <p className="text-xs">--------------------------</p>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-bold text-center">=== COMPROVANTE DE VENDA ===</p>
              <p className="text-xs">Venda: #{sale.sale_number}</p>
              <p className="text-xs">Data: {new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
              <p className="text-xs">Hora: {new Date(sale.created_at).toLocaleTimeString('pt-BR')}</p>
              {sale.customer_name && <p className="text-xs">Cliente: {sale.customer_name}</p>}
              {sale.customer_phone && <p className="text-xs">Telefone: {sale.customer_phone}</p>}
              <p className="text-xs">--------------------------</p>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-bold">ITENS:</p>
              {sale.items.map((item, index) => (
                <div key={index} className="text-xs mb-2">
                  <p className="font-bold">{item.product_name}</p>
                  <div className="flex justify-between">
                    <span>{item.quantity}x {formatPrice(item.unit_price || (item.price_per_gram * 1000) || 0)}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                  {item.weight_kg && <p>Peso: {(item.weight_kg * 1000).toFixed(0)}g</p>}
                  {item.discount_amount > 0 && <p>Desconto item: -{formatPrice(item.discount_amount)}</p>}
                </div>
              ))}
              <p className="text-xs">--------------------------</p>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-xs">
                <span>Subtotal:</span>
                <span>{formatPrice(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Desconto Total:</span>
                  <span>-{formatPrice(sale.discount_amount)}</span>
                </div>
              )}
              {sale.discount_percentage > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Desconto ({sale.discount_percentage}%):</span>
                  <span>-{formatPrice(sale.subtotal * (sale.discount_percentage / 100))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-2 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatPrice(sale.total_amount)}</span>
              </div>
              <p className="text-xs">--------------------------</p>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-bold">PAGAMENTO:</p>
              <p className="text-xs">Forma: {getPaymentMethodName(sale.payment_type)}</p>
              {sale.change_amount > 0 && <p className="text-xs">Troco: {formatPrice(sale.change_amount)}</p>}
              <p className="text-xs">--------------------------</p>
            </div>
            
            <div className="text-center text-xs">
              <p className="font-bold">Obrigado pela preferência!</p>
              <p>Elite Açaí</p>
              <p>Impresso: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVReceiptModal;