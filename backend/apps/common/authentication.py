from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class QueryParamJWTAuthentication(JWTAuthentication):
    """
    Extiende JWTAuthentication para permitir token en la URL (?token=...)
    especialmente útil para streaming o descarga de comprobantes PDF en enlaces directos.
    """
    def authenticate(self, request):
        raw_token = request.query_params.get('token')
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except Exception:
                raise AuthenticationFailed('Token inválido o expirado en parámetro de URL.')

        return super().authenticate(request)
