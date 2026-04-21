import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import {
  accountTypeOptions,
  type AccountBalance,
  type AccountStatus,
  type AccountType,
  type ChartAccountNode,
  type NewChartAccountDraft,
} from "./chartOfAccountsData";

type EditAccountForm = {
  code: string;
  name: string;
  normalBalance: AccountBalance;
  parentCode: string;
  status: AccountStatus;
  type: AccountType;
};

type ParentOption = {
  code: string;
  depth: number;
  name: string;
  normalBalance: AccountBalance;
  type: AccountType;
};

type EditAccountModalProps = {
  account: ChartAccountNode;
  accounts: ChartAccountNode[];
  blockedCodes: Set<string>;
  parentCode: string | null;
  onClose: () => void;
  onSave: (draft: NewChartAccountDraft) => void;
};

const TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

const TYPE_OPTIONS = accountTypeOptions.filter((option): option is AccountType => option !== "All Types");
const BALANCE_OPTIONS: AccountBalance[] = ["Debit", "Credit"];
const STATUS_OPTIONS: AccountStatus[] = ["Active", "Inactive"];

function getBalanceForType(type: AccountType): AccountBalance {
  return type === "asset" || type === "expense" ? "Debit" : "Credit";
}

function flattenParentOptions(
  nodes: ChartAccountNode[],
  blockedCodes: Set<string>,
  depth = 0,
  result: ParentOption[] = [],
): ParentOption[] {
  nodes.forEach((node) => {
    if (!blockedCodes.has(node.code)) {
      result.push({
        code: node.code,
        depth,
        name: node.name,
        normalBalance: node.normalBalance,
        type: node.type,
      });
    }

    if (node.children?.length) {
      flattenParentOptions(node.children, blockedCodes, depth + 1, result);
    }
  });

  return result;
}

function buildTypeLabel(type: AccountType) {
  return TYPE_LABELS[type];
}

function accountCodeExists(nodes: ChartAccountNode[], targetCode: string, ignoreCode?: string): boolean {
  for (const node of nodes) {
    if (node.code === targetCode && node.code !== ignoreCode) {
      return true;
    }

    if (node.children?.length && accountCodeExists(node.children, targetCode, ignoreCode)) {
      return true;
    }
  }

  return false;
}

export function EditAccountModal({
  account,
  accounts,
  blockedCodes,
  parentCode,
  onClose,
  onSave,
}: EditAccountModalProps) {
  const [form, setForm] = useState<EditAccountForm>({
    code: account.code,
    name: account.name,
    normalBalance: account.normalBalance,
    parentCode: parentCode ?? "",
    status: account.status,
    type: account.type,
  });
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [parentMenuOpen, setParentMenuOpen] = useState(false);
  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const typeRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const balanceRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  const parentOptions = useMemo(() => flattenParentOptions(accounts, blockedCodes), [accounts, blockedCodes]);
  const selectedParent = useMemo(
    () => parentOptions.find((option) => option.code === form.parentCode) ?? null,
    [form.parentCode, parentOptions],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!selectedParent) {
      return;
    }

    setForm((current) => {
      const nextType = selectedParent.type;
      const nextBalance = selectedParent.normalBalance;

      if (current.type === nextType && current.normalBalance === nextBalance) {
        return current;
      }

      return {
        ...current,
        normalBalance: nextBalance,
        type: nextType,
      };
    });
  }, [selectedParent]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (typeRef.current && !typeRef.current.contains(target)) {
        setTypeMenuOpen(false);
      }

      if (parentRef.current && !parentRef.current.contains(target)) {
        setParentMenuOpen(false);
      }

      if (balanceRef.current && !balanceRef.current.contains(target)) {
        setBalanceMenuOpen(false);
      }

      if (statusRef.current && !statusRef.current.contains(target)) {
        setStatusMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (typeMenuOpen) {
          setTypeMenuOpen(false);
          return;
        }

        if (parentMenuOpen) {
          setParentMenuOpen(false);
          return;
        }

        if (balanceMenuOpen) {
          setBalanceMenuOpen(false);
          return;
        }

        if (statusMenuOpen) {
          setStatusMenuOpen(false);
          return;
        }

        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [balanceMenuOpen, onClose, parentMenuOpen, statusMenuOpen, typeMenuOpen]);

  const portalTarget = typeof document === "undefined" ? null : document.body;

  const handleSave = () => {
    const code = form.code.trim();
    const name = form.name.trim();

    if (!code) {
      setError("Account code is required.");
      return;
    }

    if (!name) {
      setError("Account name is required.");
      return;
    }

    if (code !== account.code && accountCodeExists(accounts, code, account.code)) {
      setError("That account code already exists.");
      return;
    }

    onSave({
      code,
      name,
      normalBalance: form.normalBalance,
      parentCode: form.parentCode || null,
      status: form.status,
      type: form.type,
    });
  };

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="journal-modal__overlay" onClick={onClose}>
      <div
        className="journal-modal journal-modal--coa"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-account-modal-title"
      >
        <div className="journal-modal__header">
          <h2 id="edit-account-modal-title">Edit Account</h2>
          <button type="button" className="journal-modal__close" aria-label="Close modal" onClick={onClose}>
            <Icon name="x-circle" size={20} />
          </button>
        </div>

        <form
          className="journal-modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="journal-modal__grid journal-modal__grid--two">
            <label className="journal-modal__field">
              <span>Account Code</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.code}
                  placeholder="e.g. 1014"
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, code: event.target.value }));
                  }}
                  inputMode="numeric"
                />
              </div>
            </label>

            <label className="journal-modal__field">
              <span>Account Name</span>
              <div className="journal-modal__inputWrap">
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g. Bank - Metrobank"
                  onChange={(event) => {
                    setError("");
                    setForm((current) => ({ ...current, name: event.target.value }));
                  }}
                />
              </div>
            </label>
          </div>

          {error ? <p className="coa-modal__error">{error}</p> : null}

          <div className="journal-modal__grid journal-modal__grid--two">
            <div className="journal-modal__field" ref={typeRef}>
              <span>Type</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${typeMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={typeMenuOpen}
                onClick={() => setTypeMenuOpen((current) => !current)}
                disabled={Boolean(selectedParent)}
              >
                <span>{buildTypeLabel(form.type)}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {typeMenuOpen && !selectedParent ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Account type">
                  {TYPE_OPTIONS.map((option) => {
                    const isSelected = option === form.type;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setError("");
                          setForm((current) => ({
                            ...current,
                            normalBalance: getBalanceForType(option),
                            type: option,
                          }));
                          setTypeMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{buildTypeLabel(option)}</span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="journal-modal__field" ref={parentRef}>
              <span>Parent Account</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${parentMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={parentMenuOpen}
                onClick={() => setParentMenuOpen((current) => !current)}
              >
                <span className={form.parentCode ? "" : "journal-modal__selectPlaceholder"}>
                  {selectedParent ? `${selectedParent.code} - ${selectedParent.name}` : "Top level"}
                </span>
                <Icon name="chevron-down" size={16} />
              </button>

              {parentMenuOpen ? (
                <div
                  className="journal-modal__selectMenu"
                  role="listbox"
                  aria-label="Parent account"
                  style={{ maxHeight: 260, overflowY: "auto" }}
                >
                  <button
                    type="button"
                    className={`journal-modal__selectOption ${!form.parentCode ? "journal-modal__selectOption--active" : ""}`}
                    onClick={() => {
                      setError("");
                      setForm((current) => ({ ...current, parentCode: "" }));
                      setParentMenuOpen(false);
                    }}
                    role="option"
                    aria-selected={!form.parentCode}
                  >
                    <span>Top level</span>
                    {!form.parentCode ? <Icon name="check" size={16} /> : null}
                  </button>

                  {parentOptions.map((option) => {
                    const isSelected = option.code === form.parentCode;

                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setError("");
                          setForm((current) => ({ ...current, parentCode: option.code }));
                          setParentMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span style={{ paddingLeft: `${10 + option.depth * 14}px` }}>
                          {option.code} - {option.name}
                        </span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="journal-modal__grid journal-modal__grid--two">
            <div className="journal-modal__field" ref={balanceRef}>
              <span>Normal Balance</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${balanceMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={balanceMenuOpen}
                onClick={() => setBalanceMenuOpen((current) => !current)}
                disabled={Boolean(selectedParent)}
              >
                <span>{form.normalBalance}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {balanceMenuOpen && !selectedParent ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Normal balance">
                  {BALANCE_OPTIONS.map((option) => {
                    const isSelected = option === form.normalBalance;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setError("");
                          setForm((current) => ({ ...current, normalBalance: option }));
                          setBalanceMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{option}</span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="journal-modal__field" ref={statusRef}>
              <span>Status</span>
              <button
                type="button"
                className={`journal-modal__selectButton ${statusMenuOpen ? "journal-modal__selectButton--open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={statusMenuOpen}
                onClick={() => setStatusMenuOpen((current) => !current)}
              >
                <span>{form.status}</span>
                <Icon name="chevron-down" size={16} />
              </button>

              {statusMenuOpen ? (
                <div className="journal-modal__selectMenu" role="listbox" aria-label="Account status">
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = option === form.status;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`journal-modal__selectOption ${isSelected ? "journal-modal__selectOption--active" : ""}`}
                        onClick={() => {
                          setError("");
                          setForm((current) => ({ ...current, status: option }));
                          setStatusMenuOpen(false);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{option}</span>
                        {isSelected ? <Icon name="check" size={16} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="journal-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  );
}
