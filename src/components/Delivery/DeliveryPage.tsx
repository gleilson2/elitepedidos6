import React, { useState } from 'react';
import { MessageCircle, Filter, ShoppingCart, Star, Zap } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import Cart from './Cart';
import AcaiChatbot from '../Chatbot/AcaiChatbot';
import IARecommender from './IARecommender';
import StoreStatusBanner from './StoreStatusBanner';
import { categoryNames } from '../../data/products';
import { Product } from '../../types/product';
import { useCart } from '../../hooks/useCart';
import { useStoreHours } from '../../hooks/useStoreHours';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { 
  getPromotionsOfTheDay, 
  hasTodaySpecialPromotions, 
  getTodaySpecialMessage,
  getTodaySpecialDescription,
  isQuintaElite,
  getQuintaEliteProducts,
  isProductAvailable,
  validateProductSchedules,
  setProductSchedulingHook
} from '../../utils/availability';

const DeliveryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Product['category'] | 'all' | 'today'>('today');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Customer state for recommendations
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const {
    items,
    isOpen: isCartOpen,
    setIsOpen: setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  } = useCart();

  const { storeSettings } = useStoreHours();
  const { getStoreStatus } = useStoreHours();
  const productScheduling = useProductScheduling();
  const { getRecommendations } = useRecommendations();
  const { products: deliveryProducts, loading: productsLoading } = useDeliveryProducts();
  
  // Configurar hook para funções de availability
  React.useEffect(() => {
    setProductSchedulingHook(productScheduling);
  }, [productScheduling]);
  
  // Try to get customer ID from localStorage
  React.useEffect(() => {
    const storedCustomerId = localStorage.getItem('customer_id');
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
    }
  }, []);
  
  // Usar produtos diretamente do banco de dados
  const products = React.useMemo(() => {
    if (!deliveryProducts || deliveryProducts.length === 0) {
      return [];
    }

    return deliveryProducts.map(dbProduct => ({
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category as Product['category'],
      price: dbProduct.price,
      originalPrice: dbProduct.original_price,
      pricePerGram: dbProduct.price_per_gram,
      description: dbProduct.description,
      image: dbProduct.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: dbProduct.is_active,
      is_weighable: dbProduct.is_weighable,
      complementGroups: Array.isArray(dbProduct.complement_groups) 
        ? dbProduct.complement_groups.map(group => ({
            id: group.id || `group-${Math.random()}`,
            name: group.name || 'Grupo sem nome',
            required: group.required || false,
            minItems: group.min_items || 0,
            maxItems: group.max_items || 1,
            complements: Array.isArray(group.complements) ? group.complements.map(comp => ({
              id: comp.id || `comp-${Math.random()}`,
              name: comp.name || 'Complemento',
              price: comp.price || 0,
              description: comp.description || ''
            })) : (Array.isArray(group.options) ? group.options.map(opt => ({
              id: opt.id || `opt-${Math.random()}`,
              name: opt.name || 'Opção',
              price: opt.price || 0,
              description: opt.description || ''
            })) : [])
          }))
        : [],
      sizes: dbProduct.sizes,
      scheduledDays: dbProduct.scheduled_days,
      availability: dbProduct.availability_type ? {
        type: dbProduct.availability_type as any,
        scheduledDays: dbProduct.scheduled_days
      } : undefined
    }));
  }, [deliveryProducts]);
  
  // Filtrar apenas produtos ativos
  const activeProducts = products.filter(product => {
    const isActive = product.isActive !== false;
    if (!isActive) {
      console.log(`🚫 Produto ${product.name} filtrado (inativo)`);
    }
    return isActive;
  });
  
  // Verificar se hoje tem promoções especiais
  const hasSpecialToday = hasTodaySpecialPromotions(activeProducts);
  const isThursdayElite = isQuintaElite();
  
  // Validar programação de produtos (apenas em desenvolvimento)
  React.useEffect(() => {
    validateProductSchedules(activeProducts);
  }, [activeProducts]);
  
  // Função para filtrar produtos baseado na categoria selecionada
  const getFilteredProducts = () => {
    console.log('🔍 Filtrando produtos para categoria:', selectedCategory, 'no dia:', ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]);
    console.log('📊 Total de produtos ativos:', activeProducts.length);
    
    let baseProducts = activeProducts;
    
    // FILTRO CRÍTICO: Remover produtos programados que não estão disponíveis hoje
    baseProducts = activeProducts.filter(product => {
      const isAvailable = isProductAvailable(product);
      
      if (!isAvailable) {
        console.log(`🚫 Produto ${product.name} removido da lista (não disponível hoje)`);
      }
      
      return isAvailable;
    });
    
    console.log('📊 Produtos disponíveis hoje:', baseProducts.length);
    
    if (selectedCategory === 'today') {
      const promotions = getPromotionsOfTheDay(baseProducts);
      console.log(`🎯 Promoções do dia (${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]}) encontradas:`, promotions.length);
      
      if (promotions.length > 0) {
        console.log('📋 Lista de promoções:', promotions.map(p => ({ 
          name: p.name, 
          scheduledDays: p.scheduledDays,
          availability: p.availability,
          isAvailable: isProductAvailable(p),
          currentDay: new Date().getDay()
        })));
      }
      
      return promotions;
    } else if (selectedCategory === 'all') {
      return baseProducts;
    } else {
      return baseProducts.filter(product => product.category === selectedCategory);
    }
  };

  const filteredProducts = getFilteredProducts();
  const quintaEliteProducts = getQuintaEliteProducts(activeProducts);

  // Debug adicional
  console.log('📈 Estatísticas:', {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    filteredProducts: filteredProducts.length,
    selectedCategory,
    hasSpecialToday,
    isThursdayElite,
    currentDay: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]
  });

  // Categorias disponíveis (incluindo "Promoção do Dia" se houver)
  const availableCategories = [
    ...(hasSpecialToday ? [{ 
      id: 'today' as const, 
      label: isThursdayElite ? '⚡ QUINTA ELITE' : '🔥 Promoção do Dia',
      count: getPromotionsOfTheDay(activeProducts).length
    }] : []),
    { id: 'all' as const, label: 'Todos', count: activeProducts.length },
    { id: 'acai' as const, label: 'Açaí', count: activeProducts.filter(p => p.category === 'acai').length },
    { id: 'combo' as const, label: 'Combos', count: activeProducts.filter(p => p.category === 'combo').length },
    { id: 'milkshake' as const, label: 'Milkshakes', count: activeProducts.filter(p => p.category === 'milkshake').length },
    { id: 'vitamina' as const, label: 'Vitaminas', count: activeProducts.filter(p => p.category === 'vitamina').length },
    { id: 'sorvetes' as const, label: 'Sorvetes', count: activeProducts.filter(p => p.category === 'sorvetes').length },
    { id: 'bebidas' as const, label: 'Bebidas', count: activeProducts.filter(p => p.category === 'bebidas').length },
    { id: 'complementos' as const, label: 'Complementos', count: activeProducts.filter(p => p.category === 'complementos').length },
    { id: 'sobremesas' as const, label: 'Sobremesas', count: activeProducts.filter(p => p.category === 'sobremesas').length },
    { id: 'outros' as const, label: 'Outros', count: activeProducts.filter(p => p.category === 'outros').length }
  ];

  // Verificar se a loja está aberta
  const storeStatus = getStoreStatus();

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos do banco de dados...</p>
          <p className="text-gray-500 text-sm mt-2">Isso pode levar alguns segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Status da Loja */}
      <section className="py-4 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <StoreStatusBanner />
          <IARecommender 
            customerId={customerId} 
            onProductSelect={(productId) => {
              const product = products.find(p => p.id === productId);
              if (product) {
                setSelectedProduct(product);
              }
            }}
          />
        </div>
      </section>

      {/* Banner de Promoção do Dia */}
      {hasSpecialToday && selectedCategory === 'today' && (
        <section className={`py-8 text-white relative overflow-hidden ${
          isThursdayElite 
            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500' 
            : 'bg-gradient-to-r from-orange-500 to-red-500'
        }`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isThursdayElite ? (
                <>
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {getTodaySpecialMessage()}
                  </h2>
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                </>
              ) : (
                <>
                  <Star size={28} className="text-yellow-300" />
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {getTodaySpecialMessage()}
                  </h2>
                  <Star size={28} className="text-yellow-300" />
                </>
              )}
            </div>
            <p className={`text-lg mb-4 ${
              isThursdayElite ? 'text-yellow-100' : 'text-orange-100'
            }`}>
              {getTodaySpecialDescription()}
            </p>
            
            {isThursdayElite && quintaEliteProducts.length > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
                <p className="text-yellow-100 font-semibold">
                  🎯 {quintaEliteProducts.length} promoções especiais da Quinta Elite disponíveis!
                </p>
              </div>
            )}
          </div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full"></div>
          </div>
        </section>
      )}
      
      {/* Menu de Categorias */}
      <section className="py-8 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? category.id === 'today'
                      ? isThursdayElite
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.id === 'all' && <Filter size={16} />}
                {category.id === 'today' && (
                  isThursdayElite ? <Zap size={16} /> : <Star size={16} />
                )}
                {category.label}
                {category.id === 'today' && (
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                    {category.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Cardápio */}
      <section id="cardapio" className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {selectedCategory === 'today' 
                ? getTodaySpecialMessage()
                : selectedCategory === 'all' 
                  ? 'Nosso Cardápio' 
                  : availableCategories.find(cat => cat.id === selectedCategory)?.label || 'Produtos'
              }
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {selectedCategory === 'today'
                ? getTodaySpecialDescription()
                : 'Produtos frescos, sabores únicos e qualidade garantida. Escolha seu favorito e monte seu pedido!'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenModal={setSelectedProduct}
                disabled={!storeStatus.isOpen || !isProductAvailable(product)}
                isSpecialOfTheDay={selectedCategory === 'today'}
              />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
                {selectedCategory === 'today' ? (
                  <>
                    {isThursdayElite ? (
                      <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                    ) : (
                      <Star size={48} className="mx-auto text-gray-300 mb-4" />
                    )}
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      {isThursdayElite 
                        ? 'Nenhuma promoção Quinta Elite hoje'
                        : 'Nenhuma promoção especial hoje'
                      }
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {isThursdayElite
                        ? 'As promoções da Quinta Elite podem não estar configuradas ou ativas no momento.'
                        : 'Não há promoções programadas para hoje, mas temos muitas outras opções deliciosas!'
                      }
                    </p>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Ver Todos os Produtos
                    </button>
                  </>
                ) : (
                  <>
                    <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      Nenhum produto encontrado nesta categoria.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className={`py-16 ${
        hasSpecialToday && selectedCategory === 'today'
          ? isThursdayElite
            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-r from-orange-500 to-red-500'
          : 'bg-gradient-to-r from-purple-600 to-green-500'
      }`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para fazer seu pedido?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            {hasSpecialToday && selectedCategory === 'today'
              ? isThursdayElite
                ? 'Aproveite as promoções exclusivas da Quinta Elite e receba seu açaí fresquinho em casa!'
                : 'Aproveite as promoções especiais de hoje e receba seu açaí fresquinho em casa!'
              : 'Monte seu carrinho e receba seu açaí fresquinho em casa!'
            }
          </p>
          <button
            onClick={() => setIsCartOpen(true)}
            disabled={!storeStatus.isOpen}
            className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2 shadow-lg ${
              storeStatus.isOpen
                ? 'bg-white text-purple-600 hover:bg-gray-100'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={24} />
            {storeStatus.isOpen ? `Ver Carrinho (${getTotalItems()})` : 'Loja Fechada'}
          </button>
        </div>
      </section>
      
      <Footer storeSettings={storeSettings} />
      
      {/* Botão Carrinho Flutuante */}
      {getTotalItems() > 0 && storeStatus.isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative"
          >
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {getTotalItems()}
            </span>
          </button>
        </div>
      )}

      {/* Botão WhatsApp Flutuante */}
      <div className="fixed bottom-6 left-6 z-50">
        <a
          href="https://wa.me/5585989041010"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        >
          <MessageCircle size={24} />
        </a>
      </div>

      {/* Chatbot */}
      <AcaiChatbot />

      {/* Modais */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          disabled={!storeStatus.isOpen || !isProductAvailable(selectedProduct)}
        />
      )}

      <Cart
        items={items}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={getTotalPrice()}
        disabled={!storeStatus.isOpen}
      />
    </div>
  );
};

export default DeliveryPage;