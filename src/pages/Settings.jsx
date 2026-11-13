import { useState } from "react";
import { motion } from "framer-motion";

import { useSettings } from "../context/SettingsContext";

import {
  Settings as SettingsIcon,
  Store,
  Globe,
  Package,
  Receipt,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
  Percent,
  FileText,
  ShieldCheck,
} from "lucide-react";

const SETTINGS_KEY = "steel-store-settings";

const sections = [
  { id: "store", label: "Store Information", icon: Store },
  { id: "general", label: "General", icon: Globe },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "invoice", label: "Invoice & Receipt", icon: Receipt },
  { id: "backup", label: "Data Management", icon: Database },
];

function Settings() {
  // Global Settings Context
  const { settings, updateSetting, updateSection, resetSettings } =
    useSettings();

  const [activeSection, setActiveSection] = useState("store");
  const [saved, setSaved] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Show message
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // Save Settings
  const handleSave = () => {
    try {
      // SettingsContext automatically saves settings to localStorage.
      // This button confirms the user's changes.
      setSaved(true);

      showMessage("Settings saved successfully!");

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      showMessage("Unable to save settings.", "error");
    }
  };

  // Reset Settings
  const handleReset = () => {
    resetSettings();

    setShowResetModal(false);
    setSaved(true);

    showMessage("Settings restored to default values.");

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // Export Backup
  const handleBackup = () => {
    try {
      const keys = [
        "steel-store-products",
        "steel-store-sales",
        "steel-store-customers",
        "steel-store-purchases",
        "steel-store-expenses",
        "steel-store-stock-history",
        "steel-store-categories",
        SETTINGS_KEY,
      ];

      const backup = {
        backupDate: new Date().toISOString(),
        application: "Steel Store POS",
        version: "1.0",
        data: {},
      };

      keys.forEach((key) => {
        const value = localStorage.getItem(key);

        if (value !== null) {
          try {
            backup.data[key] = JSON.parse(value);
          } catch {
            backup.data[key] = value;
          }
        }
      });

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `steel-store-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      showMessage("Backup downloaded successfully!");
    } catch (error) {
      console.error(error);
      showMessage("Unable to create backup.", "error");
    }
  };

  // Restore Backup
  const handleRestore = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);

        // Support both new and previous backup formats
        const backupData = backup.data || backup;

        if (
          !backupData ||
          typeof backupData !== "object" ||
          Array.isArray(backupData)
        ) {
          throw new Error("Invalid backup file.");
        }

        const allowedKeys = [
          "steel-store-products",
          "steel-store-sales",
          "steel-store-customers",
          "steel-store-purchases",
          "steel-store-expenses",
          "steel-store-stock-history",
          "steel-store-categories",
          SETTINGS_KEY,
        ];

        const validKeys = Object.keys(backupData).filter((key) =>
          allowedKeys.includes(key),
        );

        if (validKeys.length === 0) {
          throw new Error("No valid application data found.");
        }

        const confirmed = window.confirm(
          "Restoring backup will replace matching saved data. Continue?",
        );

        if (!confirmed) return;

        // Restore application data
        validKeys.forEach((key) => {
          localStorage.setItem(key, JSON.stringify(backupData[key]));
        });

        // Restore global settings context
        if (backupData[SETTINGS_KEY]) {
          const restored = backupData[SETTINGS_KEY];

          if (restored.store) {
            updateSection("store", restored.store);
          }

          if (restored.general) {
            updateSection("general", restored.general);
          }

          if (restored.inventory) {
            updateSection("inventory", restored.inventory);
          }

          if (restored.invoice) {
            updateSection("invoice", restored.invoice);
          }
        }

        showMessage("Backup restored! Reloading application...");

        // Refresh other contexts also
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error(error);

        showMessage(error.message || "Unable to restore backup.", "error");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const active = sections.find((section) => section.id === activeSection);

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <SettingsIcon size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your store and application preferences.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}

          {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* SIDEBAR */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Settings Menu
          </p>

          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={19} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
        >
          <div className="mb-7 border-b border-slate-100 pb-5">
            <h2 className="text-xl font-bold text-slate-800">
              {active?.label}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure your {active?.label.toLowerCase()} preferences.
            </p>
          </div>

          {/* STORE INFORMATION */}
          {activeSection === "store" && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Store Name</label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      className={`${inputClass} pl-11`}
                      value={settings.store.name}
                      onChange={(e) =>
                        updateSetting("store", "name", e.target.value)
                      }
                      placeholder="Enter store name"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Owner Name</label>

                  <input
                    className={inputClass}
                    value={settings.store.owner}
                    onChange={(e) =>
                      updateSetting("store", "owner", e.target.value)
                    }
                    placeholder="Enter owner name"
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      className={`${inputClass} pl-11`}
                      value={settings.store.phone}
                      onChange={(e) =>
                        updateSetting("store", "phone", e.target.value)
                      }
                      placeholder="03XXXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="email"
                      className={`${inputClass} pl-11`}
                      value={settings.store.email}
                      onChange={(e) =>
                        updateSetting("store", "email", e.target.value)
                      }
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Store Address</label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-3.5 text-slate-400"
                  />

                  <textarea
                    rows="3"
                    className={`${inputClass} resize-none pl-11`}
                    value={settings.store.address}
                    onChange={(e) =>
                      updateSetting("store", "address", e.target.value)
                    }
                    placeholder="Enter complete store address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GENERAL SETTINGS */}
          {activeSection === "general" && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Currency</label>

                <select
                  className={inputClass}
                  value={settings.general.currency}
                  onChange={(e) =>
                    updateSetting("general", "currency", e.target.value)
                  }
                >
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  Default currency for displaying store amounts.
                </p>
              </div>

              <div>
                <label className={labelClass}>Date Format</label>

                <select
                  className={inputClass}
                  value={settings.general.dateFormat}
                  onChange={(e) =>
                    updateSetting("general", "dateFormat", e.target.value)
                  }
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Language</label>

                <select
                  className={inputClass}
                  value={settings.general.language}
                  onChange={(e) =>
                    updateSetting("general", "language", e.target.value)
                  }
                >
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>
            </div>
          )}

          {/* INVENTORY SETTINGS */}
          {activeSection === "inventory" && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Low Stock Alert Limit</label>

                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={settings.inventory.lowStockLimit}
                  onChange={(e) =>
                    updateSetting(
                      "inventory",
                      "lowStockLimit",
                      Math.max(0, Number(e.target.value)),
                    )
                  }
                />

                <p className="mt-2 text-xs text-slate-400">
                  Products with stock at or below this quantity can be
                  considered low stock.
                </p>
              </div>

              <div>
                <label className={labelClass}>Default Product Unit</label>

                <select
                  className={inputClass}
                  value={settings.inventory.defaultUnit}
                  onChange={(e) =>
                    updateSetting("inventory", "defaultUnit", e.target.value)
                  }
                >
                  <option value="Kg">Kilogram (Kg)</option>
                  <option value="Ton">Ton</option>
                  <option value="Piece">Piece</option>
                  <option value="Meter">Meter</option>
                  <option value="Bundle">Bundle</option>
                  <option value="Bag">Bag</option>
                </select>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Allow Negative Stock
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Allow sales even when available stock is insufficient.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.inventory.allowNegativeStock}
                  onChange={(e) =>
                    updateSetting(
                      "inventory",
                      "allowNegativeStock",
                      e.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-700">
                <AlertTriangle size={20} className="shrink-0" />

                <p className="text-xs leading-5">
                  Negative stock is disabled by default to prevent selling
                  products that are not available in your inventory.
                </p>
              </div>
            </div>
          )}

          {/* INVOICE SETTINGS */}
          {activeSection === "invoice" && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Invoice Prefix</label>

                  <input
                    className={inputClass}
                    value={settings.invoice.prefix}
                    onChange={(e) =>
                      updateSetting(
                        "invoice",
                        "prefix",
                        e.target.value.toUpperCase(),
                      )
                    }
                    placeholder="INV"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Example: INV-001
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Tax Percentage (%)</label>

                  <div className="relative">
                    <Percent
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={`${inputClass} pl-11`}
                      value={settings.invoice.tax}
                      onChange={(e) =>
                        updateSetting(
                          "invoice",
                          "tax",
                          Math.min(100, Math.max(0, Number(e.target.value))),
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Receipt Footer Message</label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="absolute left-4 top-3.5 text-slate-400"
                  />

                  <textarea
                    rows="3"
                    className={`${inputClass} resize-none pl-11`}
                    value={settings.invoice.footer}
                    onChange={(e) =>
                      updateSetting("invoice", "footer", e.target.value)
                    }
                    placeholder="Enter receipt footer message"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={settings.invoice.showLogo}
                    onChange={(e) =>
                      updateSetting("invoice", "showLogo", e.target.checked)
                    }
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Show store logo on invoice
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={settings.invoice.showPhone}
                    onChange={(e) =>
                      updateSetting("invoice", "showPhone", e.target.checked)
                    }
                    className="h-5 w-5 accent-blue-600"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Show store phone number on invoice
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* BACKUP AND RESTORE */}
          {activeSection === "backup" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                    <ShieldCheck size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      Protect Your Store Data
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Create a backup of your saved application data.
                    </p>
                  </div>
                </div>
              </div>

              {/* BACKUP */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-green-100 p-3 text-green-600">
                    <Download size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Download Backup
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Download products, sales, customers, purchases, expenses
                      and settings.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBackup}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <Download size={17} />
                  Export Data
                </button>
              </div>

              {/* RESTORE */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                    <Upload size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Restore Backup
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Restore your application data from a JSON backup file.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700">
                  <Upload size={17} />
                  Import Backup
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleRestore}
                    className="hidden"
                  />
                </label>
              </div>

              {/* RESET */}
              <div className="rounded-xl border border-red-200 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-100 p-3 text-red-600">
                      <RotateCcw size={22} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-red-700">
                        Reset Settings
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Restore settings to their original values. Your products
                        and sales will not be deleted.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowResetModal(true)}
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Reset Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SAVE BUTTON */}
          {activeSection !== "backup" && (
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Reset Settings?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to restore all settings to their default
              values? Your products, customers, sales and purchases will remain
              safe.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleReset}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Reset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Settings;
