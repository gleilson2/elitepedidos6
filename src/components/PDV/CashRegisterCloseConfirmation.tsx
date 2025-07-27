import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, CheckCircle, Printer } from 'lucide-react';
import { PDVCashRegister, PDVCashRegisterSummary, PDVCashRegisterEntry } from '../../types/pdv';

interface CashRegisterCloseConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (closingAmount: number) => void;
  register: PDVCashRegister | null;
  summary: PDVCashRegisterSummary | null;
  isProcessing: boolean;
}

const CashRegisterCloseConfirmation: React.FC<CashRegisterCloseConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  register,
  summary,
  isProcessing
}) => {
  if (!isOpen) return null;

  // State for closing amount
  const [closingAmount, setClosingAmount] = useState(summary?.expected_balance || 0);
  const [printMovements, setPrintMovements] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              Confirmar Fechamento de Caixa
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600">
            Você está prestes a fechar o caixa atual. Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">Resumo do Caixa</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                  <span className="font-medium text-blue-800">{formatPrice(summary.opening_amount || register?.opening_amount || 0)}</span>
                    <span className="font-medium text-blue-800">{formatPrice(register?.opening_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Vendas PDV:</span>
                    <span className="font-medium text-blue-800">{formatPrice(summary?.sales_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Vendas Delivery:</span>
                    <span className="font-medium text-blue-800">{formatPrice(summary?.delivery_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Outras entradas:</span>
                    <span className="font-medium text-blue-800">{formatPrice(summary?.other_income_total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Saídas:</span>
                    <span className="font-medium text-blue-800">{formatPrice(summary?.total_expense || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-blue-800">Saldo esperado:</span>
                      <span className="font-bold text-blue-800">{formatPrice(summary?.expected_balance || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-1 text-xs text-gray-500">
                  <p className="text-xs">Apenas transações em dinheiro</p>
                  <p>
                    {formatPrice(summary?.opening_amount || 0)} + entradas - saídas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Após o fechamento, você poderá:
            </p>
            <ul className="space-y-2 text-gray-600 pl-6 list-disc">
              <li>Imprimir as movimentações do caixa</li>
              <li>Visualizar o relatório diário completo</li>
              <li>Enviar o resumo por WhatsApp</li>
            </ul>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Certifique-se de que o valor em caixa confere com o saldo esperado antes de fechar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Printer size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={printMovements}
                      onChange={(e) => setPrintMovements(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="font-medium text-blue-800">
                        Imprimir movimentações do caixa após fechamento
                      </span>
                      <p className="text-blue-700 text-sm mt-1">
                        Gera um relatório térmico com todas as movimentações do caixa
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor de fechamento
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={closingAmount}
                onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Informe o valor real em caixa no momento do fechamento
              </p>
              
              {/* Aviso de diferença */}
              {closingAmount !== (summary?.expected_balance || 0) && closingAmount > 0 && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  closingAmount > (summary?.expected_balance || 0)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={
                      closingAmount > (summary?.expected_balance || 0)
                        ? 'text-green-600'
                        : 'text-red-600'
                    } />
                    <div>
                      <p className={`text-sm font-medium ${
                        closingAmount > (summary?.expected_balance || 0)
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        {closingAmount > (summary?.expected_balance || 0) ? '💰 Sobra no Caixa' : '⚠️ Falta no Caixa'}
                      </p>
                      <p className={`text-sm ${
                        closingAmount > (summary?.expected_balance || 0)
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        Diferença: {formatPrice(Math.abs(closingAmount - (summary?.expected_balance || 0)))}
                        {closingAmount > (summary?.expected_balance || 0) ? ' a mais' : ' a menos'}
                      </p>
                      <p className={`text-xs mt-1 ${
                        closingAmount > (summary?.expected_balance || 0)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        Saldo esperado: {formatPrice(summary?.expected_balance || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Call the onConfirm function passed from the parent
                onConfirm(closingAmount, printMovements);
              }}
              disabled={isProcessing}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirmar Fechamento
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterCloseConfirmation;