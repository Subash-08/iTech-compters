export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: SidebarItem[];
}

export interface AdminLayoutProps {
  children: React.ReactNode;
}