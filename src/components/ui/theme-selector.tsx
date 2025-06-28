import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, Building, Building2, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const themeIcons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  enterprise: Building,
  corporate: Building2,
};

export const ThemeSelector: React.FC<{ variant?: 'select' | 'buttons' }> = ({
  variant = 'select',
}) => {
  const { theme, setTheme, themes, resolvedTheme, isSystemTheme } = useTheme();

  if (variant === 'buttons') {
    return (
      <div className="flex gap-2 flex-wrap">
        {themes.map(themeOption => {
          const Icon = themeIcons[themeOption.value];
          const isActive = theme === themeOption.value;

          return (
            <Button
              key={themeOption.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(themeOption.value)}
              className={`flex items-center gap-2 relative ${
                isActive && isSystemTheme ? 'ring-2 ring-blue-500' : ''
              }`}
              title={themeOption.description}
            >
              <Icon className="h-4 w-4" />
              <span>{themeOption.label}</span>
              {isSystemTheme && themeOption.value === 'system' && (
                <span className="text-xs opacity-70">({resolvedTheme})</span>
              )}
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
          {isSystemTheme && (
            <span className="text-xs text-muted-foreground ml-auto">
              ({resolvedTheme})
            </span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {themes.map(themeOption => {
          const Icon = themeIcons[themeOption.value];
          const isActive = theme === themeOption.value;

          return (
            <SelectItem key={themeOption.value} value={themeOption.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {themeOption.label}
                    {isActive && isSystemTheme && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {themeOption.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
