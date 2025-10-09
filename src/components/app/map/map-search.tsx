"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MapSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function MapSearch({
  searchTerm,
  onSearchChange,
  placeholder = "物品名・担当者・タスク名で検索",
  className,
}: MapSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          className="pr-10 pl-10"
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          type="search"
          value={searchTerm}
        />
        {searchTerm && (
          <Button
            className="-translate-y-1/2 absolute top-1/2 right-1 size-8"
            onClick={handleClear}
            size="sm"
            variant="ghost"
          >
            <X className="size-3" />
            <span className="sr-only">検索をクリア</span>
          </Button>
        )}
      </div>

      {isFocused && searchTerm && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          <p className="text-muted-foreground text-xs">
            "{searchTerm}" で検索中...
          </p>
        </div>
      )}
    </div>
  );
}
