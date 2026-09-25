import pymysql

pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.install_as_MySQLdb()

# Bypass de verificación de versión de MariaDB para compatibilidad con XAMPP (MariaDB 10.4.x)
from django.db.backends.mysql.base import DatabaseWrapper
DatabaseWrapper.check_database_version_supported = lambda self: None

# MariaDB < 10.5 no soporta la cláusula RETURNING en INSERT
from django.db.backends.mysql.features import DatabaseFeatures
setattr(
    DatabaseFeatures,
    'can_return_columns_from_insert',
    property(lambda self: self.connection.mysql_is_mariadb and self.connection.mysql_version >= (10, 5, 0))
)

