# FlagForge Master Engineering and Interview Guide PDF Generator
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether, PageBreak, Preformatted
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
            self.drawString(90, 758, "|   Production-Grade Feature Flag & Release Management Platform")
            self.drawRightString(576, 758, "Complete Master Engineering & SDE Interview Guide")
            
            self.setStrokeColor(colors.HexColor('#e2e8f0'))
            self.setLineWidth(0.75)
            self.line(36, 752, 576, 752)
            
            # Footer
            self.line(36, 32, 576, 32)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(36, 22, "FlagForge Architecture, Hot-Path Engine, SDK & System Design Guide (Hinglish)")
            self.drawRightString(576, 22, f"Page {self._pageNumber} of {page_count}")
            
        self.restoreState()

print("Canvas class defined successfully")
