import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { categoryNames, getCategoryVisuals } from '@/domain/constants';

interface Resource {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  status: string;
  stock: number;
}

interface CategoryMigrationToolProps {
  resources: Resource[];
  onMigrateResources: (migrations: { resourceId: string; newCategory: string }[]) => Promise<void>;
}

export function CategoryMigrationTool({ resources, onMigrateResources }: CategoryMigrationToolProps) {
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [migrationPlan, setMigrationPlan] = useState<Map<string, string>>(new Map());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  // Recursos que podrían necesitar migración (categorías genéricas o problemáticas)
  const problematicCategories = [
    'PC',
    'PCs',
    'Computadora',
    'Computadoras',
    'PC de escritorio',
    'PCs de escritorio',
    'Escritorio',
    'Desktop',
    'Ordenador',
    'Ordenadores',
    'Equipo de cómputo',
    'Equipo informático',
    'Hardware',
    'Electrónica',
    'Electrónicos',
    'Dispositivo',
    'Dispositivos'
  ];

  const resourcesToMigrate = resources.filter(resource =>
    resource.category && problematicCategories.some(cat =>
      resource.category?.toLowerCase().includes(cat.toLowerCase())
    )
  );

  const handleResourceSelection = (resourceId: string, selected: boolean) => {
    const newSelected = new Set(selectedResources);
    if (selected) {
      newSelected.add(resourceId);
    } else {
      newSelected.delete(resourceId);
    }
    setSelectedResources(newSelected);
  };

  const handleCategoryChange = (resourceId: string, newCategory: string) => {
    const newPlan = new Map(migrationPlan);
    newPlan.set(resourceId, newCategory);
    setMigrationPlan(newPlan);
  };

  const handleMigrate = async () => {
    if (migrationPlan.size === 0) return;

    setIsMigrating(true);
    try {
      const migrations = Array.from(migrationPlan.entries()).map(([resourceId, newCategory]) => ({
        resourceId,
        newCategory
      }));

      await onMigrateResources(migrations);
      setMigrationComplete(true);
    } catch (error) {
      console.error('Error during migration:', error);
      alert('Error durante la migración. Por favor, inténtalo de nuevo.');
    } finally {
      setIsMigrating(false);
    }
  };

  const getSuggestedCategory = (resourceName: string, currentCategory?: string): string => {
    const name = resourceName.toLowerCase();

    // Sugerencias basadas en el nombre del recurso
    if (name.includes('monitor') || name.includes('pantalla') || name.includes('display')) {
      return 'Monitores';
    }
    if (name.includes('teclado') || name.includes('keyboard')) {
      return 'Teclados';
    }
    if (name.includes('mouse') || name.includes('ratón') || name.includes('raton')) {
      return 'Ratones';
    }
    if (name.includes('cpu') || name.includes('torre') || name.includes('gabinete') || name.includes('case')) {
      return 'Torres/CPU';
    }
    if (name.includes('parlante') || name.includes('altavoz') || name.includes('speaker')) {
      return 'Parlantes';
    }
    if (name.includes('webcam') || name.includes('camara web') || name.includes('cámara web')) {
      return 'Webcams';
    }
    if (name.includes('laptop') || name.includes('portátil') || name.includes('notebook')) {
      return 'Laptops';
    }
    if (name.includes('tablet') || name.includes('ipad')) {
      return 'Tablets';
    }

    // Si no hay sugerencia específica, mantener la categoría actual o usar "Torres/CPU" por defecto
    return currentCategory || 'Torres/CPU';
  };

  if (migrationComplete) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">¡Migración Completada!</h3>
              <p className="text-muted-foreground">
                Se han migrado exitosamente {migrationPlan.size} recursos a categorías más específicas.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Actualizar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Herramienta de Migración de Categorías
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {resourcesToMigrate.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ¡Excelente! No se encontraron recursos con categorías problemáticas que necesiten migración.
              Tu inventario ya está usando categorías específicas.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se encontraron {resourcesToMigrate.length} recursos con categorías genéricas que pueden ser migrados
                a categorías más específicas para un mejor control del inventario.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">Recursos a migrar:</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resourcesToMigrate.map((resource) => {
                  const suggestedCategory = getSuggestedCategory(resource.name, resource.category);
                  const currentSelection = migrationPlan.get(resource.id) || suggestedCategory;
                  const isSelected = selectedResources.has(resource.id);

                  return (
                    <div key={resource.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleResourceSelection(resource.id, e.target.checked)}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium">{resource.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {resource.brand} {resource.model} • Stock: {resource.stock}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Categoría actual: {resource.category}
                        </Badge>
                      </div>

                      {isSelected && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nueva categoría:</label>
                          <Select value={currentSelection} onValueChange={(value) => handleCategoryChange(resource.id, value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar nueva categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryNames.map((category) => {
                                const visual = getCategoryVisuals(category);
                                const Icon = visual.icon;
                                return (
                                  <SelectItem key={category} value={category}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={`h-4 w-4 ${visual.color}`} />
                                      {category}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedResources.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">
                    {selectedResources.size} recurso{selectedResources.size > 1 ? 's' : ''} seleccionado{selectedResources.size > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Se migrarán a las categorías seleccionadas
                  </p>
                </div>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating || migrationPlan.size === 0}
                  className="min-w-32"
                >
                  {isMigrating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Migrar Recursos
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
