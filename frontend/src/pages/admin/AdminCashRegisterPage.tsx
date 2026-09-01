import React, { useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  User, 
  Tag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileText, 
  History,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface CartItem {
  id: string;
  name: string;
  type: 'SERVICIO' | 'PRODUCTO';
  price: number;
  quantity: number;
}

export const AdminCashRegisterPage: React.FC = () => {
  const { toast } = useToast();
  
  // Header state
  const [shift] = useState('Turno: Mañana (08:00 - 14:00)');
  const [cashier] = useState('Recepcionista: Elena Morales');
  
  // Customer state
  const [clientDni, setClientDni] = useState('72345678');
  const [clientName, setClientName] = useState('María García Ramos');
  const [historyCode] = useState('HC-0042');
  
  // Cart items
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Masaje Relajante con Aromaterapia (60 min)', type: 'SERVICIO', price: 160.00, quantity: 1 },
    { id: '2', name: 'Aceite Esencial de Lavanda 30ml (Extra)', type: 'PRODUCTO', price: 45.00, quantity: 1 },
    { id: '3', name: 'Crema Hidratante Facial Dermo (Extra)', type: 'PRODUCTO', price: 40.00, quantity: 1 }
  ]);

  // Discount state
  const [couponCode, setCouponCode] = useState('SUMAQBIENVENIDA');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [couponApplied, setCouponApplied] = useState<boolean>(true);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN'>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState<number>(250);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = couponApplied ? (subtotal * discountPercent) / 100 : 0;
  const taxableBase = subtotal - discountAmount;
  const igv = taxableBase * 0.18;
  const total = taxableBase;
  const change = Math.max(0, amountReceived - total);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'SUMAQBIENVENIDA') {
      setDiscountPercent(20);
      setCouponApplied(true);
      toast.success('Cupón Aplicado', 'Descuento del 20% aplicado con SUMAQBIENVENIDA');
    } else if (couponCode.trim().toUpperCase() === 'RELAXDAY') {
      setDiscountPercent(15);
      setCouponApplied(true);
      toast.success('Cupón Aplicado', 'Descuento del 15% aplicado con RELAXDAY');
    } else {
      toast.error('Cupón Inválido', 'El código ingresado no existe o no está vigente');
    }
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
    toast.info('Ítem Removido', 'Se eliminó el ítem de la venta actual');
  };

  const handleAddItem = (type: 'SERVICIO' | 'PRODUCTO') => {
    const newItem: CartItem = {
      id: String(Date.now()),
      name: type === 'SERVICIO' ? 'Tratamiento Dermoestético Adicional' : 'Ampolla de Colágeno Puro',
      type,
      price: type === 'SERVICIO' ? 50.00 : 25.00,
      quantity: 1
    };
    setCart([...cart, newItem]);
    toast.success('Ítem Agregado', 'Nuevo concepto incluido en la transacción');
  };

  const handleQuickCash = (val: number) => {
    setAmountReceived(val);
  };

  const handleEmitInvoice = (withPdf: boolean) => {
    setIsCompleted(true);
    if (withPdf) {
      toast.success('Boleta Emitida', `Total cobrado: S/ ${total.toFixed(2)} (PDF generado)`);
    } else {
      toast.success('Venta Registrada', `Total cobrado: S/ ${total.toFixed(2)} en caja chica`);
    }
  };

  const handleResetSale = () => {
    setIsCompleted(false);
    setCart([
      { id: '1', name: 'Masaje Relajante con Aromaterapia (60 min)', type: 'SERVICIO', price: 160.00, quantity: 1 }
    ]);
    setCouponApplied(false);
    setCouponCode('');
    setDiscountPercent(0);
    setAmountReceived(200);
    toast.info('Nueva Venta', 'Formulario de caja reiniciado');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#F3ECE4] rounded-lg text-[#8C6F55]">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif text-[#2C2725]">Punto de Venta / Caja Chica</h1>
          </div>
          <p className="text-xs text-[#7A7067] mt-1">
            {shift} · {cashier}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => toast.info('Historial de Caja', 'Abriendo historial de movimientos del turno...')}
            className="px-3.5 py-2 text-xs font-medium text-[#5A5047] bg-[#F7F4F0] hover:bg-[#EFEAE2] rounded-xl border border-[#E0D8CE] flex items-center gap-2 transition"
          >
            <History className="w-4 h-4" />
            Historial del Día
          </button>
          <button 
            type="button"
            onClick={handleResetSale}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#8C6F55] hover:bg-[#785E47] rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            + Nueva Venta
          </button>
        </div>
      </div>

      {isCompleted ? (
        <div className="bg-white p-10 rounded-2xl border border-[#EBE4DC] shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif text-[#2C2725]">Transacción Completada con Éxito</h2>
          <p className="text-sm text-[#7A7067]">
            Comprobante registrado para <strong>{clientName}</strong> ({historyCode}).
          </p>
          <div className="p-4 bg-[#FBF9F7] rounded-xl border border-[#EBE4DC] text-left text-xs space-y-1">
            <p><strong>Monto Total:</strong> S/ {total.toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> {paymentMethod}</p>
            {paymentMethod === 'EFECTIVO' && (
              <>
                <p><strong>Monto Recibido:</strong> S/ {amountReceived.toFixed(2)}</p>
                <p><strong>Vuelto:</strong> S/ {change.toFixed(2)}</p>
              </>
            )}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetSale}
              className="px-5 py-2.5 bg-[#8C6F55] text-white text-xs font-semibold rounded-xl hover:bg-[#785E47] transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Iniciar Siguiente Venta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main sale details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm">
              <h2 className="text-sm font-semibold text-[#2C2725] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#8C6F55]" />
                Identificación del Cliente & Ficha Clínica
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[#7A7067] mb-1 font-medium">DNI / Documento</label>
                  <input
                    type="text"
                    value={clientDni}
                    onChange={(e) => setClientDni(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-[#2C2725]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A7067] mb-1 font-medium">Nombre Completo</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-[#2C2725]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A7067] mb-1 font-medium">Nº Historia Clínica</label>
                  <div className="flex items-center gap-2">
                    <span className="w-full px-3 py-2 bg-[#F3ECE4] border border-[#E0D8CE] rounded-lg font-mono font-bold text-[#8C6F55]">
                      {historyCode}
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      ACTIVA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sale Items Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#2C2725] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#8C6F55]" />
                  Detalle del Servicio y Productos Adicionales
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddItem('SERVICIO')}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-[#F3ECE4] text-[#8C6F55] rounded-lg hover:bg-[#EBE2D7] transition"
                  >
                    + Servicio Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('PRODUCTO')}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-[#F3ECE4] text-[#8C6F55] rounded-lg hover:bg-[#EBE2D7] transition"
                  >
                    + Producto Extra
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] text-[#7A7067] font-semibold border-y border-[#EBE4DC]">
                    <tr>
                      <th className="py-2.5 px-3">Ítem / Concepto</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Unit (S/)</th>
                      <th className="py-2.5 px-3 text-right">Subtotal (S/)</th>
                      <th className="py-2.5 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE2]">
                    {cart.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-3 font-medium text-[#2C2725]">{item.name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.type === 'SERVICIO' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">{item.price.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#2C2725]">
                          {(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            aria-label={`Eliminar ${item.name} del carrito`}
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Coupon Engine */}
              <div className="pt-3 border-t border-[#EBE4DC] flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Tag className="w-4 h-4 text-[#8C6F55]" />
                  <span className="text-xs font-semibold text-[#5A5047]">Cupón Promocional:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <input
                    aria-label="Código de cupón promocional"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ej: SUMAQBIENVENIDA"
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E0D8CE] rounded-lg text-xs font-mono uppercase flex-1 text-[#2C2725]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 bg-[#8C6F55] text-white text-xs font-medium rounded-lg hover:bg-[#785E47] transition"
                  >
                    Aplicar
                  </button>
                </div>
                {couponApplied && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Checkout sidebar (Right col) */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4DC] shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-[#2C2725] border-b border-[#EBE4DC] pb-2">
                Liquidación & Cobro
              </h2>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs text-[#5A5047]">
                <div className="flex justify-between">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono">S/ {subtotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Descuento Promocional ({discountPercent}%):</span>
                    <span className="font-mono">- S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8C8278]">
                  <span>IGV Incluido (18%):</span>
                  <span className="font-mono">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-[#EBE4DC] flex justify-between items-center">
                  <span className="text-sm font-bold text-[#2C2725]">TOTAL A PAGAR:</span>
                  <span className="text-xl font-serif font-bold text-[#8C6F55]">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-[#EBE4DC]">
                <label className="block text-xs font-semibold text-[#2C2725]">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TARJETA', label: 'Tarjeta POS', icon: CreditCard },
                    { id: 'YAPE', label: 'Yape QR', icon: QrCode },
                    { id: 'PLIN', label: 'Plin QR', icon: QrCode }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                          paymentMethod === m.id
                            ? 'border-[#8C6F55] bg-[#F3ECE4] text-[#8C6F55] font-bold shadow-sm'
                            : 'border-[#E0D8CE] bg-[#FAF8F5] text-[#7A7067] hover:bg-[#F2ECE4]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Payment Details */}
              {paymentMethod === 'EFECTIVO' ? (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0D8CE] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <label htmlFor="efectivo-recibido-pos" className="font-semibold text-[#2C2725]">Efectivo Recibido:</label>
                    <input
                      id="efectivo-recibido-pos"
                      aria-label="Monto de efectivo recibido en soles"
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white border border-[#D5CCC2] rounded font-mono text-right font-bold text-[#2C2725]"
                    />
                  </div>
                  {/* Quick buttons */}
                  <div className="flex gap-1.5 justify-end">
                    {[200, 250, 300, 400, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-label={`Seleccionar billete de ${val} soles`}
                        onClick={() => handleQuickCash(val)}
                        className="px-2 py-1 bg-white border border-[#D5CCC2] rounded text-[11px] font-bold text-[#5A5047] hover:bg-[#F2ECE4] transition"
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#EBE4DC]">
                    <span className="font-bold text-emerald-800">VUELTO / CAMBIO:</span>
                    <span className="text-sm font-mono font-bold text-emerald-700">
                      S/ {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0D8CE] text-center space-y-2">
                  <div className="w-24 h-24 bg-white p-2 border border-[#D5CCC2] rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-[#8C6F55]" />
                  </div>
                  <p className="text-[11px] text-[#7A7067]">
                    Escanee el código QR dinámico desde la App de <strong>{paymentMethod}</strong> por el monto exacto de <strong>S/ {total.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleEmitInvoice(true)}
                  className="w-full py-3 bg-[#8C6F55] text-white text-xs font-bold rounded-xl hover:bg-[#785E47] transition shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Emitir Boleta PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleEmitInvoice(false)}
                  className="w-full py-2.5 bg-[#FAF8F5] text-[#5A5047] text-xs font-semibold rounded-xl border border-[#E0D8CE] hover:bg-[#F0EAE2] transition text-center"
                >
                  Registrar sin Comprobante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
