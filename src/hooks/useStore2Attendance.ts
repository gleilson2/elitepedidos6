import { useState, useCallback } from 'react';

// Credenciais padrão da Loja 2 - definidas fora do hook para evitar problemas de ordem dos hooks
const STORE2_CREDENTIALS = [
  {
    id: '1',
    username: 'loja2',
    password: 'elite2024',
    name: 'Administrador Loja 2',
    role: 'admin' as const,
    isActive: true,
    permissions: {
      can_view_orders: false, // Loja 2 não tem delivery
      can_update_status: false,
      can_chat: false,
      can_create_manual_orders: false,
      can_print_orders: true
    }
  }
];

interface Store2AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'attendant' | 'admin';
    permissions: {
      can_view_orders: boolean;
      can_update_status: boolean;
      can_chat: boolean;
      can_create_manual_orders: boolean;
      can_print_orders: boolean;
    };
  };
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2AttendanceSession>({
    isAuthenticated: false
  });

  const login = useCallback((username: string, password: string): boolean => {
    console.log('🔐 Tentativa de login na Loja 2:', username);
    
    // Verificar credenciais locais
    const user = STORE2_CREDENTIALS.find(u => 
      u.username === username && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      console.log('✅ Login da Loja 2 bem-sucedido para:', user.name);
      
      setSession({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        }
      });
      return true;
    } else {
      console.log('❌ Login da Loja 2 falhou - credenciais inválidas');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logout da Loja 2');
    setSession({
      isAuthenticated: false
    });
  }, []);

  return {
    session,
    login,
    logout
  };
};