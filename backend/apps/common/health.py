import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import connection
from django.utils import timezone


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_status = "healthy"
        latency_ms = 0.0

        try:
            start = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            latency_ms = round((time.time() - start) * 1000, 2)
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
            return Response(
                {
                    "status": "unhealthy",
                    "database": db_status,
                    "database_latency_ms": latency_ms,
                    "timestamp": timezone.now().isoformat()
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({
            "status": "healthy",
            "database": "healthy",
            "database_latency_ms": latency_ms,
            "timestamp": timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
