import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { StockAdjustmentDialog } from "@/components/Inventory/StockAdjustmentDialog";
import { ProductDialog } from "@/components/Inventory/ProductDialog";
import { ViewModeSelector } from "@/components/ViewMode/ViewModeSelector";
import {
  PropertySelector,
  PropertyDefinition,
} from "@/components/ViewMode/PropertySelector";
import { getViewPreference, saveViewPreference } from "@/lib/viewPreferences";
import { GridSkeleton } from "@/components/Skeletons/GridSkeleton";
import { ListSkeleton } from "@/components/Skeletons/ListSkeleton";
import { TableSkeleton } from "@/components/Skeletons/TableSkeleton";

type ViewMode = "grid" | "list" | "table" | "gallery";

const INVENTORY_PROPERTIES: PropertyDefinition[] = [
  { id: "name", label: "Nome", type: "text", defaultVisible: true },
  { id: "sku", label: "SKU", type: "text", defaultVisible: true },
  {
    id: "stock_quantity",
    label: "Estoque",
    type: "number",
    defaultVisible: true,
  },
  { id: "unit_price", label: "Preço", type: "number", defaultVisible: true },
  { id: "cost_price", label: "Custo", type: "number", defaultVisible: false },
  { id: "category", label: "Categoria", type: "text", defaultVisible: true },
  {
    id: "min_stock",
    label: "Estoque Mínimo",
    type: "number",
    defaultVisible: false,
  },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const prefs = getViewPreference("inventory");
  const [viewMode, setViewMode] = useState<ViewMode>(prefs.mode || "grid");
  const [visibleProperties, setVisibleProperties] = useState<string[]>(
    prefs.properties ||
      INVENTORY_PROPERTIES.filter((p) => p.defaultVisible).map((p) => p.id),
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveViewPreference("inventory", {
      mode: viewMode,
      properties: visibleProperties,
    });
  }, [viewMode, visibleProperties]);

  async function loadData() {
    try {
      const [productsRes, movementsRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase
          .from("inventory_movements")
          .select("*, product_id, products(name)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (movementsRes.error) throw movementsRes.error;

      setProducts(productsRes.data || []);
      setMovements(movementsRes.data || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  }

  function isLowStock(product: any) {
    const minStock = product.min_stock_quantity || 5;
    return product.stock_quantity < minStock;
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const lowStockProducts = products.filter(isLowStock);
  const supplies = filteredProducts.filter((p) => p.category === "insumo");
  const finishedProducts = filteredProducts.filter(
    (p) => p.category !== "insumo",
  );

  function handleAdjustStock(product: any) {
    setSelectedProduct(product);
    setAdjustmentOpen(true);
  }

  function renderProductCard(product: any) {
    return (
      <Card
        key={product.id}
        className="p-4 hover:shadow-lg cursor-pointer transition-smooth"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold">{product.name}</h3>
            {product.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}
          </div>
          {isLowStock(product) && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Baixo
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estoque</span>
            <span className="font-semibold">{product.stock_quantity || 0}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mínimo</span>
            <span className="text-sm">{product.min_stock_quantity || 5}</span>
          </div>

          {product.unit_price && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Preço</span>
              <span className="font-semibold">
                R$ {Number(product.unit_price).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleAdjustStock(product);
            }}
          >
            Ajustar
          </Button>
        </div>
      </Card>
    );
  }

  function renderGalleryCard(product: any) {
    return (
      <Card
        key={product.id}
        className="p-3 cursor-pointer hover:shadow-lg transition-smooth"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <Badge
            variant={isLowStock(product) ? "destructive" : "secondary"}
            className="text-xs"
          >
            {product.stock_quantity}
          </Badge>
          <p className="text-xs text-muted-foreground">
            R$ {Number(product.unit_price || 0).toFixed(2)}
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Estoque</h1>
        </div>
        {viewMode === "grid" && <GridSkeleton />}
        {viewMode === "list" && <ListSkeleton />}
        {viewMode === "table" && <TableSkeleton />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StockAdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        product={selectedProduct}
        onSuccess={loadData}
      />
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        onSuccess={loadData}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de produtos e movimentações
          </p>
        </div>
        <div className="flex gap-2">
          <PropertySelector
            availableProperties={INVENTORY_PROPERTIES}
            selectedProperties={visibleProperties}
            onChange={setVisibleProperties}
          />
          <ViewModeSelector
            value={viewMode}
            onChange={(mode) => setViewMode(mode as ViewMode)}
            availableModes={["grid", "list", "table", "gallery"]}
          />
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setProductDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                {lowStockProducts.length} produtos com estoque baixo
              </p>
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.map((p) => p.name).join(", ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Busca */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">
            Produtos ({finishedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="supplies">
            Insumos ({supplies.length})
          </TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finishedProducts.map(renderProductCard)}
            </div>
          )}
          {viewMode === "gallery" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {finishedProducts.map(renderGalleryCard)}
            </div>
          )}
          {viewMode === "list" && (
            <div className="space-y-2">
              {finishedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 hover:shadow-md cursor-pointer transition-smooth"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <Package className="w-10 h-10 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <Badge
                      variant={
                        isLowStock(product) ? "destructive" : "secondary"
                      }
                    >
                      {product.stock_quantity}
                    </Badge>
                    <p className="font-semibold">
                      R$ {Number(product.unit_price || 0).toFixed(2)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {viewMode === "table" && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleProperties.map((propId) => {
                      const prop = INVENTORY_PROPERTIES.find(
                        (p) => p.id === propId,
                      );
                      return <TableHead key={propId}>{prop?.label}</TableHead>;
                    })}
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finishedProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {visibleProperties.includes("name") && (
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                      )}
                      {visibleProperties.includes("sku") && (
                        <TableCell>{product.sku || "-"}</TableCell>
                      )}
                      {visibleProperties.includes("stock_quantity") && (
                        <TableCell>
                          <Badge
                            variant={
                              isLowStock(product) ? "destructive" : "secondary"
                            }
                          >
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleProperties.includes("unit_price") && (
                        <TableCell>
                          R$ {Number(product.unit_price || 0).toFixed(2)}
                        </TableCell>
                      )}
                      {visibleProperties.includes("category") && (
                        <TableCell>{product.category}</TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStock(product);
                          }}
                        >
                          Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplies.map(renderProductCard)}
            </div>
          )}
          {viewMode === "gallery" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {supplies.map(renderGalleryCard)}
            </div>
          )}
          {viewMode === "list" && (
            <div className="space-y-2">
              {supplies.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 hover:shadow-md cursor-pointer transition-smooth"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <Package className="w-10 h-10 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <Badge
                      variant={
                        isLowStock(product) ? "destructive" : "secondary"
                      }
                    >
                      {product.stock_quantity}
                    </Badge>
                    <p className="font-semibold">
                      R$ {Number(product.cost_price || 0).toFixed(2)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {viewMode === "table" && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleProperties.map((propId) => {
                      const prop = INVENTORY_PROPERTIES.find(
                        (p) => p.id === propId,
                      );
                      return <TableHead key={propId}>{prop?.label}</TableHead>;
                    })}
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {visibleProperties.includes("name") && (
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                      )}
                      {visibleProperties.includes("sku") && (
                        <TableCell>{product.sku || "-"}</TableCell>
                      )}
                      {visibleProperties.includes("stock_quantity") && (
                        <TableCell>
                          <Badge
                            variant={
                              isLowStock(product) ? "destructive" : "secondary"
                            }
                          >
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleProperties.includes("cost_price") && (
                        <TableCell>
                          R$ {Number(product.cost_price || 0).toFixed(2)}
                        </TableCell>
                      )}
                      {visibleProperties.includes("category") && (
                        <TableCell>{product.category}</TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStock(product);
                          }}
                        >
                          Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Movimentações */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Todas as Movimentações
            </h2>
            <div className="space-y-3">
              {movements.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        mov.type === "in"
                          ? "bg-success/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      {mov.type === "in" ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {mov.products?.name || "Produto"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {mov.reason || "Movimentação"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        mov.type === "in" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {mov.type === "in" ? "+" : "-"}
                      {mov.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
