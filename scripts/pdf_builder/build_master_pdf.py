# PDF Builder - Master Document Compiler
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate

# Add parent directory to path to allow imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from pdf_builder.styles import NumberedCanvas
from pdf_builder.cover_and_intro import build_cover_and_intro
from pdf_builder.modules_1_to_4 import build_modules_1_to_4
from pdf_builder.modules_5_to_8 import build_modules_5_to_8
from pdf_builder.modules_9_to_12 import build_modules_9_to_12
from pdf_builder.modules_13_to_16 import build_modules_13_to_16

def generate_master_pdf(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 0.5 inch (36pt) margins for maximum clean content real estate
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )
    
    story = []
    
    print("Compiling Cover Page & Executive Roadmap...")
    story.extend(build_cover_and_intro())
    
    print("Compiling Modules 1 to 4 (Product, Tech Stack, Directory, Architecture)...")
    story.extend(build_modules_1_to_4())
    
    print("Compiling Modules 5 to 8 (Backend, Database, Auth RBAC, Evaluation Funnel)...")
    story.extend(build_modules_5_to_8())
    
    print("Compiling Modules 9 to 12 (Rule Engine & MurmurHash3, Redis, SDK, Frontend)...")
    story.extend(build_modules_9_to_12())
    
    print("Compiling Modules 13 to 16 (Security, Release Walkthrough, Testing, Interview Q&A)...")
    story.extend(build_modules_13_to_16())
    
    print(f"Building PDF canvas with NumberedCanvas into: {output_path}...")
    doc.build(story, canvasmaker=NumberedCanvas)
    
    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"SUCCESS: Master PDF built successfully! Size: {file_size_kb:.2f} KB")

if __name__ == '__main__':
    # __file__ is scripts/pdf_builder/build_master_pdf.py
    # 1 dirname -> scripts/pdf_builder
    # 2 dirname -> scripts
    # 3 dirname -> FlagForge
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    target_pdf = os.path.join(project_root, "docs", "FlagForge_Master_Engineering_and_Interview_Guide.pdf")
    generate_master_pdf(target_pdf)
