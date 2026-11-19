# PDF Builder - Shared Styles and Helper Functions
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether, PageBreak, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Cover page (page 1) doesn't have standard header/footer
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor('#2563eb'))
            self.drawString(36, 758, "FLAGFORGE")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(95, 758, "|  Production Feature Flag & Release Management Platform")
            self.drawRightString(576, 758, "Complete Master Architecture & SDE Guide (Hinglish)")
            
            self.setStrokeColor(colors.HexColor('#e2e8f0'))
            self.setLineWidth(0.75)
            self.line(36, 752, 576, 752)
            
            # Footer
            self.line(36, 32, 576, 32)
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(36, 22, "FlagForge Engineering Portfolio  *  MurmurHash3  *  Redis hot-path  *  Fail-safe Node SDK")
            self.drawRightString(576, 22, f"Page {self._pageNumber} of {page_count}")
            
        self.restoreState()

# Styles
base_styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    'CoverTitle',
    fontName='Helvetica-Bold',
    fontSize=26,
    leading=30,
    textColor=colors.HexColor('#0f172a'),
    spaceAfter=8
)

style_cover_sub = ParagraphStyle(
    'CoverSubtitle',
    fontName='Helvetica',
    fontSize=13,
    leading=18,
    textColor=colors.HexColor('#2563eb'),
    spaceAfter=15
)

style_cover_desc = ParagraphStyle(
    'CoverDesc',
    fontName='Helvetica',
    fontSize=9.5,
    leading=15,
    textColor=colors.HexColor('#475569'),
    spaceAfter=10
)

style_h1 = ParagraphStyle(
    'Heading1',
    fontName='Helvetica-Bold',
    fontSize=13.5,
    leading=17,
    textColor=colors.HexColor('#0f172a'),
    spaceBefore=14,
    spaceAfter=6,
    keepWithNext=True
)

style_h2 = ParagraphStyle(
    'Heading2',
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=14,
    textColor=colors.HexColor('#1d4ed8'),
    spaceBefore=9,
    spaceAfter=4,
    keepWithNext=True
)

style_h3 = ParagraphStyle(
    'Heading3',
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.HexColor('#334155'),
    spaceBefore=6,
    spaceAfter=3,
    keepWithNext=True
)

style_body = ParagraphStyle(
    'Body',
    fontName='Helvetica',
    fontSize=8.5,
    leading=13,
    textColor=colors.HexColor('#334155'),
    spaceAfter=5
)

style_body_bold = ParagraphStyle(
    'BodyBold',
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=13,
    textColor=colors.HexColor('#0f172a'),
    spaceAfter=5
)

style_callout = ParagraphStyle(
    'CalloutText',
    fontName='Helvetica',
    fontSize=8.2,
    leading=12,
    textColor=colors.HexColor('#1e293b')
)

style_code = ParagraphStyle(
    'CodeText',
    fontName='Courier',
    fontSize=7.2,
    leading=9.5,
    textColor=colors.HexColor('#f8fafc')
)

style_table_cell = ParagraphStyle(
    'TableCell',
    fontName='Helvetica',
    fontSize=7.8,
    leading=10.5,
    textColor=colors.HexColor('#1e293b')
)

style_table_header = ParagraphStyle(
    'TableHeader',
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11,
    textColor=colors.white
)

def make_p(text, bold=False):
    return Paragraph(text, style_body_bold if bold else style_body)

def make_h1(text, module_tag=None):
    if module_tag:
        full_text = f"<font color='#2563eb'>[{module_tag}]</font> {text}"
    else:
        full_text = text
    return Paragraph(full_text, style_h1)

def make_h2(text):
    return Paragraph(text, style_h2)

def make_h3(text):
    return Paragraph(text, style_h3)

def make_callout(text, alert_type="note", title=None):
    bg_color = colors.HexColor('#eff6ff')
    border_color = colors.HexColor('#2563eb')
    
    if alert_type == "tip" or alert_type == "success":
        bg_color = colors.HexColor('#f0fdf4')
        border_color = colors.HexColor('#16a34a')
    elif alert_type == "warning" or alert_type == "alert":
        bg_color = colors.HexColor('#fff1f2')
        border_color = colors.HexColor('#e11d48')
    elif alert_type == "neutral":
        bg_color = colors.HexColor('#f8fafc')
        border_color = colors.HexColor('#64748b')

    content = ""
    if title:
        content += f"<b>{title}</b><br/>"
    content += text
    
    p = Paragraph(content, style_callout)
    table = Table([[p]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('LINEBEFORE', (0,0), (0,-1), 3.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    return table

def make_code_block(code_text):
    clean_code = code_text.strip()
    p = Preformatted(clean_code, style_code)
    table = Table([[p]], colWidths=[540])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    return table

def make_table(headers, rows, col_widths=None):
    if not col_widths:
        col_count = len(headers)
        col_widths = [540 / col_count] * col_count
        
    table_data = []
    header_row = [Paragraph(f"<b>{h}</b>", style_table_header) for h in headers]
    table_data.append(header_row)
    
    for r in rows:
        row_cells = []
        for cell in r:
            if isinstance(cell, str):
                row_cells.append(Paragraph(cell, style_table_cell))
            else:
                row_cells.append(cell)
        table_data.append(row_cells)
        
    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
    ]))
    return t

def make_spacer(h=6):
    return Spacer(1, h)

def make_divider(color='#e2e8f0', thickness=0.75):
    return HRFlowable(width="100%", thickness=thickness, color=colors.HexColor(color), spaceBefore=6, spaceAfter=8)
