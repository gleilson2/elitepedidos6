import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Store2User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'operator' | 'manager' | 'admin';
  is_active: boolean;
  permissions: {
    can_view_sales: boolean;
    can_view_cash: boolean;
    can_view_products: boolean;
    can_view_reports: boolean;
    can_manage_settings: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const useStore2Users = () => {
  const [users, setUsers] = useState<Store2User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários da Loja 2...');
      
      const { data, error } = await supabase
        .from('store2_users')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      console.log(`✅ ${data?.length || 0} usuários da Loja 2 carregados`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      console.error('❌ Erro ao carregar usuários da Loja 2:', errorMessage);
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (user: Omit<Store2User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando usuário na Loja 2:', user);
      
      const { data, error } = await supabase
        .from('store2_users')
        .insert([user])
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => [...prev, data]);
      console.log('✅ Usuário da Loja 2 criado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar usuário da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<Store2User>) => {
    try {
      console.log('✏️ Atualizando usuário da Loja 2:', id, updates);
      
      const { data, error } = await supabase
        .from('store2_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      console.log('✅ Usuário da Loja 2 atualizado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo usuário da Loja 2:', id);
      
      const { error } = await supabase
        .from('store2_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== id));
      console.log('✅ Usuário da Loja 2 excluído');
    } catch (err) {
      console.error('❌ Erro ao excluir usuário da Loja 2:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    }
  }, []);

  const getUserByCredentials = useCallback(async (username: string, password: string) => {
    try {
      console.log('🔐 Verificando credenciais da Loja 2:', username);
      
      const { data, error } = await supabase
        .rpc('verify_store2_user_password', {
          p_username: username,
          p_password_to_check: password
        });

      if (error) throw error;
      
      const user = data && data.length > 0 ? data[0] : null;
      console.log('✅ Credenciais verificadas:', !!user);
      return user;
    } catch (err) {
      console.error('❌ Erro ao verificar credenciais da Loja 2:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    getUserByCredentials,
    refetch: fetchUsers
  };
};