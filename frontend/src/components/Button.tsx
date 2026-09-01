import React from 'react';

/**
 * ============================================================================
 * COMPONENTE REUTILIZABLE: BUTTON (Botón Atómico)
 * ============================================================================
 * Centraliza los estilos interactivos de botones para todo el sistema.
 * 
 * Props soportados:
 * - variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 * - size: 'sm' (pequeño) | 'md' (estándar) | 'lg' (destacado / CTA)
 * - loading: boolean (muestra un spinner SVG y deshabilita clics)
 * - icon: ReactNode (icono vectorial de Lucide a la izquierda del texto)
 * ============================================================================
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Estilos estructurales base (flexbox, transiciones, foco accesible y cursor)
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  // Tamaños y paddings responsivos
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 shadow-md',
  }[size];

  // Paleta de colores aplicada según la variante elegida
  const variantStyles = {
    primary:
      'bg-[#8C6F55] text-white hover:bg-[#735942] focus:ring-[#8C6F55] shadow-sm hover:shadow',
    secondary:
      'bg-[#EDE5DC] text-[#543F30] hover:bg-[#DFD0C0] focus:ring-[#C9B29B]',
    outline:
      'border border-[#C9B29B] text-[#543F30] bg-transparent hover:bg-[#F6F2EC] focus:ring-[#8C6F55]',
    danger:
      'bg-[#C84B31] text-white hover:bg-[#A83821] focus:ring-[#C84B31]',
    ghost:
      'bg-transparent text-[#543F30] hover:bg-[#F6F2EC] focus:ring-[#8C6F55]',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
