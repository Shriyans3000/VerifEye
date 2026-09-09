import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'Enforcement Officer' | 'Senior Officer' | 'Administrator';

export interface UserProfile {
  id: string;
  name: string;
  badgeId: string;
  email: string;
  role: UserRole;
  jurisdiction: string;
  department: string;
}

export const MOCK_USERS: Record<UserRole, UserProfile> = {
  'Enforcement Officer': {
    id: 'usr_eo_042',
    name: 'Inspector Rajesh Kumar',
    badgeId: 'LM-DEL-8921',
    email: 'r.kumar@legalmetrology.gov.in',
    role: 'Enforcement Officer',
    jurisdiction: 'Zone 4, New Delhi',
    department: 'Department of Consumer Affairs, Legal Metrology Division',
  },
  'Senior Officer': {
    id: 'usr_so_018',
    name: 'Dy. Controller Meenakshi Sundaram',
    badgeId: 'LM-HQ-4412',
    email: 'm.sundaram@legalmetrology.gov.in',
    role: 'Senior Officer',
    jurisdiction: 'Northern Regional Headquarters',
    department: 'Legal Metrology Enforcement Directorate',
  },
  'Administrator': {
    id: 'usr_adm_001',
    name: 'Dr. Anand Verma (Admin)',
    badgeId: 'NIC-SYS-1090',
    email: 'sysadmin.verifeye@nic.in',
    role: 'Administrator',
    jurisdiction: 'National Informatics Centre / VerifEye Central',
    department: 'Digital Enforcement & Standards Administration',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authEnabled: boolean;
  setRole: (role: UserRole) => void;
  login: (role?: UserRole, email?: string) => Promise<boolean>;
  logout: () => void;
}

// Config flag: Set to false for frictionless hackathon prototype evaluation
export const AUTH_ENABLED = false;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Enforcement Officer for demo ease
  const [user, setUser] = useState<UserProfile | null>(MOCK_USERS['Enforcement Officer']);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Sync state if user switches role
  const setRole = (role: UserRole) => {
    const selected = MOCK_USERS[role];
    setUser(selected);
    setIsAuthenticated(true);
  };

  const login = async (role: UserRole = 'Enforcement Officer', email?: string): Promise<boolean> => {
    // Mock authentication: purely client-side simulation without password persistence
    const base = MOCK_USERS[role];
    setUser({
      ...base,
      email: email && email.includes('@') ? email : base.email,
    });
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    if (AUTH_ENABLED) {
      setUser(null);
      setIsAuthenticated(false);
    } else {
      // In demo mode, reset to standard Enforcement Officer
      setUser(MOCK_USERS['Enforcement Officer']);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: AUTH_ENABLED ? isAuthenticated : true,
        authEnabled: AUTH_ENABLED,
        setRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
