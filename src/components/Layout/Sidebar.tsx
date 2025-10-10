import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingCart, 
  Factory, 
  Package, 
  Truck, 
  Users, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Produção', href: '/production', icon: Factory },
  { name: 'Estoque', href: '/inventory', icon: Package },
  { name: 'Entregas', href: '/logistics', icon: Truck },
  { name: 'Equipe', href: '/team', icon: Users },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-elegant">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
          Olie OPS
        </h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-smooth',
                isActive ? 'scale-110' : 'group-hover:scale-110'
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent-soft rounded-lg p-4">
          <p className="text-sm font-medium text-accent mb-1">Ateliê Olie®</p>
          <p className="text-xs text-muted-foreground">
            Sistema integrado com Tiny
          </p>
        </div>
      </div>
    </aside>
  );
};
