from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class BusinessLogicError(Exception):
    def __init__(self, message, code="BUSINESS_ERROR", status_code=status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class ResourceConflictError(BusinessLogicError):
    def __init__(self, message="Conflicto de recursos o solapamiento de turno detectado."):
        super().__init__(
            message=message,
            code="RESOURCE_CONFLICT",
            status_code=status.HTTP_409_CONFLICT
        )


class ClientAlreadyHasAppointmentError(BusinessLogicError):
    def __init__(self, message="El cliente ya cuenta con una cita registrada para la fecha seleccionada."):
        super().__init__(
            message=message,
            code="CLIENT_HAS_APPOINTMENT_SAME_DAY",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class InsufficientStockError(BusinessLogicError):
    def __init__(self, message="Stock insuficiente para completar la atención con la receta indicada."):
        super().__init__(
            message=message,
            code="INSUFFICIENT_STOCK",
            status_code=status.HTTP_400_BAD_REQUEST
        )


def custom_exception_handler(exc, context):
    if isinstance(exc, BusinessLogicError):
        return Response(
            {
                'success': False,
                'error': {
                    'code': exc.code,
                    'message': exc.message
                }
            },
            status=exc.status_code
        )

    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR' if response.status_code == 400 else 'HTTP_ERROR',
                'message': 'Ocurrió un error al procesar la solicitud.',
                'details': response.data
            }
        }
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['error']['message'] = str(response.data['detail'])

        response.data = custom_data

    return response
