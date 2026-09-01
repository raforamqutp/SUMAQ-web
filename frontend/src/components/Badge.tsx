import React from 'react';

/**
 * ============================================================================
 * COMPONENTE REUTILIZABLE: BADGE (Insignia de Estado)
 * ============================================================================
 * Mapea automáticamente palabras clave de negocio a estilos visuales:
 * - Verde (Éxito): 'ATENDIDA', 'NORMAL', 'COMPLETADA'
 * - Amarillo (Advertencia): 'PENDIENTE', 'BAJO'
 * - Rojo (Alerta crítica): 'CANCELADA', 'CRITICO', 'CRÍTICO'
 * - Morado / Azul / Rosa (Roles): 'ADMIN', 'RECEPCIONISTA', 'TERAPEUTA'
 * ============================================================================
 */
interface BadgeProps {
  status: string;
  variant?: 'solid' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant = 'subtle' }) => {
  const normalized = status.toUpperCase();

  // Color neutro por defecto
  let styles = 'bg-[#EDE5DC] text-[#543F30] border-[#DFD0C0]';

  // Lógica condicional de asignación cromática
  if (normalized === 'PENDIENTE') {
    styles = 'bg-[#FFF9EB] text-[#8C6615] border-[#F2D794]';
  } else if (normalized === 'ATENDIDA' || normalized === 'NORMAL' || normalized === 'COMPLETADA') {
    styles = 'bg-[#EFF8F4] text-[#24634B] border-[#A8DAC2]';
  } else if (normalized === 'CANCELADA' || normalized === 'CRITICO' || normalized === 'CRÍTICO') {
    styles = 'bg-[#FFF2F0] text-[#9B2C1C] border-[#F8B4AB]';
  } else if (normalized === 'BAJO') {
    styles = 'bg-[#FFF5E6] text-[#A35200] border-[#FCD299]';
  } else if (normalized === 'ADMIN') {
    styles = 'bg-[#F2EDFF] text-[#5A3896] border-[#D4C3FA]';
  } else if (normalized === 'RECEPCIONISTA') {
    styles = 'bg-[#EBF7FF] text-[#006596] border-[#B8E2FA]';
  } else if (normalized === 'TERAPEUTA') {
    styles = 'bg-[#FDF2F4] text-[#8A3648] border-[#F4BAC6]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      {status}
    </span>
  );
};
