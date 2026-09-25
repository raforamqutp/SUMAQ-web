-- Datos iniciales (seed data): sumaq_spa

USE `sumaq_spa`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USUARIOS (Password hash PBKDF2 para 'AdminSumaq2026!' y 'Sumaq2026!')
-- pbkdf2_sha256$870000$p4ssw0rd$admin -> pbkdf2_sha256$870000$SumaqSalt2026$pM6P7Z1KqYQZqA2/tFjM1wK9xH2L3P0V9G4b5W6xY7Z=
TRUNCATE TABLE `usuarios`;
INSERT INTO `usuarios` (`id`, `email`, `password`, `nombre_completo`, `rol`, `activo`, `is_staff`, `is_superuser`, `created_at`) VALUES
(1, 'admin@sumaqspa.pe', 'pbkdf2_sha256$870000$g7bZ7uK9zL1x$b5hJj2b0uL1xK9zL1x+b5hJj2b0uL1xK9zL1xpM6P7Z1KqY=', 'Administrador General Sumaq', 'ADMIN', 1, 1, 1, '2026-01-01 08:00:00'),
(2, 'recepcion@sumaqspa.pe', 'pbkdf2_sha256$870000$g7bZ7uK9zL1x$b5hJj2b0uL1xK9zL1x+b5hJj2b0uL1xK9zL1xpM6P7Z1KqY=', 'Valeria Quispe', 'RECEPCIONISTA', 1, 0, 0, '2026-01-01 08:00:00'),
(3, 'elena.morales@sumaqspa.pe', 'pbkdf2_sha256$870000$g7bZ7uK9zL1x$b5hJj2b0uL1xK9zL1x+b5hJj2b0uL1xK9zL1xpM6P7Z1KqY=', 'Elena Morales', 'TERAPEUTA', 1, 0, 0, '2026-01-01 08:00:00'),
(4, 'camila.vega@sumaqspa.pe', 'pbkdf2_sha256$870000$g7bZ7uK9zL1x$b5hJj2b0uL1xK9zL1x+b5hJj2b0uL1xK9zL1xpM6P7Z1KqY=', 'Camila Vega', 'TERAPEUTA', 1, 0, 0, '2026-01-01 08:00:00'),
(5, 'lucia.ramos@sumaqspa.pe', 'pbkdf2_sha256$870000$g7bZ7uK9zL1x$b5hJj2b0uL1xK9zL1x+b5hJj2b0uL1xK9zL1xpM6P7Z1KqY=', 'Lucía Ramos', 'TERAPEUTA', 1, 0, 0, '2026-01-01 08:00:00');

-- 2. CABINAS
TRUNCATE TABLE `cabinas`;
INSERT INTO `cabinas` (`id`, `nombre`, `tipo`, `descripcion`, `activa`) VALUES
(1, 'Cabina 1', 'Holística', 'Masajes relajantes y terapéuticos con aromaterapia y música binaural.', 1),
(2, 'Cabina 2', 'Dermoestética', 'Tratamientos y limpiezas faciales profundas con aparatología avanzada.', 1),
(3, 'Cabina 3', 'Hidroterapia', 'Envolturas corporales, exfoliaciones y sales de baño minerales relajantes.', 1);

-- 3. TERAPEUTAS
TRUNCATE TABLE `terapeutas`;
INSERT INTO `terapeutas` (`id`, `usuario_id`, `cabina_id`, `especialidad`, `foto_url`, `activo`) VALUES
(1, 3, 1, 'Terapias Holísticas y Masajes Descontracturantes', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600', 1),
(2, 4, 2, 'Dermoestética y Cosmiatría Facial Avanzada', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600', 1),
(3, 5, 3, 'Hidroterapia, Exfoliaciones y Rituales Corporales', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600', 1);

-- 4. PRODUCTOS / INSUMOS
TRUNCATE TABLE `productos`;
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `costo_unitario`, `stock_actual`, `stock_minimo_alerta`, `unidad_medida`, `activo`, `created_at`) VALUES
(1, 'Aceite Esencial de Lavanda', 'Aceite botánico 100% puro para masajes relajantes y aromaterapia.', 18.00, 28.00, 5.00, 'frascos (100ml)', 1, '2026-01-01 08:00:00'),
(2, 'Crema Hidratante Dermo Facial', 'Fórmula hidratante con ácido hialurónico para todo tipo de piel.', 22.50, 24.00, 5.00, 'potes (250gr)', 1, '2026-01-01 08:00:00'),
(3, 'Exfoliante Corporal Botánico', 'Exfoliante de microgránulos de albaricoque y sales del mar muerto.', 25.00, 4.00, 5.00, 'frascos (300gr)', 1, '2026-01-01 08:00:00'),
(4, 'Mascarilla Facial Revitalizante', 'Mascarilla con colágeno y vitamina C en sobres individuales.', 15.00, 2.00, 5.00, 'sobres', 1, '2026-01-01 08:00:00'),
(5, 'Sales de Baño Minerales', 'Sales minerales aromatizadas con eucalipto para hidroterapia.', 12.00, 32.00, 5.00, 'bolsas (500gr)', 1, '2026-01-01 08:00:00');

-- 5. SERVICIOS
TRUNCATE TABLE `servicios`;
INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `precio_publico`, `duracion_min`, `imagen_url`, `activo`) VALUES
(1, 'Masaje Relajante', 'Masaje corporal antiestrés con aceites esenciales botánicos y técnicas de relajación profunda.', 120.00, 60, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800', 1),
(2, 'Limpieza Facial Profunda', 'Tratamiento dermoestético con exfoliación, vapor de ozono, extracción y mascarilla revitalizante.', 150.00, 60, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800', 1),
(3, 'Envoltura Corporal & Hidroterapia', 'Inmersión relajante con sales marinas aromáticas y envoltura desintoxicante con exfoliación corporal.', 180.00, 60, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800', 1);

-- 6. RECETAS DE SERVICIO (BOM)
TRUNCATE TABLE `recetas_servicio`;
INSERT INTO `recetas_servicio` (`id`, `servicio_id`, `producto_id`, `cantidad_requerida`) VALUES
(1, 1, 1, 1.00),
(2, 1, 2, 1.00),
(3, 2, 4, 1.00),
(4, 2, 2, 1.00),
(5, 3, 3, 1.00),
(6, 3, 5, 1.00);

-- 7. PROMOCIONES
TRUNCATE TABLE `promociones`;
INSERT INTO `promociones` (`id`, `titulo`, `descripcion`, `codigo_cupon`, `porcentaje_descuento`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, 'Bienvenida Sumaq Spa', '20% de descuento en tu primera reserva online.', 'SUMAQBIENVENIDA', 20.00, '2026-01-01', '2026-12-31', 1),
(2, 'Día de Relajación', '15% de descuento en todos nuestros tratamientos y masajes.', 'RELAXDAY', 15.00, '2026-01-01', '2026-12-31', 1);

-- 8. CLIENTES
TRUNCATE TABLE `clientes`;
INSERT INTO `clientes` (`id`, `dni`, `nombre_completo`, `telefono`, `email`, `activo`, `created_at`) VALUES
(1, '72345678', 'María García Ramos', '987654321', 'maria.garcia@gmail.com', 1, '2026-04-01 08:00:00'),
(2, '45678901', 'Carlos Mendoza Silva', '912345678', 'carlos.mendoza@hotmail.com', 1, '2026-04-02 09:00:00'),
(3, '70987654', 'Ana Lucía Torres', '998877665', 'ana.torres@outlook.com', 1, '2026-04-03 10:00:00');

-- 9. CITAS DE EJEMPLO
TRUNCATE TABLE `citas`;
INSERT INTO `citas` (`id`, `codigo_reserva`, `cliente_id`, `servicio_id`, `terapeuta_id`, `cabina_id`, `fecha`, `hora_inicio`, `hora_fin`, `estado`, `subtotal`, `descuento`, `monto_total`, `metodo_pago`, `promocion_id`, `codigo_cupon_aplicado`, `created_at`) VALUES
(1, 'SQ-20260426-0042', 1, 1, 1, 1, '2026-04-26', '09:00:00', '10:00:00', 'PENDIENTE', 120.00, 24.00, 96.00, 'EFECTIVO', 1, 'SUMAQBIENVENIDA', '2026-04-26 08:00:00'),
(2, 'SQ-20260426-0043', 2, 2, 2, 2, '2026-04-26', '11:00:00', '12:00:00', 'ATENDIDA', 150.00, 0.00, 150.00, 'TARJETA', NULL, '', '2026-04-26 08:30:00'),
(3, 'SQ-20260426-0044', 3, 3, 3, 3, '2026-04-26', '14:00:00', '15:00:00', 'PENDIENTE', 180.00, 27.00, 153.00, 'YAPE', 2, 'RELAXDAY', '2026-04-26 08:45:00');

-- 10. FICHAS DE ATENCIÓN
TRUNCATE TABLE `fichas_atencion`;
INSERT INTO `fichas_atencion` (`id`, `cita_id`, `tipo_piel`, `alergias_conocidas`, `notas_terapeuta`, `fecha_registro`) VALUES
(1, 1, 'Piel Sensible y Reactiva', 'Alergia a parabenos y fragancias sintéticas fuertes.', 'Paciente refiere tensión muscular cervical. Se aplicará aceite esencial de lavanda tibio.', '2026-04-26 09:05:00'),
(2, 2, 'Piel Grasa con Tendencia Acneica', 'Sin alergias conocidas.', 'Limpieza profunda realizada con extracción manual suave y mascarilla purificante.', '2026-04-26 11:05:00');

-- 11. MOVIMIENTOS DE INVENTARIO (KÁRDEX)
TRUNCATE TABLE `movimientos_inventario`;
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `costo_unitario`, `referencia_tipo`, `referencia_id`, `fecha_registro`, `descripcion`) VALUES
(1, 1, 'ENTRADA_COMPRA', 30.00, 18.00, 'COMPRA_INICIAL', NULL, '2026-04-20 08:00:00', 'Compra y abastecimiento inicial de stock'),
(2, 1, 'SALIDA_CONSUMO_SERVICIO', 1.00, 18.00, 'CITA', 1, '2026-04-26 10:00:00', 'Consumo automático en cita SQ-20260426-0042'),
(3, 4, 'SALIDA_CONSUMO_SERVICIO', 1.00, 15.00, 'CITA', 2, '2026-04-26 12:00:00', 'Consumo en atención de limpieza facial');

-- 12. MOVIMIENTOS DE CAJA
TRUNCATE TABLE `movimientos_caja`;
INSERT INTO `movimientos_caja` (`id`, `tipo`, `concepto`, `monto`, `metodo_pago`, `cita_id`, `fecha_registro`, `descripcion`) VALUES
(1, 'INGRESO', 'Cobro de Cita Masaje Relajante (SQ-0042)', 96.00, 'EFECTIVO', 1, '2026-04-26 10:05:00', 'Cobro en recepción efectivo'),
(2, 'INGRESO', 'Cobro de Cita Limpieza Facial (SQ-0043)', 150.00, 'TARJETA', 2, '2026-04-26 12:05:00', 'Cobro con tarjeta POS'),
(3, 'INGRESO', 'Cobro de Cita Hidroterapia (SQ-0044)', 153.00, 'YAPE', 3, '2026-04-26 15:05:00', 'Cobro billetera digital Yape');

SET FOREIGN_KEY_CHECKS = 1;
