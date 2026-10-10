"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { ColorItem, fetchColors } from "@/lib/colorService";

interface AdvancedColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  label?: string;
  defaultSwatches?: { label: string; color: string }[];
}

export function AdvancedColorPicker({ color, onChange, label, defaultSwatches }: AdvancedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dbColors, setDbColors] = useState<ColorItem[]>([]);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch DB colors when component mounts
    fetchColors().then((data) => {
      if (data && data.length > 0) {
        setDbColors(data);
      }
    });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Convert color to standard Hex for native input matching
  const toHexColor = (colorStr: string): string => {
    if (!colorStr) return "#000000";
    if (colorStr.startsWith("#")) return colorStr.substring(0, 7);
    // basic rgba conversion can go here if needed
    return colorStr;
  };

  const currentHex = toHexColor(color);

  const filteredColors = dbColors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.hex.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 relative">
      {label && <span className="text-xs font-semibold text-gray-700">{label}</span>}
      
      <div className="flex items-center gap-3">
        {/* Native Input Color for Custom pick */}
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-200 shadow-sm cursor-pointer">
          <input
            type="color"
            value={currentHex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-10px] w-12 h-12 cursor-pointer"
          />
        </div>
        
        {/* Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 py-1.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between text-xs transition-colors"
        >
          <span className="font-mono text-gray-600 truncate mr-2">
            {dbColors.find(c => c.hex.toLowerCase() === currentHex.toLowerCase())?.name || currentHex}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-[280px] sm:w-[320px] right-0 sm:right-auto sm:left-0 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: '400px' }}
        >
          <div className="p-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm màu (VD: Almond, #EED9C4)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-3 flex-1 custom-scrollbar">
            {/* Mặc định / Swatches */}
            {!search && defaultSwatches && defaultSwatches.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Màu Gợi Ý
                </div>
                <div className="flex flex-wrap gap-2">
                  {defaultSwatches.map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        onChange(swatch.color);
                        setIsOpen(false);
                      }}
                      className="w-6 h-6 rounded-md shadow-sm border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.label}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Danh sách Màu ({filteredColors.length})
            </div>
            {filteredColors.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500">
                Không tìm thấy màu phù hợp
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {filteredColors.map((c) => {
                  const isSelected = c.hex.toLowerCase() === currentHex.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange(c.hex);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors text-left ${
                        isSelected ? "border-indigo-500 bg-indigo-50" : "border-transparent hover:bg-gray-100"
                      }`}
                      title={`${c.name} (${c.hex})`}
                    >
                      <div
                        className="w-5 h-5 rounded shadow-sm shrink-0 border border-black/10 flex items-center justify-center"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-gray-700 truncate">{c.name}</div>
                        <div className="text-[9px] text-gray-400 font-mono truncate">{c.hex}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
