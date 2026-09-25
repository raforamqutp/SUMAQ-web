-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sumaq_spa
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add Usuario',6,'add_user'),(22,'Can change Usuario',6,'change_user'),(23,'Can delete Usuario',6,'delete_user'),(24,'Can view Usuario',6,'view_user'),(25,'Can add Cliente',7,'add_cliente'),(26,'Can change Cliente',7,'change_cliente'),(27,'Can delete Cliente',7,'delete_cliente'),(28,'Can view Cliente',7,'view_cliente'),(29,'Can add Cabina',8,'add_cabina'),(30,'Can change Cabina',8,'change_cabina'),(31,'Can delete Cabina',8,'delete_cabina'),(32,'Can view Cabina',8,'view_cabina'),(33,'Can add Terapeuta',9,'add_terapeuta'),(34,'Can change Terapeuta',9,'change_terapeuta'),(35,'Can delete Terapeuta',9,'delete_terapeuta'),(36,'Can view Terapeuta',9,'view_terapeuta'),(37,'Can add Servicio',10,'add_servicio'),(38,'Can change Servicio',10,'change_servicio'),(39,'Can delete Servicio',10,'delete_servicio'),(40,'Can view Servicio',10,'view_servicio'),(41,'Can add Receta de Servicio (Insumo)',11,'add_recetaservicio'),(42,'Can change Receta de Servicio (Insumo)',11,'change_recetaservicio'),(43,'Can delete Receta de Servicio (Insumo)',11,'delete_recetaservicio'),(44,'Can view Receta de Servicio (Insumo)',11,'view_recetaservicio'),(45,'Can add Producto / Insumo',12,'add_producto'),(46,'Can change Producto / Insumo',12,'change_producto'),(47,'Can delete Producto / Insumo',12,'delete_producto'),(48,'Can view Producto / Insumo',12,'view_producto'),(49,'Can add Movimiento de Inventario',13,'add_movimientoinventario'),(50,'Can change Movimiento de Inventario',13,'change_movimientoinventario'),(51,'Can delete Movimiento de Inventario',13,'delete_movimientoinventario'),(52,'Can view Movimiento de Inventario',13,'view_movimientoinventario'),(53,'Can add Promoción / Cupón',14,'add_promocion'),(54,'Can change Promoción / Cupón',14,'change_promocion'),(55,'Can delete Promoción / Cupón',14,'delete_promocion'),(56,'Can view Promoción / Cupón',14,'view_promocion'),(57,'Can add Cita / Reserva',15,'add_cita'),(58,'Can change Cita / Reserva',15,'change_cita'),(59,'Can delete Cita / Reserva',15,'delete_cita'),(60,'Can view Cita / Reserva',15,'view_cita'),(61,'Can add Ficha de Atención Estética',16,'add_fichaatencion'),(62,'Can change Ficha de Atención Estética',16,'change_fichaatencion'),(63,'Can delete Ficha de Atención Estética',16,'delete_fichaatencion'),(64,'Can view Ficha de Atención Estética',16,'view_fichaatencion'),(65,'Can add Servicio Adicional de Atención',17,'add_servicioadicionalatencion'),(66,'Can change Servicio Adicional de Atención',17,'change_servicioadicionalatencion'),(67,'Can delete Servicio Adicional de Atención',17,'delete_servicioadicionalatencion'),(68,'Can view Servicio Adicional de Atención',17,'view_servicioadicionalatencion'),(69,'Can add Movimiento de Caja',18,'add_movimientocaja'),(70,'Can change Movimiento de Caja',18,'change_movimientocaja'),(71,'Can delete Movimiento de Caja',18,'delete_movimientocaja'),(72,'Can view Movimiento de Caja',18,'view_movimientocaja');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabinas`
--

DROP TABLE IF EXISTS `cabinas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabinas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activa` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabinas`
--

LOCK TABLES `cabinas` WRITE;
/*!40000 ALTER TABLE `cabinas` DISABLE KEYS */;
INSERT INTO `cabinas` VALUES (1,'Cabina 76','Holística 4','Masajes relajantes y terapéuticos con aromaterapia',1),(2,'Cabina 2','Dermoestética','Tratamientos y limpiezas faciales profundas con aparatología',1),(3,'Cabina 3','Hidroterapia','Envolturas corporales, exfoliaciones y sales de baño minerales',1);
/*!40000 ALTER TABLE `cabinas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo_reserva` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time(6) NOT NULL,
  `hora_fin` time(6) NOT NULL,
  `estado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_cupon_aplicado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `cabina_id` bigint NOT NULL,
  `cliente_id` bigint NOT NULL,
  `promocion_id` bigint DEFAULT NULL,
  `servicio_id` bigint NOT NULL,
  `terapeuta_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_reserva` (`codigo_reserva`),
  KEY `citas_cabina_id_aa8b78df_fk_cabinas_id` (`cabina_id`),
  KEY `citas_promocion_id_9dab023b_fk_promociones_id` (`promocion_id`),
  KEY `citas_servicio_id_8528115c_fk_servicios_id` (`servicio_id`),
  KEY `citas_terapeuta_id_bc801dda_fk_terapeutas_id` (`terapeuta_id`),
  KEY `citas_fecha_1febd2ac` (`fecha`),
  KEY `citas_estado_3e1cc85c` (`estado`),
  KEY `idx_cita_terapeuta_slot` (`fecha`,`terapeuta_id`,`hora_inicio`,`hora_fin`,`estado`),
  KEY `idx_cita_cabina_slot` (`fecha`,`cabina_id`,`hora_inicio`,`hora_fin`,`estado`),
  KEY `idx_cita_cliente_fecha` (`cliente_id`,`fecha`,`estado`),
  CONSTRAINT `citas_cabina_id_aa8b78df_fk_cabinas_id` FOREIGN KEY (`cabina_id`) REFERENCES `cabinas` (`id`),
  CONSTRAINT `citas_cliente_id_ea938cdc_fk_clientes_id` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `citas_promocion_id_9dab023b_fk_promociones_id` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`),
  CONSTRAINT `citas_servicio_id_8528115c_fk_servicios_id` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`),
  CONSTRAINT `citas_terapeuta_id_bc801dda_fk_terapeutas_id` FOREIGN KEY (`terapeuta_id`) REFERENCES `terapeutas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (7,'SQ-20260920-8A891','2026-09-20','10:00:00.000000','11:00:00.000000','PENDIENTE',120.00,0.00,120.00,'EFECTIVO','','2026-09-18 22:39:20.829361','2026-09-18 22:39:20.829375',1,7,NULL,1,1),(8,'SQ-20260918-B0856','2026-09-18','09:00:00.000000','10:00:00.000000','PENDIENTE',150.00,0.00,150.00,'TARJETA','','2026-09-18 22:41:11.785221','2026-09-18 22:41:11.785240',2,8,NULL,2,2),(9,'SQ-20260918-7F2E2','2026-09-18','11:00:00.000000','12:00:00.000000','ATENDIDA',120.00,0.00,120.00,'TARJETA','','2026-09-18 22:50:38.154756','2026-09-18 23:11:30.910395',1,9,NULL,1,1),(10,'SQ-20260922-81E88','2026-09-22','16:00:00.000000','17:00:00.000000','PENDIENTE',150.00,0.00,150.00,'TARJETA','','2026-09-22 22:55:54.911888','2026-09-22 22:55:54.911934',1,8,NULL,2,1),(11,'SQ-20260925-0042','2026-09-25','09:00:00.000000','10:00:00.000000','PENDIENTE',120.00,24.00,96.00,'EFECTIVO','SUMAQBIENVENIDA','2026-09-25 16:12:05.962118','2026-09-25 16:12:05.962137',1,7,1,1,1),(12,'SQ-20260925-0043','2026-09-25','11:00:00.000000','12:00:00.000000','ATENDIDA',150.00,0.00,150.00,'TARJETA','','2026-09-25 16:12:05.991597','2026-09-25 16:12:05.991611',2,10,NULL,2,2),(13,'SQ-20260925-0044','2026-09-25','14:00:00.000000','15:00:00.000000','PENDIENTE',180.00,27.00,153.00,'YAPE','RELAXDAY','2026-09-25 16:12:06.023426','2026-09-25 16:12:06.023474',3,11,2,3,3),(14,'SQ-20260825-7281','2026-09-28','10:00:00.000000','11:00:00.000000','PENDIENTE',120.00,24.00,96.00,'TARJETA','SUMAQBIENVENIDA','2026-09-25 16:12:06.037815','2026-09-25 16:12:06.037887',1,7,NULL,1,1),(15,'SQ-20260924-111','2026-09-24','10:00:00.000000','11:00:00.000000','ATENDIDA',120.00,0.00,120.00,'EFECTIVO','','2026-09-25 16:12:06.050429','2026-09-25 16:12:06.050442',1,7,NULL,1,1),(16,'SQ-20260924-112','2026-09-24','15:00:00.000000','16:00:00.000000','ATENDIDA',150.00,0.00,150.00,'TARJETA','','2026-09-25 16:12:06.060611','2026-09-25 16:12:06.060624',2,10,NULL,2,2),(17,'SQ-20260923-121','2026-09-23','09:00:00.000000','10:00:00.000000','ATENDIDA',180.00,27.00,153.00,'YAPE','','2026-09-25 16:12:06.069500','2026-09-25 16:12:06.069513',3,11,NULL,3,3),(18,'SQ-20260923-122','2026-09-23','12:00:00.000000','13:00:00.000000','ATENDIDA',120.00,24.00,96.00,'TARJETA','','2026-09-25 16:12:06.081723','2026-09-25 16:12:06.081737',1,7,NULL,1,1),(19,'SQ-20260922-131','2026-09-22','11:00:00.000000','12:00:00.000000','ATENDIDA',150.00,0.00,150.00,'EFECTIVO','','2026-09-25 16:12:06.091907','2026-09-25 16:12:06.091920',2,10,NULL,2,2),(20,'SQ-20260922-132','2026-09-22','16:00:00.000000','17:00:00.000000','ATENDIDA',120.00,0.00,120.00,'PLIN','','2026-09-25 16:12:06.100854','2026-09-25 16:12:06.100867',1,11,NULL,1,1),(21,'SQ-20260921-141','2026-09-21','10:00:00.000000','11:00:00.000000','ATENDIDA',180.00,0.00,180.00,'TARJETA','','2026-09-25 16:12:06.112287','2026-09-25 16:12:06.112306',3,7,NULL,3,3),(22,'SQ-20260921-142','2026-09-21','14:00:00.000000','15:00:00.000000','ATENDIDA',120.00,0.00,120.00,'EFECTIVO','','2026-09-25 16:12:06.123787','2026-09-25 16:12:06.123802',1,10,NULL,1,1),(23,'SQ-20260920-151','2026-09-20','09:00:00.000000','10:00:00.000000','ATENDIDA',150.00,0.00,150.00,'TARJETA','','2026-09-25 16:12:06.137320','2026-09-25 16:12:06.137335',2,11,NULL,2,2),(24,'SQ-20260920-152','2026-09-20','15:00:00.000000','16:00:00.000000','ATENDIDA',180.00,27.00,153.00,'YAPE','','2026-09-25 16:12:06.148573','2026-09-25 16:12:06.148586',3,7,NULL,3,3),(25,'SQ-20260919-161','2026-09-19','11:00:00.000000','12:00:00.000000','ATENDIDA',120.00,0.00,120.00,'EFECTIVO','','2026-09-25 16:12:06.158088','2026-09-25 16:12:06.158101',1,10,NULL,1,1),(26,'SQ-20260919-162','2026-09-19','13:00:00.000000','14:00:00.000000','ATENDIDA',150.00,0.00,150.00,'TARJETA','','2026-09-25 16:12:06.168184','2026-09-25 16:12:06.168197',2,11,NULL,2,2),(27,'SQ-20261015-9598E','2026-10-15','12:00:00.000000','13:00:00.000000','PENDIENTE',150.00,0.00,150.00,'YAPE','','2026-09-25 16:57:17.498893','2026-09-25 16:57:17.498908',2,12,NULL,2,2);
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (7,'72345678','Juan Perez Test','987654321','juan@test.com',1,'2026-09-18 22:39:20.823123','2026-09-18 22:39:20.823152'),(8,'72393204','Alexis Mango','943575998','mango.ticlla456@gmail.com',1,'2026-09-18 22:41:11.779120','2026-09-22 22:55:54.884437'),(9,'40300867','ANTHONY LUQE','943575933','luque@gmail.com',1,'2026-09-18 22:50:38.145367','2026-09-18 22:50:38.145439'),(10,'45678901','Carlos Mendoza Silva','912345678','carlos.mendoza@hotmail.com',1,'2026-09-25 16:12:05.915808','2026-09-25 16:12:05.915827'),(11,'70987654','Ana Lucía Torres','998877665','ana.torres@outlook.com',1,'2026-09-25 16:12:05.923395','2026-09-25 16:12:05.923413'),(12,'72393200','Shirley Mango','943579999','mango.shirley@gmail.com',1,'2026-09-25 16:57:17.490146','2026-09-25 16:57:17.490205');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_usuarios_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_usuarios_id` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (6,'accounts','user'),(1,'admin','logentry'),(15,'appointments','cita'),(16,'attention','fichaatencion'),(17,'attention','servicioadicionalatencion'),(3,'auth','group'),(2,'auth','permission'),(8,'cabins','cabina'),(7,'clients','cliente'),(4,'contenttypes','contenttype'),(18,'finance','movimientocaja'),(13,'inventory','movimientoinventario'),(12,'inventory','producto'),(14,'marketing','promocion'),(11,'services','recetaservicio'),(10,'services','servicio'),(5,'sessions','session'),(9,'therapists','terapeuta');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-08-21 18:14:17.944011'),(2,'contenttypes','0002_remove_content_type_name','2026-08-21 18:14:18.120451'),(3,'auth','0001_initial','2026-08-21 18:14:18.473773'),(4,'auth','0002_alter_permission_name_max_length','2026-08-21 18:14:18.551703'),(5,'auth','0003_alter_user_email_max_length','2026-08-21 18:14:18.563624'),(6,'auth','0004_alter_user_username_opts','2026-08-21 18:14:18.570536'),(7,'auth','0005_alter_user_last_login_null','2026-08-21 18:14:18.578354'),(8,'auth','0006_require_contenttypes_0002','2026-08-21 18:14:18.581723'),(9,'auth','0007_alter_validators_add_error_messages','2026-08-21 18:14:18.589172'),(10,'auth','0008_alter_user_username_max_length','2026-08-21 18:14:18.595772'),(11,'auth','0009_alter_user_last_name_max_length','2026-08-21 18:14:18.604109'),(12,'auth','0010_alter_group_name_max_length','2026-08-21 18:14:18.623926'),(13,'auth','0011_update_proxy_permissions','2026-08-21 18:14:18.633733'),(14,'auth','0012_alter_user_first_name_max_length','2026-08-21 18:14:18.639606'),(15,'accounts','0001_initial','2026-08-21 18:14:19.068913'),(16,'admin','0001_initial','2026-08-21 18:14:19.306162'),(17,'admin','0002_logentry_remove_auto_add','2026-08-21 18:14:19.316698'),(18,'admin','0003_logentry_add_action_flag_choices','2026-08-21 18:14:19.324775'),(19,'cabins','0001_initial','2026-08-21 18:14:19.369671'),(20,'therapists','0001_initial','2026-08-21 18:14:19.583862'),(21,'inventory','0001_initial','2026-08-21 18:14:19.752874'),(22,'services','0001_initial','2026-08-21 18:14:20.053751'),(23,'marketing','0001_initial','2026-08-21 18:14:20.104560'),(24,'clients','0001_initial','2026-08-21 18:14:20.146820'),(25,'appointments','0001_initial','2026-08-21 18:14:20.763146'),(26,'attention','0001_initial','2026-08-21 18:14:21.102446'),(27,'finance','0001_initial','2026-08-21 18:14:21.251350'),(28,'sessions','0001_initial','2026-08-21 18:14:21.296058');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fichas_atencion`
--

DROP TABLE IF EXISTS `fichas_atencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas_atencion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo_piel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alergias_conocidas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notas_terapeuta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `cita_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cita_id` (`cita_id`),
  CONSTRAINT `fichas_atencion_cita_id_b570a255_fk_citas_id` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fichas_atencion`
--

LOCK TABLES `fichas_atencion` WRITE;
/*!40000 ALTER TABLE `fichas_atencion` DISABLE KEYS */;
INSERT INTO `fichas_atencion` VALUES (1,'Piel Sensible y Reactiva','Alergia a parabenos y fragancias sintéticas fuertes.','<script>alert(\'hack\')</script>','2026-09-25 16:12:05.974637','2026-09-25 21:12:06.895317',11),(2,'Piel Mixta con Tendencia Acneica','Ninguna alergia conocida declarada.','Limpieza facial profunda realizada con éxito. Se aplicó mascarilla revitalizante y crema hidratante.','2026-09-25 16:12:05.998423','2026-09-25 16:12:05.998443',12),(3,'Piel Sensible','Sin alergias','Cita de control agendada para sustento y demostración en vivo.','2026-09-25 16:12:06.045452','2026-09-25 16:12:06.045493',14);
/*!40000 ALTER TABLE `fichas_atencion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_caja`
--

DROP TABLE IF EXISTS `movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EFECTIVO',
  `fecha_registro` datetime(6) NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cita_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_caja_cita_id_6a81fee1_fk_citas_id` (`cita_id`),
  KEY `movimientos_caja_tipo_771b0e22` (`tipo`),
  KEY `movimientos_caja_fecha_registro_0fba2e78` (`fecha_registro`),
  CONSTRAINT `movimientos_caja_cita_id_6a81fee1_fk_citas_id` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
INSERT INTO `movimientos_caja` VALUES (1,'INGRESO','',120.00,'EFECTIVO','2026-09-18 22:39:20.830342','Reserva Web SQ-20260920-8A891 - Juan Perez Test (Masaje Relajante)',7),(2,'INGRESO','',150.00,'EFECTIVO','2026-09-18 22:41:11.787397','Reserva Web SQ-20260918-B0856 - Alexis  Bryan (Limpieza Facial Profunda)',8),(3,'INGRESO','',120.00,'EFECTIVO','2026-09-18 22:50:38.157022','Reserva Web SQ-20260918-7F2E2 - ANTHONY LUQE (Masaje Relajante)',9),(4,'INGRESO','',150.00,'EFECTIVO','2026-09-22 22:55:54.915647','Reserva Web SQ-20260922-81E88 - Alexis Mango (Limpieza Facial Profunda)',10),(5,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260925-0042)',96.00,'EFECTIVO','2026-09-25 16:12:05.984138','Cobro de reserva web confirmada',11),(6,'INGRESO','Cobro de Cita Limpieza Facial (SQ-20260925-0043)',150.00,'TARJETA','2026-09-25 16:12:06.017122','Atención completada en cabina 2',12),(7,'INGRESO','Cobro de Cita Hidroterapia (SQ-20260925-0044)',153.00,'YAPE','2026-09-25 16:12:06.031047','Pago adelantado vía Yape',13),(8,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260924-111)',120.00,'EFECTIVO','2026-09-25 16:12:06.055557','Atención completada',15),(9,'INGRESO','Cobro de Cita Limpieza Facial Profunda (SQ-20260924-112)',150.00,'TARJETA','2026-09-25 16:12:06.064990','Atención completada',16),(10,'INGRESO','Cobro de Cita Envoltura Corporal & Hidroterapia (SQ-20260923-121)',153.00,'YAPE','2026-09-25 16:12:06.076662','Atención completada',17),(11,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260923-122)',96.00,'TARJETA','2026-09-25 16:12:06.086438','Atención completada',18),(12,'INGRESO','Cobro de Cita Limpieza Facial Profunda (SQ-20260922-131)',150.00,'EFECTIVO','2026-09-25 16:12:06.096558','Atención completada',19),(13,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260922-132)',120.00,'PLIN','2026-09-25 16:12:06.106162','Atención completada',20),(14,'INGRESO','Cobro de Cita Envoltura Corporal & Hidroterapia (SQ-20260921-141)',180.00,'TARJETA','2026-09-25 16:12:06.117364','Atención completada',21),(15,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260921-142)',120.00,'EFECTIVO','2026-09-25 16:12:06.129430','Atención completada',22),(16,'INGRESO','Cobro de Cita Limpieza Facial Profunda (SQ-20260920-151)',150.00,'TARJETA','2026-09-25 16:12:06.143388','Atención completada',23),(17,'INGRESO','Cobro de Cita Envoltura Corporal & Hidroterapia (SQ-20260920-152)',153.00,'YAPE','2026-09-25 16:12:06.153376','Atención completada',24),(18,'INGRESO','Cobro de Cita Masaje Relajante (SQ-20260919-161)',120.00,'EFECTIVO','2026-09-25 16:12:06.163762','Atención completada',25),(19,'INGRESO','Cobro de Cita Limpieza Facial Profunda (SQ-20260919-162)',150.00,'TARJETA','2026-09-25 16:12:06.172009','Atención completada',26),(20,'INGRESO','',150.00,'EFECTIVO','2026-09-25 16:57:17.500291','Reserva Web SQ-20261015-9598E - Shirley Mango (Limpieza Facial Profunda)',27);
/*!40000 ALTER TABLE `movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `referencia_tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha_registro` datetime(6) NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `producto_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_inventario_producto_id_07c8fa25_fk_productos_id` (`producto_id`),
  KEY `movimientos_inventario_tipo_def93c81` (`tipo`),
  KEY `movimientos_inventario_fecha_registro_876bcefc` (`fecha_registro`),
  CONSTRAINT `movimientos_inventario_producto_id_07c8fa25_fk_productos_id` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,'ENTRADA_COMPRA',30.00,18.00,'COMPRA_INICIAL',NULL,'2026-08-21 18:14:33.406875','Stock inicial de apertura',1),(2,'ENTRADA_COMPRA',25.00,22.50,'COMPRA_INICIAL',NULL,'2026-08-21 18:14:33.417447','Stock inicial de apertura',2),(3,'ENTRADA_COMPRA',20.00,25.00,'COMPRA_INICIAL',NULL,'2026-08-21 18:14:33.427425','Stock inicial de apertura',3),(4,'ENTRADA_COMPRA',25.00,15.00,'COMPRA_INICIAL',NULL,'2026-08-21 18:14:33.436792','Stock inicial de apertura',4),(5,'ENTRADA_COMPRA',35.00,12.00,'COMPRA_INICIAL',NULL,'2026-08-21 18:14:33.447686','Stock inicial de apertura',5),(6,'SALIDA_CONSUMO_SERVICIO',1.00,18.00,'CITA',9,'2026-09-18 23:11:30.903167','Consumo en atención de cita SQ-20260918-7F2E2 (Masaje Relajante)',1),(7,'SALIDA_CONSUMO_SERVICIO',1.00,22.50,'CITA',9,'2026-09-18 23:11:30.909450','Consumo en atención de cita SQ-20260918-7F2E2 (Masaje Relajante)',2),(8,'SALIDA_CONSUMO_SERVICIO',1.00,15.00,'CITA',12,'2026-09-25 16:12:06.003053','Consumo en atención de limpieza facial SQ-20260925-0043',4),(9,'SALIDA_CONSUMO_SERVICIO',1.00,22.50,'CITA',12,'2026-09-25 16:12:06.010939','Consumo en atención de limpieza facial SQ-20260925-0043',2);
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `stock_actual` decimal(10,2) NOT NULL,
  `stock_minimo_alerta` decimal(10,2) NOT NULL,
  `unidad_medida` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Aceite Esencial','',18.00,29.00,5.00,'frascos (100ml)',1,'2026-08-21 18:14:33.400553','2026-09-18 23:11:30.901731'),(2,'Crema Hidratante','',22.50,24.00,5.00,'potes (250gr)',1,'2026-08-21 18:14:33.412639','2026-09-18 23:11:30.908256'),(3,'Exfoliante Corporal','',25.00,20.00,5.00,'frascos (300gr)',1,'2026-08-21 18:14:33.422839','2026-08-21 18:14:33.422856'),(4,'Mascarilla Facial','',15.00,25.00,5.00,'sobres',1,'2026-08-21 18:14:33.432748','2026-08-21 18:14:33.432766'),(5,'Sales de Baño','',12.00,35.00,5.00,'bolsas (500gr)',1,'2026-08-21 18:14:33.442568','2026-08-21 18:14:33.442590');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promociones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_cupon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcentaje_descuento` decimal(5,2) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_cupon` (`codigo_cupon`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promociones`
--

LOCK TABLES `promociones` WRITE;
/*!40000 ALTER TABLE `promociones` DISABLE KEYS */;
INSERT INTO `promociones` VALUES (1,'Bienvenida Sumaq Spa','20% de descuento en tu primera reserva online.','SUMAQBIENVENIDA',20.00,'2026-01-01','2026-12-31',1,'2026-08-21 18:14:33.507245','2026-08-21 18:14:33.507260'),(2,'Día de Relajación','15% de descuento en todos nuestros tratamientos y masajes.','RELAXDAY',15.00,'2026-01-01','2026-12-31',1,'2026-08-21 18:14:33.514374','2026-08-21 18:14:33.514388');
/*!40000 ALTER TABLE `promociones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recetas_servicio`
--

DROP TABLE IF EXISTS `recetas_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas_servicio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cantidad_requerida` decimal(10,2) NOT NULL,
  `producto_id` bigint NOT NULL,
  `servicio_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recetas_servicio_servicio_id_producto_id_5a43648b_uniq` (`servicio_id`,`producto_id`),
  KEY `recetas_servicio_producto_id_9a69ecab_fk_productos_id` (`producto_id`),
  CONSTRAINT `recetas_servicio_producto_id_9a69ecab_fk_productos_id` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `recetas_servicio_servicio_id_6e353b15_fk_servicios_id` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recetas_servicio`
--

LOCK TABLES `recetas_servicio` WRITE;
/*!40000 ALTER TABLE `recetas_servicio` DISABLE KEYS */;
INSERT INTO `recetas_servicio` VALUES (1,1.00,1,1),(2,1.00,2,1),(3,1.00,4,2),(4,1.00,2,2),(5,1.00,3,3),(6,1.00,5,3);
/*!40000 ALTER TABLE `recetas_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_publico` decimal(10,2) NOT NULL,
  `duracion_min` int unsigned NOT NULL,
  `imagen_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  CONSTRAINT `servicios_chk_1` CHECK ((`duracion_min` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Masaje Relajante','Masaje corporal antiestrés con aceites esenciales botánicos y técnicas de relajación profunda.',120.00,60,'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',1,'2026-08-21 18:14:33.453978','2026-08-21 18:14:33.453996'),(2,'Limpieza Facial Profunda','Tratamiento dermoestético con exfoliación, vapor de ozono, extracción y mascarilla revitalizante.',150.00,60,'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',1,'2026-08-21 18:14:33.472756','2026-08-21 18:14:33.472773'),(3,'Envoltura Corporal & Hidroterapia','Inmersión relajante con sales marinas aromáticas y envoltura desintoxicante con exfoliación corporal.',180.00,60,'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800',1,'2026-08-21 18:14:33.489804','2026-08-21 18:14:33.489822');
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios_adicionales_atencion`
--

DROP TABLE IF EXISTS `servicios_adicionales_atencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios_adicionales_atencion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` int unsigned NOT NULL,
  `precio_unitario_historico` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `ficha_atencion_id` bigint NOT NULL,
  `servicio_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `servicios_adicionale_ficha_atencion_id_ac816f16_fk_fichas_at` (`ficha_atencion_id`),
  KEY `servicios_adicionale_servicio_id_a6b74897_fk_servicios` (`servicio_id`),
  CONSTRAINT `servicios_adicionale_ficha_atencion_id_ac816f16_fk_fichas_at` FOREIGN KEY (`ficha_atencion_id`) REFERENCES `fichas_atencion` (`id`),
  CONSTRAINT `servicios_adicionale_servicio_id_a6b74897_fk_servicios` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`),
  CONSTRAINT `servicios_adicionales_atencion_chk_1` CHECK ((`cantidad` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios_adicionales_atencion`
--

LOCK TABLES `servicios_adicionales_atencion` WRITE;
/*!40000 ALTER TABLE `servicios_adicionales_atencion` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicios_adicionales_atencion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terapeutas`
--

DROP TABLE IF EXISTS `terapeutas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terapeutas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `especialidad` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `cabina_id` bigint DEFAULT NULL,
  `usuario_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `terapeutas_cabina_id_98bcabbc_fk_cabinas_id` (`cabina_id`),
  CONSTRAINT `terapeutas_cabina_id_98bcabbc_fk_cabinas_id` FOREIGN KEY (`cabina_id`) REFERENCES `cabinas` (`id`),
  CONSTRAINT `terapeutas_usuario_id_f52f5cf7_fk_usuarios_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terapeutas`
--

LOCK TABLES `terapeutas` WRITE;
/*!40000 ALTER TABLE `terapeutas` DISABLE KEYS */;
INSERT INTO `terapeutas` VALUES (1,'Terapias Holísticas y Masajes Descontracturantes','https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600',1,1,2),(2,'Dermoestética y Cosmiatría Facial','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',1,2,3),(3,'Hidroterapia, Exfoliaciones y Rituales Corporales','https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',1,3,4);
/*!40000 ALTER TABLE `terapeutas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `usuarios_rol_fc700569` (`rol`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'pbkdf2_sha256$870000$q5EgCORSeisJCeWqqIEAx5$JqyGisaOU7p3RvroD1SB1sCy5I7ctXTlVCNIclhiWVE=',NULL,1,'admin@sumaqspa.pe','Administrador General Sumaq','ADMIN',1,1,'2026-08-21 18:14:31.176755','2026-09-25 20:28:32.894326'),(2,'pbkdf2_sha256$870000$MRNBedUcPxHziBXw1xtViG$5xNoRWBNvufkcooYnVDhPGoR/E4+M6o+SzDDN60j5u8=',NULL,0,'elena.morales@sumaqspa.pe','Elena Morales','TERAPEUTA',1,0,'2026-08-21 18:14:31.747739','2026-09-25 20:28:33.996322'),(3,'pbkdf2_sha256$870000$2sbcF0U4t66T59W1p7cSRL$yqzRvFm9WR4GZRCurBLw/7SdZDEgRmyAd2LkVx3+BB4=',NULL,0,'camila.vega@sumaqspa.pe','Camila Vega','TERAPEUTA',1,0,'2026-08-21 18:14:32.319022','2026-09-25 20:28:34.472729'),(4,'pbkdf2_sha256$870000$lktqgw3LIxoEu3vcOKtGq0$3dSaHm7niULHe6TjyIAwGMyiwiOiRbyiCWb2/+I66cw=',NULL,0,'lucia.ramos@sumaqspa.pe','Lucía Ramos','TERAPEUTA',1,0,'2026-08-21 18:14:32.865562','2026-09-25 20:28:34.937955'),(5,'pbkdf2_sha256$870000$1jd58ic7w3jEkFICrLmzb7$j6Nvz/uVDqX1SAbCQL+4iFO2SYz3pImvlRqE/ib01FA=',NULL,0,'recepcion@sumaqspa.pe','Valeria Quispe','RECEPCIONISTA',1,0,'2026-09-25 16:12:03.613757','2026-09-25 20:28:33.449703');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_groups`
--

DROP TABLE IF EXISTS `usuarios_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_groups_user_id_group_id_7afcf963_uniq` (`user_id`,`group_id`),
  KEY `usuarios_groups_group_id_18c61092_fk_auth_group_id` (`group_id`),
  CONSTRAINT `usuarios_groups_group_id_18c61092_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `usuarios_groups_user_id_2e7c7c45_fk_usuarios_id` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_groups`
--

LOCK TABLES `usuarios_groups` WRITE;
/*!40000 ALTER TABLE `usuarios_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_user_permissions`
--

DROP TABLE IF EXISTS `usuarios_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_user_permissions_user_id_permission_id_4166b112_uniq` (`user_id`,`permission_id`),
  KEY `usuarios_user_permis_permission_id_af615ca1_fk_auth_perm` (`permission_id`),
  CONSTRAINT `usuarios_user_permis_permission_id_af615ca1_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `usuarios_user_permissions_user_id_f5777c78_fk_usuarios_id` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_user_permissions`
--

LOCK TABLES `usuarios_user_permissions` WRITE;
/*!40000 ALTER TABLE `usuarios_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sumaq_spa'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-25 16:48:24
