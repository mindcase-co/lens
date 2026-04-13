import type { TabConfig } from "@/types/config";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function TabBar({ tabs, activeTab, onTabChange, badges }: {
  tabs: TabConfig[]; activeTab: string; onTabChange: (name: string) => void; badges?: Record<string, number>;
}) {
  if (tabs.length <= 1) return null;
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-4">
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.name} value={tab.name} className="gap-1.5">
            {tab.name}
            {badges?.[tab.name] !== undefined && <Badge variant="secondary" className="text-xs px-1.5 py-0">{badges[tab.name]}</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
