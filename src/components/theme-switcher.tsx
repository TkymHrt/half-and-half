"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const IconSize = 16;
  const iconProps = { className: "text-muted-foreground", size: IconSize };
  const renderThemeIcon = () => {
    if (theme === "light") {
      return <Sun {...iconProps} key="light" />;
    }
    if (theme === "dark") {
      return <Moon {...iconProps} key="dark" />;
    }
    return <Laptop {...iconProps} key="system" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={"sm"} variant="ghost">
          {renderThemeIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-content">
        <DropdownMenuRadioGroup
          onValueChange={(e) => setTheme(e)}
          value={theme}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <Sun className="text-muted-foreground" size={IconSize} />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <Moon className="text-muted-foreground" size={IconSize} />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <Laptop className="text-muted-foreground" size={IconSize} />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
