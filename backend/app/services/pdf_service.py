import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class PDFReportService:
    @classmethod
    def generate_comprehensive_farm_report(
        cls,
        farm_data: dict,
        soil_eval: dict,
        nasa_data: dict,
        rotation_data: dict
    ) -> bytes:
        """
        Generates a professional PDF report containing Farm summary, Soil test analysis,
        NASA satellite metrics, 3-strategy rotation comparison, and environmental risk advisory.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Primary AgriSense Green
        primary_color = colors.HexColor("#238636")
        dark_green = colors.HexColor("#166534")
        light_bg = colors.HexColor("#f0fdf4")
        border_color = colors.HexColor("#bbf7d0")
        text_dark = colors.HexColor("#1e293b")

        # Custom Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=primary_color,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12
        )
        heading_style = ParagraphStyle(
            'ReportHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=dark_green,
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=text_dark
        )
        body_bold = ParagraphStyle(
            'ReportBodyBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=text_dark
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("AgriSense AI – Farm Health & Crop Rotation Report", title_style))
        elements.append(Paragraph(f"Smart Soil Health & Earth Observation Decision Platform • Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=14))

        # 2. Farm Information
        elements.append(Paragraph("1. Farm Overview & Profile", heading_style))
        farm_table_data = [
            [
                Paragraph("<b>Farm Name:</b>", body_style), Paragraph(farm_data.get("name", "N/A"), body_style),
                Paragraph("<b>Location:</b>", body_style), Paragraph(f"{farm_data.get('district', '')}, {farm_data.get('state', '')}", body_style)
            ],
            [
                Paragraph("<b>Coordinates:</b>", body_style), Paragraph(f"{farm_data.get('latitude', 0.0):.4f}° N, {farm_data.get('longitude', 0.0):.4f}° E", body_style),
                Paragraph("<b>Total Area:</b>", body_style), Paragraph(f"{farm_data.get('area_acres', 0.0)} Acres", body_style)
            ],
            [
                Paragraph("<b>Soil Type:</b>", body_style), Paragraph(farm_data.get("soil_type", "Alluvial"), body_style),
                Paragraph("<b>Irrigation:</b>", body_style), Paragraph(farm_data.get("irrigation_type", "Canal/Borewell"), body_style)
            ],
            [
                Paragraph("<b>Current Crops:</b>", body_style), Paragraph(", ".join(farm_data.get("current_crops", ["Rice"])), body_style),
                Paragraph("<b>Previous Crops:</b>", body_style), Paragraph(", ".join(farm_data.get("previous_crops", ["Black Gram"])), body_style)
            ]
        ]
        farm_table = Table(farm_table_data, colWidths=[110, 150, 110, 150])
        farm_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(farm_table)
        elements.append(Spacer(1, 12))

        # 3. Soil Health Assessment
        elements.append(Paragraph("2. Soil Health Laboratory Analysis & Scorecard", heading_style))
        composite_score = soil_eval.get("composite_health_score", 75.0)
        grade = soil_eval.get("grade", "Good")
        params = soil_eval.get("parameters", {})

        soil_table_data = [
            [Paragraph("<b>Parameter</b>", body_bold), Paragraph("<b>Observed</b>", body_bold), Paragraph("<b>Optimal Range</b>", body_bold), Paragraph("<b>Agronomic Status</b>", body_bold)],
            [Paragraph("pH (Reaction)", body_style), Paragraph(str(params.get("ph", {}).get("value", "N/A")), body_style), Paragraph(params.get("ph", {}).get("optimal_range", "6.5-7.5"), body_style), Paragraph(params.get("ph", {}).get("status", "Normal"), body_style)],
            [Paragraph("Available Nitrogen (N)", body_style), Paragraph(f"{params.get('nitrogen', {}).get('value', 'N/A')} kg/ha", body_style), Paragraph(params.get("nitrogen", {}).get("optimal_range", "280-560"), body_style), Paragraph(params.get("nitrogen", {}).get("status", "Normal"), body_style)],
            [Paragraph("Available Phosphorus (P)", body_style), Paragraph(f"{params.get('phosphorus', {}).get('value', 'N/A')} kg/ha", body_style), Paragraph(params.get("phosphorus", {}).get("optimal_range", "11-22"), body_style), Paragraph(params.get("phosphorus", {}).get("status", "Normal"), body_style)],
            [Paragraph("Available Potassium (K)", body_style), Paragraph(f"{params.get('potassium', {}).get('value', 'N/A')} kg/ha", body_style), Paragraph(params.get("potassium", {}).get("optimal_range", "118-280"), body_style), Paragraph(params.get("potassium", {}).get("status", "Normal"), body_style)],
            [Paragraph("Organic Carbon (OC)", body_style), Paragraph(f"{params.get('organic_carbon', {}).get('value', 'N/A')} %", body_style), Paragraph(params.get("organic_carbon", {}).get("optimal_range", "> 0.75%"), body_style), Paragraph(params.get("organic_carbon", {}).get("status", "Normal"), body_style)],
        ]
        soil_table = Table(soil_table_data, colWidths=[140, 100, 110, 170])
        soil_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(soil_table)
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"<b>Soil Health Composite Score:</b> {composite_score}/100 — <b>Rating:</b> {grade}", body_style))
        elements.append(Spacer(1, 10))

        # 4. NASA Earth Observation Metrics
        elements.append(Paragraph("3. NASA Earth Observation & Environmental Telemetry", heading_style))
        cur_nasa = nasa_data.get("current_metrics", {})
        nasa_table_data = [
            [Paragraph("<b>Satellite Dataset</b>", body_bold), Paragraph("<b>Parameter</b>", body_bold), Paragraph("<b>Telemetry Value</b>", body_bold), Paragraph("<b>Spatial Resolution</b>", body_bold)],
            [Paragraph("NASA POWER / MERRA-2", body_style), Paragraph("Mean Ambient Temp", body_style), Paragraph(f"{cur_nasa.get('avg_temp_c', 29.2)} °C", body_style), Paragraph("0.5° × 0.625°", body_style)],
            [Paragraph("NASA GPM IMERG Final", body_style), Paragraph("30-Day Precipitation", body_style), Paragraph(f"{cur_nasa.get('precipitation_30d_mm', 48.5)} mm", body_style), Paragraph("0.1° × 0.1° (~10 km)", body_style)],
            [Paragraph("NASA SMAP Radiometer", body_style), Paragraph("Root-Zone Moisture", body_style), Paragraph(f"{cur_nasa.get('smap_moisture_pct', 25.4)} % vol", body_style), Paragraph("9 km Gridded", body_style)],
            [Paragraph("NASA MODIS MOD13Q1", body_style), Paragraph("Canopy NDVI Index", body_style), Paragraph(f"{cur_nasa.get('ndvi', 0.54)} (Healthy)", body_style), Paragraph("250 meters", body_style)],
            [Paragraph("NASA SRTM v3 GL1", body_style), Paragraph("Digital Elevation / Slope", body_style), Paragraph(f"{cur_nasa.get('elevation_m', 24)} m / {cur_nasa.get('slope_pct', 0.9)}%", body_style), Paragraph("30 meters (1 arc-sec)", body_style)]
        ]
        nasa_table = Table(nasa_table_data, colWidths=[150, 130, 120, 120])
        nasa_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(nasa_table)
        elements.append(Spacer(1, 10))

        # 5. Crop Rotation Strategies Comparison
        elements.append(Paragraph("4. Multi-Criteria Crop Rotation Analysis & Comparison", heading_style))
        strategies = rotation_data.get("strategies", [])
        strat_rows = [
            [
                Paragraph("<b>Strategy Name</b>", body_bold),
                Paragraph("<b>Sequence</b>", body_bold),
                Paragraph("<b>MCDA Score</b>", body_bold),
                Paragraph("<b>Annual Water</b>", body_bold),
                Paragraph("<b>N Fixed</b>", body_bold),
                Paragraph("<b>Water Saved</b>", body_bold)
            ]
        ]
        for s in strategies:
            # Handle both dict and Pydantic model
            if isinstance(s, dict):
                s_name = s.get("name", "Strategy")
                s_score = s.get("overall_score", 0)
                s_water = s.get("estimated_annual_water_mm", 0)
                s_n = s.get("nitrogen_added_kg_ha", 0)
                s_savings = s.get("water_savings_pct", 0)
                seq_raw = s.get("crop_sequence", [])
            else:
                s_name = getattr(s, "name", "Strategy")
                s_score = getattr(s, "overall_score", 0)
                s_water = getattr(s, "estimated_annual_water_mm", 0)
                s_n = getattr(s, "nitrogen_added_kg_ha", 0)
                s_savings = getattr(s, "water_savings_pct", 0)
                seq_raw = getattr(s, "crop_sequence", [])

            step_names = []
            for step in seq_raw:
                if isinstance(step, dict):
                    step_names.append(step.get("crop_name", ""))
                else:
                    step_names.append(getattr(step, "crop_name", str(step)))
            c_seq = " -> ".join(step_names)

            strat_rows.append([
                Paragraph(f"<b>{s_name}</b>", body_style),
                Paragraph(c_seq, body_style),
                Paragraph(f"<b>{s_score}/100</b>", body_style),
                Paragraph(f"{s_water} mm", body_style),
                Paragraph(f"+{s_n} kg/ha", body_style),
                Paragraph(f"{s_savings}%", body_style)
            ])
        strat_table = Table(strat_rows, colWidths=[140, 150, 60, 60, 55, 55])
        strat_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(strat_table)
        elements.append(Spacer(1, 12))

        # 6. Agronomic Advisory & Action Plan
        elements.append(Paragraph("5. Scientific Advisory & Action Plan", heading_style))
        recomms = soil_eval.get("recommendations", [])
        for r in recomms:
            elements.append(Paragraph(f"• {r}", body_style))
            elements.append(Spacer(1, 2))

        elements.append(Spacer(1, 10))
        # Disclaimer
        disclaimer_text = (
            "<b>Disclaimer:</b> AgriSense AI model scoring and recommendations utilize NASA Earth observation telemetry "
            "and agronomic heuristics. Crop yields and soil biology depend upon localized weather fluctuations and management practices. "
            "No specific crop yield is unconditionally guaranteed."
        )
        elements.append(Paragraph(disclaimer_text, ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor("#64748b"))))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
