import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ColorPaletteManager } from '@/components/Settings/ColorPaletteManager';
import { FabricTextureManager } from '@/components/Settings/FabricTextureManager';
import { BasicMaterialManager } from '@/components/Settings/BasicMaterialManager';
import { SupplyGroupManager } from '@/components/Settings/SupplyGroupManager';
import { PackagingTypeManager } from '@/components/Settings/PackagingTypeManager';
import { BondTypeManager } from '@/components/Settings/BondTypeManager';
import { CustomizationComponentManager } from '@/components/Settings/CustomizationComponentManager';
import { ComponentOptionManager } from '@/components/Settings/ComponentOptionManager';

const mockUseAdminAccess = vi.fn();
const listConfigsMock = vi.fn();
const createConfigMock = vi.fn();
const updateConfigMock = vi.fn();

vi.mock('@/hooks/useAdminAccess', () => ({
  useAdminAccess: () => mockUseAdminAccess(),
}));

vi.mock('@/lib/supabase/configs', () => ({
  listConfigs: (...args: unknown[]) => listConfigsMock(...args),
  createConfig: (...args: unknown[]) => createConfigMock(...args),
  updateConfig: (...args: unknown[]) => updateConfigMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

type ManagerScenario = {
  name: string;
  render: () => ReactElement;
  heading: string;
  searchPlaceholder: string;
  filterTexts: string[];
  createLabel: string;
};

const scenarios: ManagerScenario[] = [
  {
    name: 'ColorPaletteManager',
    render: () => <ColorPaletteManager />,
    heading: 'Paletas de Cor',
    searchPlaceholder: 'Buscar por nome',
    filterTexts: ['Filtrar status'],
    createLabel: 'Nova Paleta',
  },
  {
    name: 'FabricTextureManager',
    render: () => <FabricTextureManager />,
    heading: 'Texturas de Tecido',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Filtrar tipo', 'Filtrar status'],
    createLabel: 'Nova Textura',
  },
  {
    name: 'BasicMaterialManager',
    render: () => <BasicMaterialManager />,
    heading: 'Materiais Básicos',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Unidade', 'Grupo', 'Status'],
    createLabel: 'Novo Material',
  },
  {
    name: 'SupplyGroupManager',
    render: () => <SupplyGroupManager />,
    heading: 'Grupos de Insumos',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Status'],
    createLabel: 'Novo Grupo',
  },
  {
    name: 'PackagingTypeManager',
    render: () => <PackagingTypeManager />,
    heading: 'Tipos de Embalagem',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Status'],
    createLabel: 'Novo Tipo',
  },
  {
    name: 'BondTypeManager',
    render: () => <BondTypeManager />,
    heading: 'Tipos de Vínculo',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Status'],
    createLabel: 'Novo Vínculo',
  },
  {
    name: 'CustomizationComponentManager',
    render: () => <CustomizationComponentManager />,
    heading: 'Componentes de Customização',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Tipo', 'Status'],
    createLabel: 'Novo Componente',
  },
  {
    name: 'ComponentOptionManager',
    render: () => <ComponentOptionManager />,
    heading: 'Opções de Componentes',
    searchPlaceholder: 'Buscar por nome ou código',
    filterTexts: ['Tipo de componente', 'Status'],
    createLabel: 'Nova Opção',
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function expectButtonEnabled(markup: string, label: string) {
  const escaped = escapeRegex(label);
  const basePattern = new RegExp(`<button[^>]*>(?:[\\s\\S]*?)${escaped}(?:[\\s\\S]*?)<\\/button>`, 'i');
  const disabledPattern = new RegExp(
    `<button[^>]*disabled(?:=[^>]*)?[^>]*>(?:[\\s\\S]*?)${escaped}(?:[\\s\\S]*?)<\\/button>`,
    'i',
  );
  expect(basePattern.test(markup)).toBe(true);
  expect(disabledPattern.test(markup)).toBe(false);
}

function expectButtonDisabled(markup: string, label: string) {
  const escaped = escapeRegex(label);
  const disabledPattern = new RegExp(
    `<button[^>]*disabled(?:=[^>]*)?[^>]*>(?:[\\s\\S]*?)${escaped}(?:[\\s\\S]*?)<\\/button>`,
    'i',
  );
  expect(disabledPattern.test(markup)).toBe(true);
}

beforeEach(() => {
  mockUseAdminAccess.mockReset();
  listConfigsMock.mockReset();
  createConfigMock.mockReset();
  updateConfigMock.mockReset();

  listConfigsMock.mockResolvedValue({ data: [], error: null });
  createConfigMock.mockResolvedValue({ data: null, error: null });
  updateConfigMock.mockResolvedValue({ data: null, error: null });
});

describe('Settings managers smoke tests', () => {
  it('renders core search and filter controls for admins', () => {
    for (const scenario of scenarios) {
      mockUseAdminAccess.mockReturnValue({ isAdmin: true, loading: false, error: null });
      const markup = renderToString(scenario.render());

      expect(markup).toContain(scenario.heading);
      expect(markup).toContain(scenario.searchPlaceholder);
      for (const filterText of scenario.filterTexts) {
        expect(markup).toContain(filterText);
      }
      expectButtonEnabled(markup, scenario.createLabel);
    }
  });

  it('renders read-only hints and disables creation for non-admins', () => {
    for (const scenario of scenarios) {
      mockUseAdminAccess.mockReturnValue({ isAdmin: false, loading: false, error: null });
      const markup = renderToString(scenario.render());

      expect(markup).toContain('Acesso de leitura');
      expect(markup).toContain('Você não possui permissões de administrador');
      expectButtonDisabled(markup, scenario.createLabel);
    }
  });
});
