
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, Building, Building2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const themeIcons = {
  light: Sun,
  dark: Moon,
  enterprise: Building,
  corporate: Building2,
};

export const ThemeSelector: React.FC<{ variant?: 'select' | 'buttons' }> = ({ 
  variant = 'select' 
}) => {
  const { theme, setTheme, themes } = useTheme();

  if (variant === 'buttons') {
    return (
      <div className="flex gap-2">
        {themes.map((themeOption) => {
          const Icon = themeIcons[themeOption.value];
          return (
            <Button
              key={themeOption.value}
              variant={theme === themeOption.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {themeOption.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-48">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {themes.map((themeOption) => {
          const Icon = themeIcons[themeOption.value];
          return (
            <SelectItem key={themeOption.value} value={themeOption.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground">{themeOption.description}</div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
