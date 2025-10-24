import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SidebarDebug() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed);
      setEventCount(prev => prev + 1);
    };

    window.addEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    return () => {
      window.removeEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    };
  }, []);

  const triggerTestEvent = () => {
    const event = new CustomEvent('sidebar-state-change', {
      detail: { collapsed: !sidebarCollapsed }
    });
    window.dispatchEvent(event);
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80">
      <CardHeader>
        <CardTitle className="text-sm">Sidebar Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs space-y-1">
          <div>Status: <span className={cn(
            "font-mono px-2 py-1 rounded text-xs",
            sidebarCollapsed ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          )}>
            {sidebarCollapsed ? "COLLAPSED" : "EXPANDED"}
          </span></div>
          <div>Events: <span className="font-mono">{eventCount}</span></div>
          <div>Layout Margin: <span className="font-mono">
            {sidebarCollapsed ? "ml-16" : "ml-64"}
          </span></div>
        </div>
        
        <Button 
          onClick={triggerTestEvent}
          variant="outline" 
          size="sm"
          className="w-full"
        >
          Toggle Sidebar (Test)
        </Button>
        
        <div className="text-xs text-gray-500">
          This debug panel shows the current sidebar state and layout responsiveness.
          The main content should adjust its margin when sidebar collapses/expands.
        </div>
      </CardContent>
    </Card>
  );
}
