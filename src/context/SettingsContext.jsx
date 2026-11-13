import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

const SETTINGS_KEY = "steel-store-settings";

const defaultSettings = {
  store: {
    name: "Steel Store",
    owner: "",
    phone: "",
    email: "",
    address: "",
  },

  general: {
    currency: "PKR",
    dateFormat: "DD/MM/YYYY",
    language: "English",
  },

  inventory: {
    lowStockLimit: 5,
    defaultUnit: "Kg",
    allowNegativeStock: false,
  },

  invoice: {
    prefix: "INV",
    tax: 0,
    footer: "Thank you for shopping with us!",
    showLogo: true,
    showPhone: true,
  },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

      if (!saved) return defaultSettings;

      return {
        store: {
          ...defaultSettings.store,
          ...saved.store,
        },
        general: {
          ...defaultSettings.general,
          ...saved.general,
        },
        inventory: {
          ...defaultSettings.inventory,
          ...saved.inventory,
        },
        invoice: {
          ...defaultSettings.invoice,
          ...saved.invoice,
        },
      };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateSection = (section, data) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const formatCurrency = (amount) => {
    const currency = settings.general.currency;

    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const value = {
    settings,
    updateSetting,
    updateSection,
    resetSettings,
    formatCurrency,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return context;
}
