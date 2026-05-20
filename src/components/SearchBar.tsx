'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';

interface SearchBarProps {
  onSearch: (ip: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

// Client-side regex for basic IP and Domain validation
const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,24}$/;

export default function SearchBar({ onSearch, isLoading, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const validateInput = (val: string) => {
    if (!val) {
      setIsValid(true);
      return;
    }
    const trimmed = val.trim();
    setIsValid(ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || domainRegex.test(trimmed));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsDirty(true);
    validateInput(val);
  };

  const handleClear = () => {
    setQuery('');
    setIsValid(true);
    setIsDirty(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const isInputValid = ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || domainRegex.test(trimmed);
    setIsValid(isInputValid);
    setIsDirty(true);

    if (isInputValid) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex flex-col gap-2">
        <div 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card transition-all duration-300 focus-within:ring-2 ${
            !isValid && isDirty
              ? 'ring-2 ring-red-500/30 border-red-500/50' 
              : 'focus-within:ring-brand-orange/20 focus-within:border-brand-orange/40'
          }`}
        >
          {/* Search Icon */}
          <Search className="w-5 h-5 text-text-muted shrink-0" />

          {/* Input field */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Search IP address or domain (e.g. 8.8.8.8, google.com)"
            className="w-full bg-transparent border-none outline-none py-1 text-sm md:text-base placeholder-text-muted/65 text-foreground shrink min-w-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-border-muted text-text-muted hover:text-foreground transition-all duration-150 shrink-0 cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim() || (!isValid && isDirty)}
            className={`px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold cursor-pointer select-none transition-all duration-200 shrink-0 active:scale-95 ${
              isLoading || !query.trim() || (!isValid && isDirty)
                ? 'bg-border-muted text-text-muted cursor-not-allowed opacity-50'
                : 'bg-brand-orange text-white hover:bg-brand-orange-hover hover:shadow-md shadow-brand-orange/20'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing
              </span>
            ) : (
              'Analyze'
            )}
          </button>
        </div>

        {/* Error Messaging */}
        {!isValid && isDirty && (
          <div className="flex items-center gap-1.5 px-3 text-red-500 text-xs md:text-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please enter a valid IP address or domain (e.g. 8.8.8.8, google.com).</span>
          </div>
        )}
      </div>
    </form>
  );
}
