import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPaletteManager } from "./ColorPaletteManager";
import { FabricTextureManager } from "./FabricTextureManager";
import { BasicMaterialManager } from "./BasicMaterialManager";
import { SupplyGroupManager } from "./SupplyGroupManager";
import { PackagingTypeManager } from "./PackagingTypeManager";
import { BondTypeManager } from "./BondTypeManager";
import { CustomizationComponentManager } from "./CustomizationComponentManager";
import { ComponentOptionManager } from "./ComponentOptionManager";

export function SettingsManagers() {
  return (
    <Tabs defaultValue="color-palettes" className="space-y-6">
      <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="color-palettes">Paletas de cor</TabsTrigger>
        <TabsTrigger value="fabric-textures">Texturas de tecido</TabsTrigger>
        <TabsTrigger value="basic-materials">Materiais básicos</TabsTrigger>
        <TabsTrigger value="supply-groups">Grupos de insumo</TabsTrigger>
        <TabsTrigger value="packaging-types">Tipos de embalagem</TabsTrigger>
        <TabsTrigger value="bond-types">Tipos de vínculo</TabsTrigger>
        <TabsTrigger value="customization-components">
          Componentes de customização
        </TabsTrigger>
        <TabsTrigger value="component-options">
          Opções de componentes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="color-palettes" className="space-y-6">
        <ColorPaletteManager />
      </TabsContent>

      <TabsContent value="fabric-textures" className="space-y-6">
        <FabricTextureManager />
      </TabsContent>

      <TabsContent value="basic-materials" className="space-y-6">
        <BasicMaterialManager />
      </TabsContent>

      <TabsContent value="supply-groups" className="space-y-6">
        <SupplyGroupManager />
      </TabsContent>

      <TabsContent value="packaging-types" className="space-y-6">
        <PackagingTypeManager />
      </TabsContent>

      <TabsContent value="bond-types" className="space-y-6">
        <BondTypeManager />
      </TabsContent>

      <TabsContent value="customization-components" className="space-y-6">
        <CustomizationComponentManager />
      </TabsContent>

      <TabsContent value="component-options" className="space-y-6">
        <ComponentOptionManager />
      </TabsContent>
    </Tabs>
  );
}
