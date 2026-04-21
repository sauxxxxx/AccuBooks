import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "../../components/Icon";
import { updateSettingsStore, useSettingsStore } from "../../data/settingsStore";
import { SettingsModal } from "./SettingsModal";
import {
  settingCategoryOptions,
  settingsTabConfig,
  type SettingCategory,
  type SettingDraft,
  type SettingRecord,
  type SettingsTabKey,
} from "./settingsData";

const COMPANY_LOGO_KEY = "company_logo_url";

const tabOrder: SettingsTabKey[] = ["company-bir", "payroll-rules", "tax-rates", "contributions", "all-settings"];

const tabMeta: Record<
  SettingsTabKey,
  {
    description: string;
    icon: "bank" | "settings" | "dollar-sign" | "users" | "pie-chart";
    kicker: string;
  }
> = {
  "company-bir": {
    description: "Identity, invoice formatting, and Bir profile values that flow into formal output.",
    icon: "bank",
    kicker: "Company profile",
  },
  "payroll-rules": {
    description: "Payroll cycle defaults, contribution formulas, and withholding bracket controls.",
    icon: "settings",
    kicker: "Payroll engine",
  },
  "tax-rates": {
    description: "Vat and withholding rates used by invoicing, payroll, and tax reporting.",
    icon: "dollar-sign",
    kicker: "Tax tables",
  },
  contributions: {
    description: "Sss, PhilHealth, and Pag-ibig defaults used by payroll computations.",
    icon: "users",
    kicker: "Contribution tables",
  },
  "all-settings": {
    description: "Browse the full configuration library with every editable record in one place.",
    icon: "pie-chart",
    kicker: "Reference data",
  },
};

function formatTabLabel(tab: SettingsTabKey) {
  return settingsTabConfig[tab].label;
}

function formatCategoryLabel(category: SettingRecord["category"]) {
  return settingCategoryOptions.find((option) => option.value === category)?.label ?? formatHumanized(category);
}

function getSettingValue(settings: SettingRecord[], key: string) {
  return settings.find((setting) => setting.key === key)?.value.trim() ?? "";
}

function formatHumanized(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatPercentValue(rawValue: string) {
  const parsed = Number.parseFloat(rawValue);

  if (!Number.isFinite(parsed)) {
    return rawValue;
  }

  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(parsed);
}

function formatDisplayValue(key: string, rawValue: string) {
  if (!rawValue.trim()) {
    return "Not set";
  }

  if (key === "payroll_cycle") {
    return formatHumanized(rawValue);
  }

  if (key === "payroll_periods_per_year") {
    return `${rawValue} periods`;
  }

  if (key === "payroll_withholding_brackets") {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return `${parsed.length} brackets`;
      }
    } catch {
      return "Configured";
    }
    return "Configured";
  }

  if (key.includes("_rate") || key === "vat_rate") {
    return formatPercentValue(rawValue);
  }

  return rawValue;
}

function draftToSettingRecord(draft: SettingDraft, existing?: SettingRecord): SettingRecord {
  return {
    category: draft.category,
    description: draft.description.trim(),
    effectiveDate: draft.effectiveDate.trim(),
    id: existing?.id ?? `setting-${Date.now()}`,
    key: draft.key.trim(),
    name: draft.name.trim(),
    value: draft.value.trim(),
  };
}

function isVisibleSetting(setting: SettingRecord, activeTab: SettingsTabKey) {
  if (setting.key === COMPANY_LOGO_KEY) {
    return activeTab === "company-bir";
  }

  const config = settingsTabConfig[activeTab];

  if (!config.categories) {
    return true;
  }

  return config.categories.includes(setting.category);
}

function formatCompanyTin(settings: SettingRecord[]) {
  const tin = getSettingValue(settings, "business_tin");
  const branch = getSettingValue(settings, "branch_code");

  if (!tin && !branch) {
    return "Not configured";
  }

  return [tin, branch ? `Branch ${branch}` : ""].filter(Boolean).join(" · ");
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("company-bir");
  const [editingSetting, setEditingSetting] = useState<SettingRecord | null>(null);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const settings = useSettingsStore();
  const companyLogoSetting = settings.find((setting) => setting.key === COMPANY_LOGO_KEY);
  const companyLogoUrl = companyLogoSetting?.value.trim() ?? "";

  const visibleSettings = useMemo(
    () => settings.filter((setting) => isVisibleSetting(setting, activeTab)),
    [activeTab, settings],
  );
  const tabConfig = settingsTabConfig[activeTab];
  const createCategory: SettingCategory = tabConfig.categories?.[0] ?? "general";

  const handleOpenCreate = () => {
    setEditingSetting(null);
    setIsSettingModalOpen(true);
  };

  const handleOpenEdit = (setting: SettingRecord) => {
    setEditingSetting(setting);
    setIsSettingModalOpen(true);
  };

  const handleSaveSetting = (draft: SettingDraft) => {
    const nextSetting = draftToSettingRecord(draft, editingSetting ?? undefined);

    updateSettingsStore((current) => {
      if (editingSetting) {
        return current.map((setting) => (setting.id === editingSetting.id ? nextSetting : setting));
      }

      return [nextSetting, ...current];
    });

    setEditingSetting(null);
    setIsSettingModalOpen(false);
  };

  const handleDeleteSetting = (settingId: string) => {
    const setting = settings.find((entry) => entry.id === settingId);

    if (!setting) {
      return;
    }

    const confirmed = window.confirm(`Delete ${setting.name}?`);

    if (!confirmed) {
      return;
    }

    updateSettingsStore((current) => current.filter((entry) => entry.id !== settingId));
    setEditingSetting((current) => (current?.id === settingId ? null : current));
  };

  const handleOpenCompanyLogoPicker = () => {
    companyLogoInputRef.current?.click();
  };

  const handleCompanyLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file for the company logo.");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";

      if (!value) {
        return;
      }

      updateSettingsStore((current) => {
        const existing = current.find((setting) => setting.key === COMPANY_LOGO_KEY);
        const nextLogoSetting: SettingRecord = {
          category: "company_profile",
          description: "Company logo shown on invoices and official documents.",
          effectiveDate: "",
          id: existing?.id ?? "setting-company-logo",
          key: COMPANY_LOGO_KEY,
          name: "Company Logo",
          value,
        };

        if (existing) {
          return current.map((setting) => (setting.key === COMPANY_LOGO_KEY ? nextLogoSetting : setting));
        }

        return [nextLogoSetting, ...current];
      });

      input.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveCompanyLogo = () => {
    updateSettingsStore((current) => current.filter((entry) => entry.key !== COMPANY_LOGO_KEY));
  };

  return (
    <div className="settings-page">
      <header className="settings-hero">
        <div className="settings-hero__copy">
          <p className="settings-hero__eyebrow">Control Center</p>
          <h1 className="settings-hero__title">Settings</h1>
          <p className="settings-hero__description">
            Configure company identity, payroll rules, tax rates, contribution tables, and system settings from one
            place.
          </p>
        </div>

        <div className="settings-hero__actions">
          <button type="button" className="button button--primary settings-hero__button" onClick={handleOpenCreate}>
            <Icon name="plus" size={17} />
            <span>Add Setting</span>
          </button>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-rail" aria-label="Settings sections">
          <div className="settings-rail__items" role="tablist" aria-label="Settings sections">
            {tabOrder.map((tab) => {
              const isActive = tab === activeTab;
              const meta = tabMeta[tab];

              return (
                <button
                  key={tab}
                  type="button"
                  className={`settings-rail__item ${isActive ? "settings-rail__item--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="settings-rail__icon" aria-hidden="true">
                    <Icon name={meta.icon} size={18} />
                  </span>

                  <span className="settings-rail__copy">
                    <span className="settings-rail__label">{formatTabLabel(tab)}</span>
                    <span className="settings-rail__meta">{meta.kicker}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="settings-workspace">
          {activeTab === "company-bir" ? (
            <section className="settings-profileSection" aria-labelledby="settings-profile-title">
              <div className="settings-logoCard settings-profileSection__logo">
                <div className="settings-logoCard__copy">
                  <p className="settings-logoCard__eyebrow">Brand asset</p>
                  <h3 id="settings-profile-title">Company logo used on invoices and payroll documents</h3>
                  <p className="settings-logoCard__description">
                    Keep this image clean and high contrast so it prints well on invoices, payslips, and official
                    forms.
                  </p>
                </div>

                <div className="settings-logoCard__preview">
                  <div className="settings-logoCard__frame" aria-label="Company logo preview">
                    {companyLogoUrl ? (
                      <img className="settings-logoCard__image" src={companyLogoUrl} alt="Company logo preview" />
                    ) : (
                      <div className="settings-logoCard__placeholder">
                        <Icon name="bank" size={28} />
                        <span>No logo uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="settings-logoCard__actions">
                    <input
                      ref={companyLogoInputRef}
                      accept="image/*"
                      aria-label="Upload company logo"
                      className="settings-logoCard__fileInput"
                      type="file"
                      onChange={handleCompanyLogoChange}
                    />
                    <button
                      type="button"
                      className="button button--primary settings-logoCard__button"
                      onClick={handleOpenCompanyLogoPicker}
                    >
                      <Icon name="plus" size={16} />
                      <span>{companyLogoUrl ? "Replace logo" : "Upload logo"}</span>
                    </button>
                    {companyLogoUrl ? (
                      <button type="button" className="button settings-logoCard__removeButton" onClick={handleRemoveCompanyLogo}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="settings-profileSection__details">
                <div className="settings-profileCard">
                  <div className="settings-profileCard__header">
                    <p className="settings-profileCard__eyebrow">Company profile</p>
                    <h3>Registered identity and invoice setup</h3>
                  </div>

                  <div className="settings-profileCard__grid">
                  <div className="settings-profileCard__field">
                      <span>Registered name</span>
                      <strong>{getSettingValue(settings, "registered_business_name") || "Not configured"}</strong>
                    </div>
                    <div className="settings-profileCard__field">
                      <span>Registered address</span>
                      <strong>{getSettingValue(settings, "registered_business_address") || "Not configured"}</strong>
                    </div>
                    <div className="settings-profileCard__field">
                      <span>Business tin</span>
                      <strong>{formatCompanyTin(settings)}</strong>
                    </div>
                    <div className="settings-profileCard__field">
                      <span>Vat status</span>
                      <strong>{getSettingValue(settings, "vat_registration_status") || "Not configured"}</strong>
                    </div>
                    <div className="settings-profileCard__field">
                      <span>Invoice prefix</span>
                      <strong>{getSettingValue(settings, "invoice_serial_prefix") || "Not configured"}</strong>
                    </div>
                    <div className="settings-profileCard__field">
                      <span>Atp serial range</span>
                      <strong>
                        {[
                          getSettingValue(settings, "atp_serial_start"),
                          getSettingValue(settings, "atp_serial_end"),
                        ]
                          .filter(Boolean)
                          .join(" to ") || "Not configured"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="settings-tableCard" aria-labelledby="settings-table-title">
            <div className="settings-tableCard__header">
              <div>
                <h3 id="settings-table-title">{tabConfig.panelTitle}</h3>
              </div>
            </div>

            <table className="clients-table settings-table" aria-label={tabConfig.panelTitle}>
              {tabConfig.showDescription ? (
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "6%" }} />
                </colgroup>
              ) : (
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
              )}

              <thead>
                <tr className="clients-table__headRow">
                  <th className="clients-table__headCell" scope="col">
                    Key
                  </th>
                  <th className="clients-table__headCell" scope="col">
                    Name
                  </th>
                  <th className="clients-table__headCell clients-table__headCell--right" scope="col">
                    Value
                  </th>
                  <th className="clients-table__headCell" scope="col">
                    Category
                  </th>
                  {tabConfig.showDescription ? (
                    <th className="clients-table__headCell" scope="col">
                      Description
                    </th>
                  ) : null}
                  <th className="clients-table__headCell clients-table__headCell--actions" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleSettings.length > 0 ? (
                  visibleSettings.map((setting) => (
                    <tr key={setting.id} className="clients-table__row">
                      <td className="clients-table__cell clients-table__cell--mono">{setting.key}</td>
                      <td className="clients-table__cell clients-table__cell--strong">{setting.name}</td>
                      <td className="clients-table__cell clients-table__cell--mono clients-table__cell--right">
                        {formatDisplayValue(setting.key, setting.value)}
                      </td>
                      <td className="clients-table__cell">
                        <span className="settings-categoryBadge">{formatCategoryLabel(setting.category)}</span>
                      </td>
                      {tabConfig.showDescription ? (
                        <td className="clients-table__cell settings-table__cell--description">{setting.description}</td>
                      ) : null}
                      <td className="clients-table__cell clients-table__cell--actions">
                        <button
                          type="button"
                          className="clients-table__action"
                          aria-label={`Edit ${setting.name}`}
                          onClick={() => handleOpenEdit(setting)}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="clients-table__action clients-table__action--danger"
                          aria-label={`Delete ${setting.name}`}
                          onClick={() => handleDeleteSetting(setting.id)}
                        >
                          <Icon name="trash-2" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="clients-table__row">
                    <td className="clients-table__emptyCell" colSpan={tabConfig.showDescription ? 6 : 5}>
                      No settings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      {isSettingModalOpen ? (
        <SettingsModal
          key={editingSetting?.id ?? "create"}
          initialCategory={createCategory}
          mode={editingSetting ? "edit" : "create"}
          onClose={() => {
            setIsSettingModalOpen(false);
            setEditingSetting(null);
          }}
          onSave={handleSaveSetting}
          setting={editingSetting}
        />
      ) : null}
    </div>
  );
}
