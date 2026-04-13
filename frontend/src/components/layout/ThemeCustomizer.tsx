import { Settings, Check, Sun, Moon, Monitor } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bundledThemes, fontFamilies } from "@/data/theme-presets";
import { useThemeCustomizer } from "@/hooks/useThemeCustomizer";

export function ThemeCustomizer() {
  const { settings, updateSetting, setTheme } = useThemeCustomizer();

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="size-8" title="Customize theme">
          <Settings className="size-4" />
        </Button>
      } />
      <PopoverContent className="w-[340px] max-h-[calc(100vh-4rem)] overflow-y-auto" align="end" sideOffset={8}>

        <div className="flex flex-col gap-4">

          {/* Mode */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Mode</p>
            <Tabs value={settings.mode} onValueChange={(v) => updateSetting("mode", v as "light" | "dark" | "system")}>
              <TabsList className="w-full">
                <TabsTrigger value="light" className="flex-1 gap-1.5 text-xs">
                  <Sun className="size-3" />Light
                </TabsTrigger>
                <TabsTrigger value="dark" className="flex-1 gap-1.5 text-xs">
                  <Moon className="size-3" />Dark
                </TabsTrigger>
                <TabsTrigger value="system" className="flex-1 gap-1.5 text-xs">
                  <Monitor className="size-3" />System
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          {/* Theme */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(bundledThemes).map(([key, theme]) => (
                <button key={key} onClick={() => setTheme(key)}
                  className={`relative flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors ${settings.theme === key ? "border-foreground bg-accent" : "border-border hover:border-foreground/30 hover:bg-accent/30"}`}>
                  <div className="flex items-center gap-2">
                    <div className="size-3.5 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                    <span className="text-xs font-medium">{theme.label}</span>
                    {settings.theme === key && <Check className="size-3 ml-auto" />}
                  </div>
                  <div className="flex gap-0.5">
                    {theme.preview.charts.map((c, i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Font Family */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Font</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(fontFamilies).map(([key, font]) => (
                <button key={key} onClick={() => updateSetting("font_family", key)}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${settings.font_family === key ? "border-foreground bg-accent font-medium" : "border-border hover:border-foreground/30 hover:bg-accent/30"}`}
                  style={{ fontFamily: font.value }}>
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Radius */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Corners</p>
            <div className="flex gap-1.5">
              {[0, 0.3, 0.5, 0.75, 1].map(v => (
                <button key={v} onClick={() => updateSetting("radius", v)}
                  className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-md border transition-colors ${settings.radius === v ? "border-foreground bg-accent" : "border-border hover:border-foreground/30"}`}>
                  <div className="size-6 border-2 border-foreground/40" style={{ borderRadius: `${v}rem` }} />
                </button>
              ))}
            </div>
          </div>

        </div>

      </PopoverContent>
    </Popover>
  );
}
