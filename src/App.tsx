/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ChakraProvider, defaultSystem, Box, Flex, Button, Heading, Text, Container, HStack, VStack } from '@chakra-ui/react';
import { Utensils, ShoppingBasket, Menu, X } from 'lucide-react';
import jdhLogo from './assets/JDH_logo-trans.png';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { MenuList } from './components/MenuList';
import { MealDetail } from './components/MealDetail';
import { Cart } from './components/Cart';
import { ConfirmPayment } from './components/ConfirmPayment';
import { OrderConfirmation } from './components/OrderConfirmation';
import { OrderTracking } from './components/OrderTracking';
import { CateringBooking } from './components/CateringBooking';
import { authService } from './services/auth';
import type { MenuMealProgress } from './services/menus';
import { CustomizeModal } from './components/CustomizeModal';
import { ContactUs } from './components/ContactUs';
import { AdminLogin } from './components/AdminLogin';

export type ViewType =
  | 'landing'
  | 'menu-list'
  | 'meal-detail'
  | 'cart'
  | 'confirm-payment'
  | 'order-confirmation'
  | 'order-tracking'
  | 'admin-dashboard'
  | 'catering'
  | 'admin-login'
  | 'contact';

export interface CartItem {
  menuMealId: string;
  mealName: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  category: string;
  notes: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // E-commerce basket global states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MenuMealProgress | null>(null);
  const [activeCheckoutOrderId, setActiveCheckoutOrderId] = useState<string>('');
  const [activeCheckoutAmount, setActiveCheckoutAmount] = useState<number>(0);

  // Customizer option state parameters
  const [customizingMeal, setCustomizingMeal] = useState<MenuMealProgress | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [customizePreNotes, setCustomizePreNotes] = useState('');
  const [customizeInitialQty, setCustomizeInitialQty] = useState(1);

  // Retrieve student profile on boot
  useEffect(() => {
    async function loadProfile() {
      try {
        // First check if there is an offline admin session saved
        const savedAdmin = localStorage.getItem('jdh_admin_session');
        if (savedAdmin) {
          try {
            const parsedAdmin = JSON.parse(savedAdmin);
            setCurrentUser(parsedAdmin);
            setCurrentView('admin-dashboard');
            setLoadingProfile(false);
            return;
          } catch (e) {
            console.error('Failed to parse saved admin session:', e);
          }
        }

        const profile = await authService.getCurrentProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();

    // Router check for Admin Login deep links
    const path = window.location.pathname;
    if (path === '/admin/login' || path.includes('/admin/login') || path === '/admin/dashboard' || path.includes('/admin/dashboard')) {
      // If we already have a saved admin, stay in admin-dashboard, else go to admin-login
      const savedAdmin = localStorage.getItem('jdh_admin_session');
      if (savedAdmin) {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('admin-login');
      }
    }
  }, []);

  // Sync basket count or pre-populate if necessary
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenCustomizeModal = (meal: MenuMealProgress, notes: string = '', qty: number = 1) => {
    setCustomizingMeal(meal);
    setCustomizePreNotes(notes);
    setCustomizeInitialQty(qty);
    setIsCustomizeModalOpen(true);
  };

  const handleConfirmCustomize = (
    meal: MenuMealProgress,
    quantity: number,
    selectedExtras: any[],
    customPortionPrice: number
  ) => {
    const extrasStr = selectedExtras.map((e) => e.name).join(', ');
    const finalNotes = [
      extrasStr ? `Extras: ${extrasStr}` : '',
      customizePreNotes ? `Notes: ${customizePreNotes}` : '',
    ].filter(Boolean).join(' | ');

    setCart((prev) => {
      // Look for identical item with same basic menuMealId AND same exact visual extras/notes
      const existsIdx = prev.findIndex(
        (i) => i.menuMealId.split('__')[0] === meal.menu_meal_id && i.notes === finalNotes
      );
      if (existsIdx !== -1) {
        const copy = [...prev];
        copy[existsIdx].quantity += quantity;
        return copy;
      } else {
        const uniqueCartId = `${meal.menu_meal_id}__${Math.random().toString(36).substring(7)}`;
        return [
          ...prev,
          {
            menuMealId: uniqueCartId,
            mealName: meal.meal_name!,
            price: customPortionPrice,
            quantity: quantity,
            imageUrl: meal.image_url,
            category: meal.meal_category!,
            notes: finalNotes,
          },
        ];
      }
    });
  };

  const handleRemoveCartItem = (menuMealId: string) => {
    setCart((prev) => prev.filter((i) => i.menuMealId !== menuMealId));
  };

  const handleUpdateCartQty = (menuMealId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(menuMealId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.menuMealId === menuMealId ? { ...item, quantity } : item))
    );
  };

  const handleCheckoutSuccess = (orderId: string, totalAmount: number) => {
    // Lock details for manual proof payment desk
    setActiveCheckoutOrderId(orderId);
    setActiveCheckoutAmount(totalAmount);
    // Erase temporary local cart memory
    setCart([]);
    setCurrentView('confirm-payment');
  };

  const handlePaymentProofSubmitted = () => {
    setCurrentView('order-confirmation');
  };

  const handlePaymentRetrySelected = (orderId: string, amount: number) => {
    setActiveCheckoutOrderId(orderId);
    setActiveCheckoutAmount(amount);
    setCurrentView('confirm-payment');
  };

  const handleLogOutGlobal = async () => {
    try {
      localStorage.removeItem('jdh_admin_session');
      await authService.signOut();
      setCurrentUser(null);
      setCurrentView('landing');
    } catch (err) {
      console.error('Error signing out globally:', err);
    }
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <Box minH="100vh" bg="#FAFAF7" color="#2D2D2D" fontFamily="Inter, sans-serif">
        
        {/* Modern Sticky Brand Navigation Bar */}
        <Box bg="white" borderBottomWidth="1px" borderColor="gray.150" py={3} px={4} position="sticky" top={0} zIndex={100} shadow="sm">
          <Container maxW="100%" px={{ base: 2, md: 8 }}>
            <Flex justify="space-between" align="center" gap={3}>
              
              {/* Brand Logo and Title */}
              <Flex
                align="center"
                spaceX={3}
                cursor="pointer"
                onClick={() => {
                  setCurrentView('landing');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Box h="50px" display="flex" alignItems="center" overflow="hidden">
                  <Box
                    as="img"
                    src={jdhLogo}
                    alt="JDH Kitchen Logo"
                    h="full"
                    w="auto"
                    objectFit="contain"
                  />
                </Box>
                <Heading as="h2" size="sm" fontWeight="black" letterSpacing="tight" color="#2D2D2D">
                  JDH KITCHEN
                </Heading>
              </Flex>

              {/* Desktop Menu - Visible only on LG screens and larger */}
              <Flex align="center" gap={{ base: 2, xl: 4 }} display={{ base: 'none', lg: 'flex' }}>
                <Button
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.100', color: 'black' }}
                  size="sm"
                  onClick={() => setCurrentView('landing')}
                  fontWeight="bold"
                  borderRadius="lg"
                >
                  Home
                </Button>

                <Button
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.100', color: 'black' }}
                  size="sm"
                  onClick={() => setCurrentView('menu-list')}
                  fontWeight="bold"
                  borderRadius="lg"
                >
                  Weekly Menu
                </Button>

                <Button
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.100', color: 'black' }}
                  size="sm"
                  onClick={() => setCurrentView('catering')}
                  fontWeight="bold"
                  borderRadius="lg"
                >
                  Special Orders
                </Button>

                <Button
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.100', color: 'black' }}
                  size="sm"
                  onClick={() => setCurrentView('order-tracking')}
                  fontWeight="bold"
                  borderRadius="lg"
                >
                  Track Orders
                </Button>

                <Button
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.100', color: 'black' }}
                  size="sm"
                  onClick={() => setCurrentView('contact')}
                  fontWeight="bold"
                  borderRadius="lg"
                >
                  Contact
                </Button>

                {/* Micro global dynamic shopping cart count badge */}
                {cartCount > 0 && (
                  <Button
                    size="sm"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    onClick={() => setCurrentView('cart')}
                    fontWeight="bold"
                    borderRadius="full"
                    px={4}
                    shadow="sm"
                  >
                    <ShoppingBasket size={14} style={{ marginRight: '6.5px' }} />
                    Basket ({cartCount})
                  </Button>
                )}

                {currentUser && currentUser.role === 'admin' && (
                  <Button
                    bg="red.600"
                    color="white"
                    _hover={{ bg: 'red.700' }}
                    size="sm"
                    onClick={() => setCurrentView('admin-dashboard')}
                    fontWeight="bold"
                    borderRadius="lg"
                  >
                    Admin panel
                  </Button>
                )}

                {/* Dynamic User Login / Registration Controls */}
                {currentUser ? (
                  <Flex align="center" gap={{ base: 1, md: 2 }}>
                    <Box px={3} py={1.5} bg="gray.100" borderRadius="xl" maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      <Text fontSize="xs" fontWeight="extrabold" color="black">
                        👤 {currentUser.full_name?.split(' ')[0] || 'Admin'}
                      </Text>
                    </Box>
                    <Button
                      variant="ghost"
                      color="red.600"
                      _hover={{ bg: 'red.50' }}
                      size="sm"
                      onClick={handleLogOutGlobal}
                      fontWeight="bold"
                      borderRadius="lg"
                    >
                      Sign Out
                    </Button>
                  </Flex>
                ) : null}
              </Flex>

              {/* Mobile Right Container - Basket + Hamburger toggle */}
              <Flex align="center" gap={2} display={{ base: 'flex', lg: 'none' }}>
                {/* Always-accessible Basket Badge for smaller screens */}
                {cartCount > 0 && (
                  <Button
                    size="xs"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    onClick={() => {
                      setCurrentView('cart');
                      setIsMobileMenuOpen(false);
                    }}
                    fontWeight="bold"
                    borderRadius="full"
                    px={3}
                    py={1}
                    height="32px"
                    shadow="sm"
                  >
                    <ShoppingBasket size={12} style={{ marginRight: '4px' }} />
                    Basket ({cartCount})
                  </Button>
                )}

                {/* Mobile Menu Hamburg Toggle Icon */}
                <Button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  size="sm"
                  variant="ghost"
                  p={2}
                  _hover={{ bg: 'gray.100' }}
                  borderRadius="lg"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </Flex>
            </Flex>

            {/* Collapsible Mobile Dropdown Navigation */}
            {isMobileMenuOpen && (
              <Box
                mt={3}
                py={3}
                borderTopWidth="1px"
                borderColor="gray.100"
                display={{ base: 'block', lg: 'none' }}
              >
                <VStack align="stretch" spaceY={2}>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.600"
                    size="sm"
                    fontWeight="bold"
                    onClick={() => {
                      setCurrentView('landing');
                      setIsMobileMenuOpen(false);
                    }}
                    w="full"
                  >
                    Home
                  </Button>

                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.600"
                    size="sm"
                    fontWeight="bold"
                    onClick={() => {
                      setCurrentView('menu-list');
                      setIsMobileMenuOpen(false);
                    }}
                    w="full"
                  >
                    Weekly Menu
                  </Button>

                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.600"
                    size="sm"
                    fontWeight="bold"
                    onClick={() => {
                      setCurrentView('catering');
                      setIsMobileMenuOpen(false);
                    }}
                    w="full"
                  >
                    Special Orders
                  </Button>

                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.600"
                    size="sm"
                    fontWeight="bold"
                    onClick={() => {
                      setCurrentView('order-tracking');
                      setIsMobileMenuOpen(false);
                    }}
                    w="full"
                  >
                    Track Orders
                  </Button>

                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.600"
                    size="sm"
                    fontWeight="bold"
                    onClick={() => {
                      setCurrentView('contact');
                      setIsMobileMenuOpen(false);
                    }}
                    w="full"
                  >
                    Contact
                  </Button>

                  {currentUser && currentUser.role === 'admin' && (
                    <Button
                      bg="red.650"
                      color="white"
                      _hover={{ bg: 'red.700' }}
                      size="sm"
                      fontWeight="bold"
                      onClick={() => {
                        setCurrentView('admin-dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                      w="full"
                      justifyContent="flex-start"
                    >
                      Admin Panel
                    </Button>
                  )}

                  {currentUser && (
                    <Flex align="center" gap={2} p={2} bg="gray.50" borderRadius="xl">
                      <Box flex="1" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        <Text fontSize="xs" fontWeight="extrabold" color="black">
                          👤 {currentUser.full_name || 'Admin'}
                        </Text>
                      </Box>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="red.600"
                        _hover={{ bg: 'red.100' }}
                        onClick={() => {
                          handleLogOutGlobal();
                          setIsMobileMenuOpen(false);
                        }}
                        fontWeight="bold"
                      >
                        Sign Out
                      </Button>
                    </Flex>
                  )}
                </VStack>
              </Box>
            )}
          </Container>
        </Box>

        {/* Modular View Router */}
        <Box>
          {currentView === 'landing' && (
            <LandingPage
              onViewMenu={() => setCurrentView('menu-list')}
              onViewTracking={() => setCurrentView('order-tracking')}
              onViewCatering={() => setCurrentView('catering')}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          )}

          {currentView === 'menu-list' && (
            <MenuList
              currentUser={currentUser}
              onSelectMeal={(meal) => {
                setSelectedMeal(meal);
                setCurrentView('meal-detail');
              }}
              onAddToCart={(meal) => handleOpenCustomizeModal(meal, '', 1)}
              cartCount={cartCount}
              onViewCart={() => setCurrentView('cart')}
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'meal-detail' && selectedMeal && (
            <MealDetail
              meal={selectedMeal}
              onBack={() => setCurrentView('menu-list')}
              onAddToCart={(meal, qty, notes) => handleOpenCustomizeModal(meal, notes, qty)}
              cartCount={cartCount}
              onViewCart={() => setCurrentView('cart')}
            />
          )}

          {currentView === 'cart' && (
            <Cart
              currentUser={currentUser}
              cartItems={cart}
              onRemoveItem={handleRemoveCartItem}
              onUpdateQty={handleUpdateCartQty}
              onBackToMenu={() => setCurrentView('menu-list')}
              onCheckoutSuccess={handleCheckoutSuccess}
            />
          )}

          {currentView === 'confirm-payment' && activeCheckoutOrderId && (
            <ConfirmPayment
              orderId={activeCheckoutOrderId}
              totalAmount={activeCheckoutAmount}
              onSuccess={handlePaymentProofSubmitted}
              onCancel={() => setCurrentView('cart')}
            />
          )}

          {currentView === 'order-confirmation' && (
            <OrderConfirmation
              orderId={activeCheckoutOrderId}
              totalAmount={activeCheckoutAmount}
              onNavigateTracking={() => setCurrentView('order-tracking')}
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'order-tracking' && (
            <OrderTracking
              currentUser={currentUser}
              onNavigateHome={() => setCurrentView('landing')}
              onSelectPaymentRetry={handlePaymentRetrySelected}
            />
          )}

          {currentView === 'catering' && (
            <CateringBooking
              currentUser={currentUser}
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'contact' && (
            <ContactUs
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'admin-login' && (
            <AdminLogin
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setCurrentView('admin-dashboard');
              }}
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'admin-dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onNavigateHome={() => setCurrentView('landing')}
            />
          )}
        </Box>
      </Box>

      {/* Global proteins and extras customizer options dialog overlay */}
      <CustomizeModal
        meal={customizingMeal}
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        onConfirm={handleConfirmCustomize}
        initialQuantity={customizeInitialQty}
      />
    </ChakraProvider>
  );
}
