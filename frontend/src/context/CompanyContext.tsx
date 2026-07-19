import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyService } from '../services/company.service';
import type { CompanyProfile } from '../types/company.types';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  company: CompanyProfile | null;
  currencySymbol: string;
  isLoading: boolean;
  refreshCompany: () => Promise<void>;
  formatCurrency: (amount: number | null | undefined) => string;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchCompany = async () => {
    try {
      if (isAuthenticated) {
        setIsLoading(true);
        const profile = await companyService.getProfile();
        setCompany(profile);
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Failed to fetch company profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [isAuthenticated]);

  const currencySymbol = company?.currency || 'INR';

  const formatCurrency = (amount: number | null | undefined): string => {
    const val = amount || 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencySymbol,
      }).format(val);
    } catch (e) {
      // Fallback if currency symbol is somehow invalid for Intl.NumberFormat
      if (val < 0) {
        return `-${currencySymbol}${Math.abs(val).toFixed(2)}`;
      }
      return `${currencySymbol}${val.toFixed(2)}`;
    }
  };

  return (
    <CompanyContext.Provider value={{ company, currencySymbol, isLoading, refreshCompany: fetchCompany, formatCurrency }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
