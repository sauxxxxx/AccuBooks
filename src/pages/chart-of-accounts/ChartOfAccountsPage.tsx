import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { NewAccountModal } from "./NewAccountModal";
import { EditAccountModal } from "./EditAccountModal";
import { useJournalEntriesStore } from "../../data/journalEntriesStore";
import {
  accountTypeOptions,
  chartOfAccounts,
  type AccountType,
  type AccountTypeFilter,
  type ChartAccountNode,
  type NewChartAccountDraft,
} from "./chartOfAccountsData";
import type { JournalEntry } from "../journal-entries/journalEntriesData";

const TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

type FlattenedAccountRow = ChartAccountNode & {
  childCount: number;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

type AccountTransactionRow = {
  credit: string;
  date: string;
  debit: string;
  details: string;
  type: string;
};

const MONEY_FORMATTER = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

function getTypeLabel(type: AccountType) {
  return TYPE_LABELS[type];
}

function getTypeBadgeLabel(type: AccountType) {
  return type;
}

function formatMoney(amount: number) {
  return MONEY_FORMATTER.format(amount);
}

function getAccountPath(nodes: ChartAccountNode[], targetCode: string, ancestors: string[] = []): string[] | null {
  for (const node of nodes) {
    const nextPath = [...ancestors, node.name];

    if (node.code === targetCode) {
      return nextPath;
    }

    if (node.children?.length) {
      const descendant = getAccountPath(node.children, targetCode, nextPath);

      if (descendant) {
        return descendant;
      }
    }
  }

  return null;
}

function collectAccountSearchTerms(node: ChartAccountNode, result = new Set<string>()) {
  result.add(node.code.toLowerCase());
  result.add(node.name.toLowerCase());

  node.children?.forEach((child) => collectAccountSearchTerms(child, result));

  return result;
}

function matchesJournalAccount(accountText: string, terms: Set<string>) {
  const normalized = accountText.toLowerCase();

  for (const term of terms) {
    if (normalized.includes(term) || term.includes(normalized)) {
      return true;
    }
  }

  return false;
}

function parseJournalDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function buildRecentTransactions(account: ChartAccountNode, journalEntries: JournalEntry[]): AccountTransactionRow[] {
  const terms = collectAccountSearchTerms(account);

  return journalEntries
    .flatMap((entry) =>
      entry.lineItems?.map((lineItem) => ({
        account: lineItem.account,
        credit: lineItem.credit,
        date: entry.date,
        debit: lineItem.debit,
        details: `${entry.entryNumber} · ${entry.description}`,
        type: entry.journal,
      })) ?? [],
    )
    .filter((transaction) => matchesJournalAccount(transaction.account, terms))
    .sort((left, right) => parseJournalDate(right.date).getTime() - parseJournalDate(left.date).getTime())
    .slice(0, 5)
    .map((transaction) => ({
      credit: transaction.credit > 0 ? formatMoney(transaction.credit) : "",
      date: transaction.date,
      debit: transaction.debit > 0 ? formatMoney(transaction.debit) : "",
      details: transaction.details,
      type: transaction.type,
    }));
}

function buildClosingBalance(account: ChartAccountNode, journalEntries: JournalEntry[]) {
  const terms = collectAccountSearchTerms(account);

  return journalEntries.reduce((total, entry) => {
    const entryTotal = entry.lineItems?.reduce((sum, lineItem) => {
      return matchesJournalAccount(lineItem.account, terms) ? sum + lineItem.debit - lineItem.credit : sum;
    }, 0) ?? 0;

    return total + entryTotal;
  }, 0);
}

function createExpandedCodes(accounts: ChartAccountNode[]) {
  const expanded = new Set<string>();

  const walk = (nodes: ChartAccountNode[]) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        expanded.add(node.code);
        walk(node.children);
      }
    });
  };

  walk(accounts);
  return expanded;
}

function nodeMatches(node: ChartAccountNode, searchValue: string, typeFilter: AccountTypeFilter) {
  const matchesSearch =
    !searchValue ||
    [node.code, node.name, node.type, node.normalBalance, node.status].some((value) =>
      value.toLowerCase().includes(searchValue),
    );
  const matchesType = typeFilter === "All Types" || node.type === typeFilter;

  return matchesSearch && matchesType;
}

function flattenAccounts(
  nodes: ChartAccountNode[],
  options: {
    expandedCodes: Set<string>;
    searchValue: string;
    typeFilter: AccountTypeFilter;
  },
  depth = 0,
): FlattenedAccountRow[] {
  const rows: FlattenedAccountRow[] = [];
  const isFiltering = Boolean(options.searchValue) || options.typeFilter !== "All Types";

  for (const node of nodes) {
    const childRows = node.children?.length
      ? flattenAccounts(node.children, options, depth + 1)
      : [];
    const matches = nodeMatches(node, options.searchValue, options.typeFilter);
    const visibleChildren = isFiltering
      ? childRows
      : node.children?.length && options.expandedCodes.has(node.code)
        ? childRows
        : [];

    if (isFiltering) {
      if (!matches && visibleChildren.length === 0) {
        continue;
      }

      rows.push({
        ...node,
        childCount: node.children?.length ?? 0,
        children: visibleChildren.length ? visibleChildren : undefined,
        depth,
        hasChildren: Boolean(node.children?.length),
        isExpanded: true,
      });

      rows.push(...visibleChildren);
      continue;
    }

    rows.push({
      ...node,
      childCount: node.children?.length ?? 0,
      children: visibleChildren.length ? visibleChildren : undefined,
      depth,
      hasChildren: Boolean(node.children?.length),
      isExpanded: Boolean(node.children?.length && options.expandedCodes.has(node.code)),
    });

    rows.push(...visibleChildren);
  }

  return rows;
}

function typeClass(type: AccountType) {
  return `coa-typeBadge--${type}`;
}

function accountIndent(depth: number) {
  return { paddingLeft: `${12 + depth * 18}px` };
}

function insertAccountNode(nodes: ChartAccountNode[], parentCode: string | null, account: ChartAccountNode): ChartAccountNode[] {
  if (!parentCode) {
    return [...nodes, account];
  }

  return nodes.map((node) => {
    if (node.code === parentCode) {
      return {
        ...node,
        children: [...(node.children ?? []), account],
      };
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: insertAccountNode(node.children, parentCode, account),
    };
  });
}

function removeAccountNode(nodes: ChartAccountNode[], targetCode: string): { nodes: ChartAccountNode[]; removed: ChartAccountNode | null } {
  let removed: ChartAccountNode | null = null;

  const nextNodes = nodes.flatMap((node) => {
    if (node.code === targetCode) {
      removed = node;
      return [];
    }

    if (!node.children?.length) {
      return [node];
    }

    const childResult = removeAccountNode(node.children, targetCode);

    if (childResult.removed) {
      removed = childResult.removed;
    }

    return [
      {
        ...node,
        children: childResult.nodes.length ? childResult.nodes : undefined,
      },
    ];
  });

  return { nodes: nextNodes, removed };
}

function replaceAccountNode(nodes: ChartAccountNode[], targetCode: string, replacement: ChartAccountNode): ChartAccountNode[] {
  return nodes.map((node) => {
    if (node.code === targetCode) {
      return {
        ...replacement,
        children: node.children,
      };
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: replaceAccountNode(node.children, targetCode, replacement),
    };
  });
}

function findAccountNode(nodes: ChartAccountNode[], targetCode: string): ChartAccountNode | null {
  for (const node of nodes) {
    if (node.code === targetCode) {
      return node;
    }

    if (node.children?.length) {
      const match = findAccountNode(node.children, targetCode);

      if (match) {
        return match;
      }
    }
  }

  return null;
}

function findParentCode(nodes: ChartAccountNode[], targetCode: string, parentCode: string | null = null): string | null {
  for (const node of nodes) {
    if (node.code === targetCode) {
      return parentCode;
    }

    if (node.children?.length) {
      const match = findParentCode(node.children, targetCode, node.code);

      if (match !== null) {
        return match;
      }
    }
  }

  return null;
}

function collectSubtreeCodes(node: ChartAccountNode, result = new Set<string>()) {
  result.add(node.code);

  node.children?.forEach((child) => {
    collectSubtreeCodes(child, result);
  });

  return result;
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

export function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState(() => chartOfAccounts);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>("All Types");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [expandedCodes, setExpandedCodes] = useState(() => createExpandedCodes(chartOfAccounts));
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const journalEntries = useJournalEntriesStore();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const visibleRows = useMemo(
    () =>
      flattenAccounts(accounts, {
        expandedCodes,
        searchValue: query.trim().toLowerCase(),
        typeFilter,
      }),
    [accounts, expandedCodes, query, typeFilter],
  );

  const activeTypeLabel = typeFilter === "All Types" ? "All Types" : getTypeLabel(typeFilter);
  const editingAccount = editingCode ? findAccountNode(accounts, editingCode) : null;
  const editingParentCode = editingCode ? findParentCode(accounts, editingCode) : null;
  const editingBlockedCodes = editingAccount ? collectSubtreeCodes(editingAccount) : new Set<string>();
  const selectedAccount = selectedCode ? findAccountNode(accounts, selectedCode) : null;
  const selectedAccountPath = selectedCode ? getAccountPath(accounts, selectedCode) : null;
  const selectedBalance = selectedAccount ? buildClosingBalance(selectedAccount, journalEntries) : 0;
  const selectedTransactions = selectedAccount ? buildRecentTransactions(selectedAccount, journalEntries) : [];
  const hasDetailPanel = Boolean(selectedAccount);

  const toggleGroup = (code: string) => {
    setExpandedCodes((current) => {
      const next = new Set(current);

      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }

      return next;
    });
  };

  const handleSaveAccount = (draft: NewChartAccountDraft) => {
    const nextAccount: ChartAccountNode = {
      code: draft.code,
      name: draft.name,
      normalBalance: draft.normalBalance,
      status: draft.status,
      type: draft.type,
    };

    setAccounts((current) => insertAccountNode(current, draft.parentCode, nextAccount));

    if (draft.parentCode) {
      setExpandedCodes((current) => {
        const next = new Set(current);
        next.add(draft.parentCode as string);
        return next;
      });
    }

    setNewAccountOpen(false);
  };

  const handleSaveEditedAccount = (draft: NewChartAccountDraft) => {
    if (!editingCode || !editingAccount) {
      return;
    }

    if (draft.code !== editingCode && accountCodeExists(accounts, draft.code, editingCode)) {
      return;
    }

    const updatedAccount: ChartAccountNode = {
      ...editingAccount,
      code: draft.code,
      name: draft.name,
      normalBalance: draft.normalBalance,
      status: draft.status,
      type: draft.type,
    };

    const nextAccounts =
      draft.parentCode === editingParentCode
        ? replaceAccountNode(accounts, editingCode, updatedAccount)
        : insertAccountNode(removeAccountNode(accounts, editingCode).nodes, draft.parentCode, updatedAccount);

    setAccounts(nextAccounts);
    setExpandedCodes((current) => {
      const next = new Set(current);
      next.delete(editingCode);
      next.add(draft.code);

      if (draft.parentCode) {
        next.add(draft.parentCode);
      }

      return next;
    });

    setEditingCode(null);
  };

  return (
    <div className={`coa-page ${hasDetailPanel ? "coa-page--withDetails" : ""}`}>
      <header className="coa-header">
        <div className="coa-header__copy">
          <h1 className="coa-header__title">Chart of Accounts</h1>
          <p className="coa-header__description">Manage your account structure</p>
        </div>

        <button type="button" className="button button--primary coa-header__action" onClick={() => setNewAccountOpen(true)}>
          <Icon name="plus" size={18} />
          <span>New Account</span>
        </button>
      </header>

      <section className="coa-toolbar" aria-label="Chart of accounts filters">
        <label className="coa-search">
          <Icon className="coa-search__icon" name="search" size={18} />
          <input
            type="search"
            value={query}
            placeholder="Search accounts..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="coa-filter" ref={filterRef}>
          <button
            type="button"
            className={`coa-filter__button ${filterMenuOpen ? "coa-filter__button--open" : ""}`}
            aria-expanded={filterMenuOpen}
            onClick={() => setFilterMenuOpen((current) => !current)}
          >
            <span>{activeTypeLabel}</span>
            <Icon name="chevron-down" size={16} />
          </button>

          {filterMenuOpen ? (
            <div className="coa-filter__menu" role="listbox" aria-label="Account type filter">
              {accountTypeOptions.map((option) => {
                const label = option === "All Types" ? "All Types" : getTypeLabel(option);
                const isSelected = option === typeFilter;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`coa-filter__option ${isSelected ? "coa-filter__option--active" : ""}`}
                    onClick={() => {
                      setTypeFilter(option);
                      setFilterMenuOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{label}</span>
                    {isSelected ? <Icon name="check" size={16} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <div className={`coa-layout ${hasDetailPanel ? "coa-layout--withDetails" : ""}`}>
        <section className="coa-panel">
        <div className="coa-panel__header">
          <h2>Accounts</h2>
          <span>{visibleRows.length} visible</span>
        </div>

        <div className="coa-tableWrap">
          <table className={`coa-table ${hasDetailPanel ? "coa-table--compact" : ""}`} aria-label="Chart of accounts">
            {hasDetailPanel ? (
              <colgroup>
                <col style={{ width: "100%" }} />
              </colgroup>
            ) : (
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "38%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
            )}

            <thead>
              <tr className="coa-table__headRow">
                {hasDetailPanel ? (
                  <th className="coa-table__headCell coa-table__headCell--compact" scope="col">
                    Account
                  </th>
                ) : (
                  <>
                    <th className="coa-table__headCell" scope="col">
                      Code
                    </th>
                    <th className="coa-table__headCell" scope="col">
                      Name
                    </th>
                    <th className="coa-table__headCell" scope="col">
                      Type
                    </th>
                    <th className="coa-table__headCell" scope="col">
                      Normal Balance
                    </th>
                    <th className="coa-table__headCell" scope="col">
                      Status
                    </th>
                    <th className="coa-table__headCell coa-table__headCell--actions" scope="col">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const isParent = row.hasChildren;
                const isSelected = row.code === selectedCode;

                return (
                  <tr
                    key={row.code}
                    className={`coa-table__row ${isParent ? "coa-table__row--parent" : ""} ${
                      isSelected ? "coa-table__row--selected" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCode(row.code)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCode(row.code);
                      }
                    }}
                  >
                    {hasDetailPanel ? (
                      <td className="coa-table__cell coa-table__cell--compact" colSpan={1}>
                        <div className="coa-table__name coa-table__name--compact" style={accountIndent(row.depth)}>
                          {isParent ? (
                            <button
                              type="button"
                              className="coa-table__toggle"
                              aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                              aria-expanded={row.isExpanded}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleGroup(row.code);
                              }}
                            >
                              <Icon name={row.isExpanded ? "chevron-down" : "chevron-right"} size={15} />
                            </button>
                          ) : (
                            <span className="coa-table__toggleSpacer" aria-hidden="true" />
                          )}

                          <div className="coa-table__nameCopy coa-table__nameCopy--compact">
                            <span className="coa-table__nameText">
                              {row.name} ({row.code})
                            </span>
                            <span className="coa-table__subtext">
                              {isParent ? `${row.childCount} subaccounts` : getTypeLabel(row.type)}
                            </span>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="coa-table__cell coa-table__cell--mono">{row.code}</td>
                        <td className="coa-table__cell">
                          <div className="coa-table__name" style={accountIndent(row.depth)}>
                            {isParent ? (
                              <button
                                type="button"
                                className="coa-table__toggle"
                                aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                                aria-expanded={row.isExpanded}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleGroup(row.code);
                                }}
                              >
                                <Icon name={row.isExpanded ? "chevron-down" : "chevron-right"} size={15} />
                              </button>
                            ) : (
                              <span className="coa-table__toggleSpacer" aria-hidden="true" />
                            )}

                            <div className="coa-table__nameCopy">
                              <span className="coa-table__nameText">{row.name}</span>
                              {isParent ? (
                                <span className="coa-table__subtext">{row.childCount} subaccounts</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="coa-table__cell">
                          <span className={`coa-typeBadge ${typeClass(row.type)}`}>{getTypeBadgeLabel(row.type)}</span>
                        </td>
                        <td className="coa-table__cell">{row.normalBalance}</td>
                        <td className="coa-table__cell">
                          <span className="coa-statusBadge">{row.status}</span>
                        </td>
                        <td className="coa-table__cell coa-table__cell--actions">
                          <button
                            type="button"
                            className="coa-table__action"
                            aria-label={`Edit ${row.code}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingCode(row.code);
                            }}
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            type="button"
                            className="coa-table__action coa-table__action--danger"
                            aria-label={`Delete ${row.code}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Icon name="trash-2" size={15} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </section>

        {selectedAccount ? (
          <aside className="coa-detailsPanel" aria-label="Account details">
            <div className="coa-detailsPanel__header">
              <div className="coa-detailsPanel__titleBlock">
                <p className="coa-detailsPanel__eyebrow">{getTypeLabel(selectedAccount.type)}</p>
                <h3 className="coa-detailsPanel__title">
                  {selectedAccount.name} ({selectedAccount.code})
                </h3>
              </div>

              <div className="coa-detailsPanel__actions">
                <button
                  type="button"
                  className="coa-detailsPanel__editButton"
                  onClick={() => setEditingCode(selectedAccount.code)}
                >
                  <Icon name="edit" size={15} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="coa-detailsPanel__closeButton"
                  aria-label="Close account details"
                  onClick={() => setSelectedCode(null)}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            <div className="coa-detailsPanel__metaGrid">
              <div className="coa-detailsPanel__metaItem">
                <span>Account Code</span>
                <strong>{selectedAccount.code}</strong>
              </div>
              <div className="coa-detailsPanel__metaItem">
                <span>Type</span>
                <strong>{getTypeLabel(selectedAccount.type)}</strong>
              </div>
              <div className="coa-detailsPanel__metaItem">
                <span>Status</span>
                <strong>{selectedAccount.status}</strong>
              </div>
              <div className="coa-detailsPanel__metaItem">
                <span>Normal Balance</span>
                <strong>{selectedAccount.normalBalance}</strong>
              </div>
              <div className="coa-detailsPanel__metaItem coa-detailsPanel__metaItem--full">
                <span>Account Path</span>
                <strong>{selectedAccountPath?.join(" > ") ?? selectedAccount.name}</strong>
              </div>
            </div>

            <section className="coa-detailsPanel__summary">
              <div className="coa-detailsPanel__summaryHeader">
                <span>Closing Balance</span>
                <span className={`coa-detailsPanel__summaryBadge coa-detailsPanel__summaryBadge--${selectedAccount.normalBalance.toLowerCase()}`}>
                  {selectedAccount.normalBalance}
                </span>
              </div>
              <div className="coa-detailsPanel__summaryValue">{formatMoney(selectedBalance)}</div>
              <p className="coa-detailsPanel__description">
                {selectedAccount.children?.length
                  ? `Summary account with ${selectedAccount.children.length} subaccounts.`
                  : `Posting account used for ${selectedAccount.type === "expense" ? "expense recording" : "journal entry posting"}.`}
              </p>
            </section>

            <section className="coa-detailsPanel__section">
              <div className="coa-detailsPanel__sectionHeader">
                <h4>Recent Transactions</h4>
              </div>

              <div className="coa-detailsPanel__tableWrap">
                <table className="coa-detailsPanel__table" aria-label="Recent transactions">
                  <colgroup>
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "36%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Details</th>
                      <th>Type</th>
                      <th className="coa-detailsPanel__numberCell">Debit</th>
                      <th className="coa-detailsPanel__numberCell">Credit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedTransactions.map((transaction) => (
                      <tr key={`${selectedAccount.code}-${transaction.date}-${transaction.details}`}>
                        <td>{transaction.date}</td>
                        <td>{transaction.details}</td>
                        <td>{transaction.type}</td>
                        <td className="coa-detailsPanel__numberCell">{transaction.debit}</td>
                        <td className="coa-detailsPanel__numberCell">{transaction.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </aside>
        ) : null}
      </div>

      {newAccountOpen ? (
        <NewAccountModal
          accounts={accounts}
          onClose={() => setNewAccountOpen(false)}
          onSave={handleSaveAccount}
        />
      ) : null}

      {editingAccount ? (
        <EditAccountModal
          account={editingAccount}
          accounts={accounts}
          blockedCodes={editingBlockedCodes}
          parentCode={editingParentCode}
          onClose={() => setEditingCode(null)}
          onSave={handleSaveEditedAccount}
        />
      ) : null}
    </div>
  );
}
