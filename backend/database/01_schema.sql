-- ============================================================================
-- ESQUEMA DDL DE BASE DE DATOS: SUMAQ SPA & CENTRO DE BIENESTAR
-- Motor: MySQL 8.0 / MariaDB 10.4 (InnoDB)
-- Codificación: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `sumaq_spa` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `sumaq_spa`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA USUARIOS (Cuentas internas y control de acceso RBAC)
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(128) NOT NULL,
  `nombre_completo` VARCHAR(200) NOT NULL,
  `rol` ENUM('ADMIN', 'RECEPCIONISTA', 'TERAPEUTA') NOT NULL DEFAULT 'TERAPEUTA',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
  `is_superuser` TINYINT(1) NOT NULL DEFAULT 0,
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA CLIENTES (Titulares de reservas identificados por DNI)
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `dni` VARCHAR(20) NOT NULL UNIQUE,
  `nombre_completo` VARCHAR(200) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  `email` VARCHAR(254) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_clientes_dni` (`dni`),
  INDEX `idx_clientes_nombre` (`nombre_completo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA CABINAS (Cabinas físicas temáticas)
DROP TABLE IF EXISTS `cabinas`;
CREATE TABLE `cabinas` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `tipo` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `activa` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA TERAPEUTAS (Especialistas de salud y estética vinculadas a cabina)
DROP TABLE IF EXISTS `terapeutas`;
CREATE TABLE `terapeutas` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` BIGINT NOT NULL UNIQUE,
  `cabina_id` BIGINT NULL,
  `especialidad` VARCHAR(150) NOT NULL,
  `foto_url` VARCHAR(500) NOT NULL DEFAULT '',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_terapeutas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_terapeutas_cabina` FOREIGN KEY (`cabina_id`) REFERENCES `cabinas` (`id`) ON DELETE SET NULL,
  INDEX `idx_terapeutas_cabina` (`cabina_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA SERVICIOS (Catálogo de tratamientos y rituales)
DROP TABLE IF EXISTS `servicios`;
CREATE TABLE `servicios` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `precio_publico` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `duracion_min` INT NOT NULL DEFAULT 60,
  `imagen_url` VARCHAR(500) NOT NULL DEFAULT '',
  `activo` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA PRODUCTOS (Insumos botánicos, cosméticos y kárdex de almacén)
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_actual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo_alerta` DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  `unidad_medida` VARCHAR(50) NOT NULL DEFAULT 'unidades',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_productos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA RECETAS DE SERVICIO (Bill of Materials / BOM)
DROP TABLE IF EXISTS `recetas_servicio`;
CREATE TABLE `recetas_servicio` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `servicio_id` BIGINT NOT NULL,
  `producto_id` BIGINT NOT NULL,
  `cantidad_requerida` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  UNIQUE KEY `uk_servicio_producto` (`servicio_id`, `producto_id`),
  CONSTRAINT `fk_recetas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recetas_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE PROTECT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABLA PROMOCIONES (Campañas de marketing y cupones de descuento)
DROP TABLE IF EXISTS `promociones`;
CREATE TABLE `promociones` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `codigo_cupon` VARCHAR(50) NOT NULL UNIQUE,
  `porcentaje_descuento` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  INDEX `idx_promociones_cupon` (`codigo_cupon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABLA CITAS (Entidad central de reservas y facturación)
DROP TABLE IF EXISTS `citas`;
CREATE TABLE `citas` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `codigo_reserva` VARCHAR(40) NOT NULL UNIQUE,
  `cliente_id` BIGINT NOT NULL,
  `servicio_id` BIGINT NOT NULL,
  `terapeuta_id` BIGINT NOT NULL,
  `cabina_id` BIGINT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `estado` ENUM('PENDIENTE', 'ATENDIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descuento` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `monto_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` ENUM('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN') NOT NULL DEFAULT 'EFECTIVO',
  `promocion_id` BIGINT NULL,
  `codigo_cupon_aplicado` VARCHAR(50) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_citas_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE PROTECT,
  CONSTRAINT `fk_citas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE PROTECT,
  CONSTRAINT `fk_citas_terapeuta` FOREIGN KEY (`terapeuta_id`) REFERENCES `terapeutas` (`id`) ON DELETE PROTECT,
  CONSTRAINT `fk_citas_cabina` FOREIGN KEY (`cabina_id`) REFERENCES `cabinas` (`id`) ON DELETE PROTECT,
  CONSTRAINT `fk_citas_promocion` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`) ON DELETE SET NULL,
  INDEX `idx_cita_terapeuta_slot` (`fecha`, `terapeuta_id`, `hora_inicio`, `hora_fin`, `estado`),
  INDEX `idx_cita_cabina_slot` (`fecha`, `cabina_id`, `hora_inicio`, `hora_fin`, `estado`),
  INDEX `idx_cita_cliente_fecha` (`cliente_id`, `fecha`, `estado`),
  INDEX `idx_citas_codigo` (`codigo_reserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABLA FICHAS DE ATENCIÓN (Historias clínicas estéticas confidenciales)
DROP TABLE IF EXISTS `fichas_atencion`;
CREATE TABLE `fichas_atencion` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `cita_id` BIGINT NOT NULL UNIQUE,
  `tipo_piel` VARCHAR(100) NOT NULL DEFAULT '',
  `alergias_conocidas` TEXT NOT NULL,
  `notas_terapeuta` TEXT NOT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fichas_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TABLA SERVICIOS ADICIONALES EN ATENCIÓN
DROP TABLE IF EXISTS `servicios_adicionales_atencion`;
CREATE TABLE `servicios_adicionales_atencion` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ficha_atencion_id` BIGINT NOT NULL,
  `servicio_id` BIGINT NOT NULL,
  `cantidad` INT UNSIGNED NOT NULL DEFAULT 1,
  `precio_unitario_historico` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_servicios_adicionales_ficha` FOREIGN KEY (`ficha_atencion_id`) REFERENCES `fichas_atencion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_servicios_adicionales_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE PROTECT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. TABLA MOVIMIENTOS DE INVENTARIO (Kárdex valorizado)
DROP TABLE IF EXISTS `movimientos_inventario`;
CREATE TABLE `movimientos_inventario` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `producto_id` BIGINT NOT NULL,
  `tipo` ENUM('ENTRADA_COMPRA', 'SALIDA_CONSUMO_SERVICIO', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO') NOT NULL,
  `cantidad` DECIMAL(10,2) NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL,
  `referencia_tipo` VARCHAR(50) NOT NULL DEFAULT 'AJUSTE_MANUAL',
  `referencia_id` BIGINT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` TEXT NOT NULL,
  CONSTRAINT `fk_movimientos_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  INDEX `idx_movimientos_producto_fecha` (`producto_id`, `fecha_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. TABLA MOVIMIENTOS DE CAJA (Flujo monetario y libro diario)
DROP TABLE IF EXISTS `movimientos_caja`;
CREATE TABLE `movimientos_caja` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tipo` ENUM('INGRESO', 'INGRESO_EXTRA', 'EGRESO') NOT NULL DEFAULT 'INGRESO',
  `concepto` VARCHAR(200) NOT NULL DEFAULT '',
  `monto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO',
  `cita_id` BIGINT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` TEXT NOT NULL,
  CONSTRAINT `fk_caja_cita` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE SET NULL,
  INDEX `idx_caja_fecha` (`fecha_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
