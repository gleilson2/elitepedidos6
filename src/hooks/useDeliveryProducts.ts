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
        console.warn('⚠️ Supabase não configurado - usando produtos de demonstração');
        
        // Fallback para produtos de demonstração se Supabase não estiver configurado
        const { products: demoProducts } = await import('../data/products');
        const mappedProducts = demoProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category as DeliveryProduct['category'],
          price: product.price,
          original_price: product.originalPrice,
          description: product.description,
          image_url: product.image,
          is_active: product.isActive !== false,
          is_weighable: product.is_weighable || false,
          price_per_gram: product.pricePerGram,
          complement_groups: product.complementGroups,
          sizes: product.sizes,
          scheduled_days: product.scheduledDays,
          availability_type: product.availability?.type || 'always',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setProducts(mappedProducts);
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
      
      // Check if data was returned from the insert operation
      if (!data) {
        return null;
      }
      
      const newProduct = Array.isArray(data) ? data[0] : data;
      setProducts(prev => [...prev, newProduct]);
      console.log('✅ Produto criado:', data);
      return newProduct;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<DeliveryProduct>) => {
    try {
      console.log('✏️ Atualizando produto:', id, updates);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }

      // Prepare clean update data - remove undefined values and system fields
      const { 
        created_at, 
        updated_at, 
        has_complements, 
        id: updateId,
        ...cleanUpdates 
      } = updates as any;

      // Clean up complement_groups structure if present
      if (cleanUpdates.complement_groups) {
        // Ensure complement_groups is properly structured for database
        cleanUpdates.complement_groups = Array.isArray(cleanUpdates.complement_groups) 
          ? cleanUpdates.complement_groups 
          : null;
      }

      // Remove undefined values and add updated_at
      const safeUpdate = Object.fromEntries(
        Object.entries({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        }).filter(([, value]) => value !== undefined)
      );

      console.log('📝 Dados para atualização:', {
        id,
        safeUpdate,
        originalUpdates: updates,
        supabaseUrl: supabaseUrl.substring(0, 30) + '...'
      });

      // Perform the update with better error handling
      const { data, error } = await supabase
        .from('delivery_products')
        .update(safeUpdate)
        .eq('id', id)
        .select('*');

      if (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows updated - check if product exists and treat as no-op if it does
          console.log('ℹ️ Nenhuma linha atualizada (PGRST116) - verificando se produto existe...');
          
          const { data: existingProduct, error: checkError } = await supabase
            .from('delivery_products')
            .select('*')
            .eq('id', id)
            .single();
            
          if (checkError || !existingProduct) {
            throw new Error(`Produto com ID ${id} não foi encontrado no banco de dados.`);
          } else {
            // Product exists but no changes were made - this is a successful no-op
            console.log('✅ Produto existe, nenhuma alteração detectada - operação bem-sucedida');
            setProducts(prev => prev.map(p => p.id === id ? existingProduct : p));
            return existingProduct;
          }
        } else if (error.code === '23505') {
          throw new Error('Já existe um produto com este código ou nome. Use valores únicos.');
        } else if (error.code === '42501') {
          throw new Error('Sem permissão para atualizar este produto. Verifique as políticas de segurança.');
        } else if (error.code === 'PGRST301') {
          throw new Error('Produto não encontrado ou sem permissão para atualizá-lo.');
        } else {
          throw new Error(`Erro ao atualizar produto: ${error.message || 'Erro desconhecido'}`);
        }
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum dado retornado - produto pode não ter sido encontrado');
        return null;
      }

      const updatedProduct = Array.isArray(data) ? data[0] : data;
      console.log('✅ Produto atualizado no banco:', updatedProduct);

      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      
      console.log('✅ Estado local atualizado');
      return updatedProduct;

    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err);
      throw err;
    }
  }, []);

  const syncWithDatabase = useCallback(async () => {
    console.log('🔄 Sincronizando produtos com banco de dados...');
    await fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo produto:', id);
      
      const { error } = await supabase
        .from('delivery_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log('✅ Produto excluído');
    } catch (err) {
      console.error('❌ Erro ao excluir produto:', err);
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