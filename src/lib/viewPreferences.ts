interface ViewPreferences {
  [pageId: string]: {
    mode?: string;
    properties?: string[];
    filters?: any;
  };
}

const STORAGE_KEY = "view_preferences";

export function getViewPreferences(): ViewPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getViewPreference(pageId: string) {
  const prefs = getViewPreferences();
  return prefs[pageId] || getDefaultPreference(pageId);
}

export function saveViewPreference(pageId: string, prefs: any) {
  const current = getViewPreferences();
  current[pageId] = { ...current[pageId], ...prefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

function getDefaultPreference(pageId: string) {
  const defaults: Record<string, any> = {
    production: {
      mode: "kanban",
      properties: [
        "product_name",
        "customer",
        "quantity",
        "priority",
        "due_date",
        "config",
      ],
    },
    inventory: {
      mode: "grid",
      properties: ["name", "sku", "stock_quantity", "unit_price", "category"],
    },
    products: {
      mode: "grid",
      properties: ["name", "sku", "category", "unit_price", "stock_quantity"],
    },
    orders: {
      mode: "list",
      properties: ["order_number", "contact", "total", "status", "created_at"],
    },
    logistics: {
      mode: "list",
      properties: [
        "order_number",
        "contact",
        "destination",
        "carrier",
        "tracking",
      ],
    },
  };

  return defaults[pageId] || { mode: "list", properties: [] };
}
