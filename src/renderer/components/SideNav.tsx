import { useCardNewsStore, type NavView } from '../stores/useCardNewsStore';

const navItems: { view: NavView; label: string; icon: string }[] = [
  { view: 'create', label: '만들기', icon: '✏️' },
  { view: 'history', label: '작업목록', icon: '📋' },
  { view: 'settings', label: '설정', icon: '⚙️' },
];

export function SideNav() {
  const currentView = useCardNewsStore((s) => s.currentView);
  const setCurrentView = useCardNewsStore((s) => s.setCurrentView);
  const resetProject = useCardNewsStore((s) => s.resetProject);
  const clearMessages = useCardNewsStore((s) => s.clearMessages);

  const slides = useCardNewsStore((s) => s.slides);

  const handleNavClick = (view: NavView) => {
    if (view === 'create' && currentView === 'create') {
      if (slides.length > 0 && !window.confirm('현재 작업을 초기화하시겠습니까?')) {
        return;
      }
      resetProject();
      clearMessages();
    }
    setCurrentView(view);
  };

  return (
    <nav className="flex flex-col w-16 h-full bg-surface-secondary border-r border-border">
      <div className="flex-1 flex flex-col items-center pt-4 gap-1">
        {navItems.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => handleNavClick(view)}
            className={`
              flex flex-col items-center justify-center w-12 h-12 rounded-lg
              text-xs transition-colors cursor-pointer
              ${
                currentView === view
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-tertiary hover:text-text'
              }
            `}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="mt-0.5 text-[10px]">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
