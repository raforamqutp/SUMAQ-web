import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { Servicio } from '../../types/models';
import { Button } from '../../components/Button';
import { Sparkles, Clock, Calendar, Droplets } from 'lucide-react';

export const ServicesCatalogPage: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await publicService.getServicios();
        setServicios(data);
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE5DC] text-[#6F5540] text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#C8907E]" />
          Catálogo Oficial
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#2C2725]">
          Servicios, Tratamientos & Rituales
        </h1>
        <p className="text-sm text-[#6F5540] mt-3">
          Cada servicio está diseñado para una duración de 60 minutos con insumos puros de la más alta calidad botánica.
        </p>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicios.map((serv) => (
            <div
              key={serv.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#EDE5DC] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={serv.imagen_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'}
                    alt={serv.nombre}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-[#FAF8F5]/90 backdrop-blur-md px-3.5 py-1 rounded-full text-sm font-bold text-[#5E3A2B] border border-[#DFD0C0]">
                    S/ {parseFloat(serv.precio_publico.toString()).toFixed(2)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-[#8C6F55] mb-2 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{serv.duracion_min} minutos de sesión</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#3D2D22] mb-2">{serv.nombre}</h3>
                  <p className="text-xs text-[#6F5540] leading-relaxed mb-5">{serv.descripcion}</p>

                  {/* Bill of materials / Recipe items */}
                  {serv.recetas && serv.recetas.length > 0 && (
                    <div className="pt-4 border-t border-[#F6F2EC]">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#A88B71] mb-2 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-[#C8907E]" />
                        Insumos Requeridos en la Sesión:
                      </p>
                      <div className="space-y-1.5">
                        {serv.recetas.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#FAF8F5] border border-[#EDE5DC]"
                          >
                            <span className="text-[#543F30] font-medium">{r.producto_nombre}</span>
                            <span className="text-[#8C6F55] text-[11px]">
                              {r.cantidad_requerida} {r.unidad_medida}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link to={`/reservar?servicio_id=${serv.id}`}>
                  <Button variant="primary" size="lg" className="w-full" icon={<Calendar className="w-4 h-4" />}>
                    Reservar Este Ritual
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
