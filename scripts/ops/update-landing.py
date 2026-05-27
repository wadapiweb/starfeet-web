import os
import shutil

source_dir = "/opt/docker/starfeet-web"
landing_dir = "/opt/docker/starfeet-landing"

def copy_files():
    print("Creating messages folder in landing project...")
    os.makedirs(os.path.join(landing_dir, "messages"), exist_ok=True)
    print("Creating public/images folder in landing project...")
    os.makedirs(os.path.join(landing_dir, "public/images"), exist_ok=True)
    
    print("Copying translations...")
    shutil.copy2(
        os.path.join(source_dir, "messages/es.json"),
        os.path.join(landing_dir, "messages/es.json")
    )
    
    print("Copying i18n helper...")
    shutil.copy2(
        os.path.join(source_dir, "lib/i18n.ts"),
        os.path.join(landing_dir, "lib/i18n.ts")
    )
    
    print("Copying ProductStages component...")
    shutil.copy2(
        os.path.join(source_dir, "components/organisms/ProductStages.tsx"),
        os.path.join(landing_dir, "components/organisms/ProductStages.tsx")
    )

    print("Copying UnerValidation component...")
    shutil.copy2(
        os.path.join(source_dir, "components/organisms/UnerValidation.tsx"),
        os.path.join(landing_dir, "components/organisms/UnerValidation.tsx")
    )

    print("Copying asset: logo_SF.svg...")
    shutil.copy2(
        os.path.join(source_dir, "public/images/logo_SF.svg"),
        os.path.join(landing_dir, "public/images/logo_SF.svg")
    )

    print("Copying asset: video_etapa1.webm...")
    shutil.copy2(
        os.path.join(source_dir, "public/images/video_etapa1.webm"),
        os.path.join(landing_dir, "public/images/video_etapa1.webm")
    )

    print("Copying asset: video_etapa2.webm...")
    shutil.copy2(
        os.path.join(source_dir, "public/images/video_etapa2.webm"),
        os.path.join(landing_dir, "public/images/video_etapa2.webm")
    )

    print("Copying asset: video_etapa3.webm...")
    shutil.copy2(
        os.path.join(source_dir, "public/images/video_etapa3.webm"),
        os.path.join(landing_dir, "public/images/video_etapa3.webm")
    )

def patch_landing_page():
    page_path = os.path.join(landing_dir, "app/page.tsx")
    print(f"Patching {page_path}...")
    
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Add import if not present
    import_str = 'import { ProductStages } from "../components/organisms/ProductStages";'
    if import_str not in content:
        # Insert it after another import
        content = content.replace(
            'import { Technology } from "../components/organisms/Technology";',
            'import { Technology } from "../components/organisms/Technology";\n' + import_str
        )

    import_uner_str = 'import { UnerValidation } from "../components/organisms/UnerValidation";'
    if import_uner_str not in content:
        content = content.replace(
            'import { ProductStages } from "../components/organisms/ProductStages";',
            'import { ProductStages } from "../components/organisms/ProductStages";\n' + import_uner_str
        )
        
    # Insert component if not present
    component_tag = "<ProductStages />"
    if component_tag not in content:
        content = content.replace(
            "<Technology />",
            "<Technology />\n      <ProductStages />"
        )

    uner_tag = "<UnerValidation />"
    if uner_tag not in content:
        content = content.replace(
            "<ProductStages />",
            "<ProductStages />\n      <UnerValidation />"
        )
        
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully patched landing page!")

if __name__ == "__main__":
    copy_files()
    patch_landing_page()
