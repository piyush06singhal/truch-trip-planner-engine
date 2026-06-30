import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin, Loader2, History } from 'lucide-react';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal query with parent value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spotterai_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save a query to recent searches
  const saveToRecent = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const filtered = recentSearches.filter((s) => s !== searchQuery);
    const updated = [searchQuery, ...filtered].slice(0, 5); // keep last 5
    setRecentSearches(updated);
    localStorage.setItem('spotterai_recent_searches', JSON.stringify(updated));
  };

  // Debounced search call to Nominatim
  const fetchSuggestions = (searchQuery: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: searchQuery,
              format: 'json',
              limit: 5,
              addressdetails: 1,
            },
            headers: {
              'Accept-Language': 'en',
            }
          }
        );
        const results = response.data.map((item: { display_name: string }) => item.display_name);
        setSuggestions(results);
      } catch (err) {
        // nominatim fallback recovery
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce
  };

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setActiveIndex(-1);
    fetchSuggestions(val);
  };

  const handleSelect = (selectedVal: string) => {
    setQuery(selectedVal);
    onChange(selectedVal);
    saveToRecent(selectedVal);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    const visibleItems = suggestions.length > 0 ? suggestions : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < visibleItems.length) {
        handleSelect(visibleItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showSuggestions = isOpen && (suggestions.length > 0 || (query.length === 0 && recentSearches.length > 0));

  return (
    <div className="relative w-full select-none" ref={containerRef}>
      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={`flex h-10 w-full rounded-lg border bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
            error ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:border-transparent'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>

      {error && (
        <p id={`${label}-error`} className="text-xs text-destructive mt-1 font-medium">
          {error}
        </p>
      )}

      {/* Autocomplete Dropdown Panel */}
      {showSuggestions && (
        <ul
          className="absolute z-50 w-full mt-1.5 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-none py-1.5 focus:outline-none"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                  index === activeIndex 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-foreground hover:bg-secondary/60'
                }`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{item}</span>
              </li>
            ))
          ) : (
            // Show recent searches when search query is empty
            <>
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <History className="h-3 w-3" /> Recent Searches
              </div>
              {recentSearches.map((item, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(item)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                    index === activeIndex 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-foreground hover:bg-secondary/60'
                  }`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">{item}</span>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
