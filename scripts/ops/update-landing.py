import os
import shutil

source_dir = "/opt/docker/starfeet/starfeet-core-web"
landing_dir = "/opt/docker/starfeet/starfeet-home"

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

    print("Copying HealthSolution component...")
    shutil.copy2(
        os.path.join(source_dir, "components/organisms/HealthSolution.tsx"),
        os.path.join(landing_dir, "components/organisms/HealthSolution.tsx")
    )

    print("Copying Footer component...")
    shutil.copy2(
        os.path.join(source_dir, "components/organisms/Footer.tsx"),
        os.path.join(landing_dir, "components/organisms/Footer.tsx")
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

    print("Copying CuandoPisasBien component...")
    shutil.copy2(
        os.path.join(source_dir, "components/organisms/CuandoPisasBien.tsx"),
        os.path.join(landing_dir, "components/organisms/CuandoPisasBien.tsx")
    )

    print("Copying asset: cuando_pisas_bien1.webp...")
    shutil.copy2(
        os.path.join(source_dir, "public/images/cuando_pisas_bien1.webp"),
        os.path.join(landing_dir, "public/images/cuando_pisas_bien1.webp")
    )

    # Copy all 3D models from public/models/ if the directory exists
    source_models_dir = os.path.join(source_dir, "public/models")
    target_models_dir = os.path.join(landing_dir, "public/models")
    if os.path.exists(source_models_dir):
        print("Copying 3D models directory contents...")
        os.makedirs(target_models_dir, exist_ok=True)
        for filename in os.listdir(source_models_dir):
            file_path = os.path.join(source_models_dir, filename)
            target_path = os.path.join(target_models_dir, filename)
            if os.path.isdir(file_path):
                if os.path.exists(target_path):
                    shutil.rmtree(target_path)
                shutil.copytree(file_path, target_path)
            elif os.path.isfile(file_path):
                shutil.copy2(file_path, target_path)

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

    import_health_str = 'import { HealthSolution } from "../components/organisms/HealthSolution";'
    if import_health_str not in content:
        content = content.replace(
            'import { ProductStages } from "../components/organisms/ProductStages";',
            'import { ProductStages } from "../components/organisms/ProductStages";\n' + import_health_str
        )
        
    import_cuando_str = 'import { CuandoPisasBien } from "../components/organisms/CuandoPisasBien";'
    if import_cuando_str not in content:
        content = content.replace(
            'import { ProductStages } from "../components/organisms/ProductStages";',
            'import { ProductStages } from "../components/organisms/ProductStages";\n' + import_cuando_str
        )

    import_footer_str = 'import { Footer } from "../components/organisms/Footer";'
    if import_footer_str not in content:
        content = content.replace(
            'import { ProductStages } from "../components/organisms/ProductStages";',
            'import { ProductStages } from "../components/organisms/ProductStages";\n' + import_footer_str
        )

    # Insert component if not present
    component_tag = "<ProductStages />"
    if component_tag not in content:
        content = content.replace(
            "<Technology />",
            "<Technology />\n      <ProductStages />"
        )

    cuando_tag = "<CuandoPisasBien />"
    if cuando_tag not in content:
        content = content.replace(
            "<ProductStages />",
            "<ProductStages />\n      <CuandoPisasBien />"
        )

    health_tag = "<HealthSolution />"
    if health_tag not in content:
        content = content.replace(
            "<ProductStages />",
            "<ProductStages />\n      <HealthSolution />"
        )

    uner_tag = "<UnerValidation />"
    if uner_tag not in content:
        content = content.replace(
            "<HealthSolution />",
            "<HealthSolution />\n      <UnerValidation />"
        )

    footer_tag = "<Footer />"
    if footer_tag not in content:
        content = content.replace(
            "      </section>\n    </main>",
            "      </section>\n      <Footer />\n    </main>"
        )
        
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully patched landing page!")

if __name__ == "__main__":
    copy_files()
    patch_landing_page()
