import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DeliveryProduct {
  id: string;
  name: string;
  category: 'acai' | 'combo' | 'milkshake' | 'vitamina' | 'sorvetes' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros';
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  complement_groups?: any;
  sizes?: any;
  scheduled_days?: any;
  availability_type?: string;
  created_at: string;
  updated_at: string;
}

export const useDeliveryProducts = () => {
  const [products, setProducts] = useState<DeliveryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.error('❌ Supabase não configurado - não é possível carregar produtos');
        setError('Supabase não configurado. Configure as variáveis de ambiente para carregar produtos.');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      console.log('🔄 Carregando produtos do banco de dados...');
      
      const { data, error } = await supabase
        .from('delivery_products')
        .select('*')
        .order('name');

      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} produtos carregados do banco`);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('❌ Erro ao carregar produtos:', errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<DeliveryProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando produto:', product);
      
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', user);
      
      const { data, error } = await supabase
        .from('delivery_products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Verificar se o produto foi realmente criado
      if (!data || !data.id) {
        console.error('❌ Produto não foi criado - nenhum dado retornado');
        throw new Error('Produto não foi criado no banco de dados. Tente novamente.');
      }
      
      console.log('✅ Produto criado no banco com ID:', data.id);
      
      // Atualizar estado local apenas após confirmação do banco
      setProducts(prev => [...prev, data]);
      
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      
      // Verificar se é erro de RLS
      if (err.code === 'PGRST301' || err.message?.includes('permission denied') || err.message?.includes('RLS')) {
        throw new Error('Erro de permissão: Verifique se você tem acesso para criar produtos. Entre em contato com o administrador.');
      }
      
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<DeliveryProduct>) => {
    try {
      console.log('✏️ Atualizando produto:', id, updates);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }

      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual para update:', user);
      
      // Primeiro verificar se o produto existe
      const { data: existingProduct, error: checkError } = await supabase
        .from('delivery_products')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Erro ao verificar produto:', checkError);
        throw new Error(`Erro ao verificar produto: ${checkError.message}`);
      }
      
      if (!existingProduct) {
        console.error('❌ Produto não encontrado:', id);
        throw new Error('Produto não encontrado no banco de dados');
      }
      
      console.log('✅ Produto encontrado, prosseguindo com update');
      
      const { error } = await supabase
        .from('delivery_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro no update:', error);
        
        // Verificar se é erro de RLS
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          throw new Error('Erro de permissão: Verifique se você tem acesso para atualizar produtos. Entre em contato com o administrador.');
        }
        
        throw new Error(`Erro ao atualizar produto: ${error.message}`);
      }

      console.log('✅ Produto atualizado com sucesso');
      
      // Atualizar estado local
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar produto');
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Deletando produto:', id);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual para delete:', user);
      
      const { error } = await supabase
        .from('delivery_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro no delete:', error);
        
        // Verificar se é erro de RLS
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          throw new Error('Erro de permissão: Verifique se você tem acesso para deletar produtos. Entre em contato com o administrador.');
        }
        
        throw error;
      }
      
      console.log('✅ Produto deletado com sucesso');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, []);

  // Configurar subscription em tempo real
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    // Verificar se Supabase está configurado
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'your_supabase_url_here' || 
        supabaseKey === 'your_supabase_anon_key_here' ||
        supabaseUrl.includes('placeholder')) {
      console.log('⚠️ Supabase não configurado - subscription em tempo real desabilitada');
    } else {
      console.log('🔄 Configurando subscription em tempo real para produtos...');
      
      channel = supabase
        .channel('delivery_products_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_products'
          },
          (payload) => {
            console.log('📡 Mudança detectada na tabela delivery_products:', payload);
            
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new) {
                  console.log('➕ Produto adicionado:', payload.new);
                  setProducts(prev => {
                    // Verificar se o produto já existe para evitar duplicatas
                    const exists = prev.some(p => p.id === payload.new.id);
                    if (exists) return prev;
                    return [...prev, payload.new as DeliveryProduct];
                  });
                }
                break;
                
              case 'UPDATE':
                if (payload.new) {
                  console.log('✏️ Produto atualizado:', payload.new);
                  setProducts(prev => 
                    prev.map(p => 
                      p.id === payload.new.id ? payload.new as DeliveryProduct : p
                    )
                  );
                }
                break;
                
              case 'DELETE':
                if (payload.old) {
                  console.log('🗑️ Produto removido:', payload.old);
                  setProducts(prev => 
                    prev.filter(p => p.id !== payload.old.id)
                  );
                }
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da subscription:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscription em tempo real ativa para produtos');
          }
        });
    }

    // Cleanup function
    return () => {
      if (channel) {
        console.log('🔌 Desconectando subscription em tempo real...');
        channel.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};