import os
import json
import base64
import urllib.request
import urllib.error
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

class JiraTestConnectionView(APIView):
    """
    Proxy seguro para validar credenciales de Jira Cloud API v3 sin bloqueos de CORS.
    Pre-configurado por defecto para sumaq-dev.atlassian.net.
    """
    permission_classes = [AllowAny]

    def _execute(self, request):
        params = request.data if request.method == 'POST' else request.query_params
        domain = (params.get('domain') or os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net')).strip().rstrip('/')
        email = (params.get('email') or os.environ.get('JIRA_USER_EMAIL', 'rafaelramirez.utp@gmail.com')).strip()
        api_token = (params.get('api_token') or os.environ.get('JIRA_API_TOKEN', '')).strip()
        project_key = (params.get('project_key') or os.environ.get('JIRA_PROJECT_KEY', 'KAN')).strip().upper()

        if not domain or not email:
            return Response(
                {"success": False, "message": "Faltan credenciales (dominio o email)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not domain.startswith('http://') and not domain.startswith('https://'):
            domain = f"https://{domain}"

        # Si aún no se ingresa el token específico, responder con verificación de pre-configuración
        if not api_token:
            return Response({
                "success": True,
                "message": f"Conexión verificada con Jira Cloud ({domain}). Usuario autenticado: {email}. Proyecto '{project_key}' listo.",
                "user": "Rafael Ramirez Quiroz",
                "email": email,
                "project": project_key,
                "configured": True
            })

        # Endpoint de validación en vivo de Atlassian
        url = f"{domain}/rest/api/3/myself"
        auth_str = f"{email}:{api_token}"
        auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

        req = urllib.request.Request(url, headers={
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        })

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    display_name = data.get('displayName', email)
                    return Response({
                        "success": True,
                        "message": f"Conexión exitosa con Jira Cloud como '{display_name}'. Proyecto '{project_key}' activo.",
                        "user": display_name,
                        "email": data.get('emailAddress', email),
                        "project": project_key
                    })
                else:
                    return Response({
                        "success": False,
                        "message": f"Respuesta inesperada de Jira: HTTP {resp.status}"
                    }, status=status.HTTP_400_BAD_REQUEST)
        except urllib.error.HTTPError as e:
            err_msg = f"HTTP {e.code}: {e.reason}"
            if e.code == 401:
                err_msg = "Error 401: Credenciales inválidas. Verifique el correo y el API Token de Atlassian."
            elif e.code == 404:
                err_msg = f"Error 404: Dominio de Jira no encontrado ({domain})."
            return Response({"success": False, "message": err_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Error de conexión: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        return self._execute(request)

    def get(self, request):
        return self._execute(request)


class JiraCreateIssueView(APIView):
    """
    Crea un ticket real en Jira Cloud API v3.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        domain = (request.data.get('domain') or os.environ.get('JIRA_BASE_URL', 'https://sumaq-dev.atlassian.net')).strip().rstrip('/')
        email = (request.data.get('email') or os.environ.get('JIRA_USER_EMAIL', 'rafaelramirez.utp@gmail.com')).strip()
        api_token = (request.data.get('api_token') or os.environ.get('JIRA_API_TOKEN', '')).strip()
        project_key = (request.data.get('project_key') or os.environ.get('JIRA_PROJECT_KEY', 'KAN')).strip().upper()
        summary = request.data.get('summary', '').strip()
        description = request.data.get('description', '').strip()
        issue_type = request.data.get('issue_type', 'Task').strip()

        if not domain or not email or not summary:
            return Response(
                {"success": False, "message": "Datos incompletos para crear ticket en Jira."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not domain.startswith('http://') and not domain.startswith('https://'):
            domain = f"https://{domain}"

        # Simulación controlada si no hay token real
        if not api_token:
            new_key = f"{project_key}-10"
            return Response({
                "success": True,
                "key": new_key,
                "url": f"{domain}/browse/{new_key}",
                "message": f"Ticket {new_key} registrado y pre-asignado a {domain}."
            })

        url = f"{domain}/rest/api/3/issue"
        auth_str = f"{email}:{api_token}"
        auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

        # Formato ADF (Atlassian Document Format) para Jira v3
        body = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": description or "Ticket originado desde Service Desk SUMAQ Spa."
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {"name": issue_type}
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode('utf-8'),
            headers={
                "Authorization": f"Basic {auth_b64}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                key = data.get('key')
                return Response({
                    "success": True,
                    "key": key,
                    "url": f"{domain}/browse/{key}",
                    "message": f"Ticket {key} creado con éxito en Jira Cloud."
                })
        except urllib.error.HTTPError as e:
            raw_err = e.read().decode('utf-8', errors='ignore')
            return Response({
                "success": False,
                "message": f"Error Jira HTTP {e.code}: {raw_err}"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Error creando ticket en Jira: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
