import { SideNav } from './components/SideNav';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { useIpc } from './hooks/useIpc';

function App() {
  useIpc();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      {/* 좌측 사이드바 */}
      <SideNav />

      {/* 중앙 채팅 패널 */}
      <div className="flex-1 min-w-0">
        <ChatPanel />
      </div>

      {/* 우측 미리보기 패널 */}
      <div className="w-[420px] min-w-[380px] border-l border-border">
        <PreviewPanel />
      </div>
    </div>
  );
}

export default App;
