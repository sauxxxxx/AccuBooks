import type { ComponentType } from "react";
import {
  Calendar,
  Check,
  CheckCircle,
  Bell,
  AlertTriangle,
  BookOpen,
  Download,
  DollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  CreditCard,
  Edit2,
  FileText,
  Grid,
  Mail,
  PieChart,
  Menu,
  Eye,
  Package,
  Plus,
  Play,
  TrendingDown,
  TrendingUp,
  Trash2,
  Repeat,
  Search,
  Settings as FeatherSettings,
  Shield,
  User,
  Users,
  X,
  XCircle,
} from "react-feather";

export type IconName =
  | "brand"
  | "bank"
  | "dashboard"
  | "journal"
  | "accounts"
  | "statements"
  | "compliance"
  | "payroll"
  | "invoicing"
  | "arap"
  | "clients"
  | "users"
  | "suppliers"
  | "settings"
  | "search"
  | "bell"
  | "alert-triangle"
  | "calendar"
  | "check"
  | "check-circle"
  | "dollar-sign"
  | "eye"
  | "menu"
  | "plus"
  | "download"
  | "mail"
  | "collapse-left"
  | "collapse-right"
  | "pie-chart"
  | "trending-down"
  | "trending-up"
  | "user"
  | "play"
  | "chevron-left"
  | "chevron-down"
  | "chevron-right"
  | "edit"
  | "x"
  | "trash-2"
  | "x-circle";

type IconProps = {
  className?: string;
  name: IconName;
  size?: number;
  title?: string;
};

type FeatherIconName = Exclude<IconName, "brand" | "bank">;

const featherIcons: Record<FeatherIconName, ComponentType<any>> = {
  dashboard: Grid,
  journal: BookOpen,
  accounts: Clipboard,
  statements: FileText,
  compliance: Shield,
  payroll: CreditCard,
  invoicing: FileText,
  arap: Repeat,
  clients: Users,
  users: Users,
  suppliers: Package,
  settings: FeatherSettings,
  search: Search,
  bell: Bell,
  "alert-triangle": AlertTriangle,
  calendar: Calendar,
  check: Check,
  "check-circle": CheckCircle,
  "dollar-sign": DollarSign,
  eye: Eye,
  menu: Menu,
  plus: Plus,
  download: Download,
  mail: Mail,
  "collapse-left": ChevronLeft,
  "collapse-right": ChevronRight,
  "pie-chart": PieChart,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  user: User,
  play: Play,
  "chevron-left": ChevronLeft,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  edit: Edit2,
  x: X,
  "trash-2": Trash2,
  "x-circle": XCircle,
};

function BankGlyph({ className, size = 20, title }: Pick<IconProps, "className" | "size" | "title">) {
  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 10.2 12 5.8l7.5 4.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
      <path d="M5 10.2h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
      <path d="M6.7 10.7v7.3M10.1 10.7v7.3M13.9 10.7v7.3M17.3 10.7v7.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
      <path d="M4.6 18h14.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
    </svg>
  );
}

export function Icon({ className, name, size = 20, title }: IconProps) {
  const ariaProps = title ? { "aria-label": title } : { "aria-hidden": true as const };

  if (name === "brand" || name === "bank") {
    return <BankGlyph className={className} size={size} title={title} />;
  }

  const FeatherIcon = featherIcons[name as FeatherIconName];

  return (
    <FeatherIcon
      {...ariaProps}
      className={className}
      size={size}
      strokeWidth={1.9}
      title={title}
    />
  );
}
