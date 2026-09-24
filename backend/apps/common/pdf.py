import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generar_comprobante_pdf(cita):
    """
    Genera un comprobante oficial en formato PDF para la cita especificada.
    Retorna los bytes del archivo PDF generado en memoria.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    color_primary = colors.HexColor('#8C6F55')
    color_dark = colors.HexColor('#2C2725')
    color_light_bg = colors.HexColor('#FAF8F5')
    color_accent = colors.HexColor('#C8907E')

    style_title = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=color_primary,
        alignment=TA_CENTER
    )

    style_subtitle = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=color_dark,
        alignment=TA_CENTER
    )

    style_section = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=color_primary,
        spaceAfter=6
    )

    style_normal = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=color_dark
    )

    style_bold = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=color_dark
    )

    style_right = ParagraphStyle(
        'RightText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=color_dark,
        alignment=TA_RIGHT
    )

    style_right_bold = ParagraphStyle(
        'RightBoldText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=color_primary,
        alignment=TA_RIGHT
    )

    story = []

    # Encabezado Empresa
    story.append(Paragraph("SUMAQ SPA & CENTRO DE BIENESTAR", style_title))
    story.append(Paragraph("Santuario de Serenidad, Autocuidado y Terapias Holísticas", style_subtitle))
    story.append(Paragraph("RUC: 20608945123 • Av. La Encalada 1420, Santiago de Surco • Lima, Perú", style_subtitle))
    story.append(Spacer(1, 15))

    # Tarjeta de Datos de Reserva
    cita_data = [
        [
            Paragraph(f"<b>COMPROBANTE DE ATENCIÓN:</b> {cita.codigo_reserva}", style_bold),
            Paragraph(f"<b>Fecha de Emisión:</b> {cita.created_at.strftime('%d/%m/%Y %H:%M')}", style_right)
        ],
        [
            Paragraph(f"<b>Estado:</b> {cita.estado}", style_normal),
            Paragraph(f"<b>Método de Pago:</b> {cita.metodo_pago}", style_right)
        ]
    ]

    t_header = Table(cita_data, colWidths=[270, 260])
    t_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color_light_bg),
        ('BOX', (0, 0), (-1, -1), 1, color_accent),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 15))

    # Información de Cliente y Sesión
    story.append(Paragraph("DATOS DEL CLIENTE Y SERVICIO PROGRAMADO", style_section))

    cliente = cita.cliente
    terapeuta = cita.terapeuta
    cabina = cita.cabina

    info_data = [
        [
            Paragraph("<b>Cliente:</b>", style_bold),
            Paragraph(cliente.nombre_completo, style_normal),
            Paragraph("<b>DNI:</b>", style_bold),
            Paragraph(cliente.dni, style_normal)
        ],
        [
            Paragraph("<b>Teléfono:</b>", style_bold),
            Paragraph(cliente.telefono, style_normal),
            Paragraph("<b>Email:</b>", style_bold),
            Paragraph(cliente.email or "No registrado", style_normal)
        ],
        [
            Paragraph("<b>Fecha Cita:</b>", style_bold),
            Paragraph(cita.fecha.strftime('%d/%m/%Y'), style_normal),
            Paragraph("<b>Horario:</b>", style_bold),
            Paragraph(f"{cita.hora_inicio.strftime('%H:%M')} - {cita.hora_fin.strftime('%H:%M')}", style_normal)
        ],
        [
            Paragraph("<b>Terapeuta:</b>", style_bold),
            Paragraph(terapeuta.usuario.nombre_completo, style_normal),
            Paragraph("<b>Cabina:</b>", style_bold),
            Paragraph(f"{cabina.nombre} ({cabina.tipo})", style_normal)
        ]
    ]

    t_info = Table(info_data, colWidths=[80, 180, 70, 200])
    t_info.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E0D8')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # Detalle Económico
    story.append(Paragraph("DESGLOSE DE SERVICIOS Y CONSUMOS", style_section))

    items_data = [
        [
            Paragraph("<b>Ítem / Tratamiento</b>", style_bold),
            Paragraph("<b>Cant.</b>", style_bold),
            Paragraph("<b>Precio Unit.</b>", style_right_bold),
            Paragraph("<b>Subtotal</b>", style_right_bold)
        ],
        [
            Paragraph(f"{cita.servicio.nombre} (Tratamiento Base)", style_normal),
            Paragraph("1", style_normal),
            Paragraph(f"S/ {cita.servicio.precio_publico:.2f}", style_right),
            Paragraph(f"S/ {cita.subtotal:.2f}", style_right)
        ]
    ]

    # Agregar servicios adicionales si existen en la ficha
    ficha = getattr(cita, 'ficha_atencion', None)
    if ficha:
        for sa in ficha.servicios_adicionales.all():
            items_data.append([
                Paragraph(f"{sa.servicio.nombre} (Adicional en Sesión)", style_normal),
                Paragraph(str(sa.cantidad), style_normal),
                Paragraph(f"S/ {sa.precio_unitario_historico:.2f}", style_right),
                Paragraph(f"S/ {sa.subtotal:.2f}", style_right)
            ])

    # Totales
    if cita.descuento > 0:
        items_data.append([
            Paragraph(f"<b>Descuento Cupón ({cita.codigo_cupon_aplicado or 'Promoción'})</b>", style_normal),
            Paragraph("", style_normal),
            Paragraph("", style_right),
            Paragraph(f"- S/ {cita.descuento:.2f}", style_right)
        ])

    items_data.append([
        Paragraph("<b>TOTAL A PAGAR (PEN)</b>", style_right_bold),
        Paragraph("", style_normal),
        Paragraph("", style_right),
        Paragraph(f"<b>S/ {cita.monto_total:.2f}</b>", style_right_bold)
    ])

    t_items = Table(items_data, colWidths=[270, 40, 110, 110])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color_light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E0D8')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, -1), (2, -1)),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 20))

    # Términos y Condiciones
    story.append(Paragraph("TÉRMINOS Y POLÍTICA DE CANCELACIÓN", style_section))
    terminos_text = (
        "1. Por favor presentarse con 10 minutos de anticipación en el centro de bienestar.<br/>"
        "2. Las cancelaciones o reprogramaciones se aceptan sin penalidad con un mínimo de <b>24 horas de anticipación</b> "
        "a través de nuestro portal web ingresando su Código de Reserva y DNI.<br/>"
        "3. Cualquier condición médica especial o alergia debe ser comunicada a la terapeuta antes de iniciar la sesión.<br/>"
        "4. Comprobante emitido electrónicamente como constancia oficial de servicio."
    )
    story.append(Paragraph(terminos_text, style_normal))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
