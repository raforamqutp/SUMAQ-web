import React, { useEffect, useState } from 'react';
import { therapistService } from '../../services/therapistService';
import { Producto } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Package, Droplets, AlertTriangle } from 'lucide-react';

/**
 * ============================================================================
 * VISTA: STOCK DE INSUMOS DE CABINA (TherapistInventoryPage)
 * ============================================================================
 * Permite a las terapeutas consultar las existencias físicas de aceites,
 * cremas, geles y mascarillas disponibles en su área de trabajo.
 * ============================================================================
 */
export const TherapistInventoryPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerInventario = async () => {
      try {
        const data = await therapistService.getInventario();
        setProductos(data);
      } catch (err) {
        console.error("Error cargando inventario de terapeuta:", err);
      } finally {
        setCargando(false);
      }
    };
    obtenerInventario();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Insumos de Trabajo</span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
          Disponibilidad de Insumos para Terapias
        </h1>
        <p className="text-xs text-[#6F5540] mt-1">
          Consulta en tiempo real el stock disponible de aceites, cremas, mascarillas, sales y exfoliantes.
        </p>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F6F2EC] flex items-center justify-center text-[#8C6F55]">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <Badge status={prod.estado_stock} />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#3D2D22]">{prod.nombre}</h3>
                <p className="text-xs text-[#6F5540] mt-1">{prod.descripcion || 'Insumo de cabina'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F6F2EC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C6F55] block">
                    Stock Disponible:
                  </span>
                  <span className="text-xl font-bold font-mono text-[#2C2725]">
                    {parseFloat(prod.stock_actual.toString()).toFixed(1)} {prod.unidad_medida}
                  </span>
                </div>
                {prod.estado_stock !== 'NORMAL' && (
                  <div className="text-[#C84B31] text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Reposición recomendada
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
