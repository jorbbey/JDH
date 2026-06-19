/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
  Grid,
  Badge,
  Input,
} from '@chakra-ui/react';
import {
  Search,
  ChevronRight,
  Heart,
  ShoppingCart,
  TrendingUp,
  Flame,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import { menuService, MenuMealProgress } from '../services/menus';
import { mealService } from '../services/meals';

interface MenuListProps {
  currentUser: any;
  onSelectMeal: (meal: MenuMealProgress) => void;
  onAddToCart: (meal: MenuMealProgress) => void;
  cartCount: number;
  onViewCart: () => void;
  onNavigateHome: () => void;
}

export const MenuList: React.FC<MenuListProps> = ({
  currentUser,
  onSelectMeal,
  onAddToCart,
  cartCount,
  onViewCart,
  onNavigateHome,
}) => {
  const [meals, setMeals] = useState<MenuMealProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [weekRange, setWeekRange] = useState('');
  const [likedMeals, setLikedMeals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadActiveMenuMeals() {
      try {
        let activeMenu = await menuService.getActiveMenu();
        
        // If there is no active menu, try to grab any menu cycle as activeMenu
        if (!activeMenu) {
          try {
            const allMenus = await menuService.getAllMenus();
            if (allMenus && allMenus.length > 0) {
              activeMenu = allMenus.find((m) => m.status === 'active') || allMenus[0];
            }
          } catch (e) {
            console.warn('Could not locate any menu cycles:', e);
          }
        }

        let mealsProgress: MenuMealProgress[] = [];

        if (activeMenu) {
          // Format week range label
          const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
          const start = new Date(activeMenu.start_date).toLocaleDateString('en-US', options);
          const end = new Date(activeMenu.end_date).toLocaleDateString('en-US', options);
          setWeekRange(`Week of ${start} — ${end}`);

          mealsProgress = await menuService.getMenuMealsProgress(activeMenu.id);
        }

        // FALLBACK: If we still have zero dishes scheduled this week (or if activeMenu is null),
        // fallback to retrieving all meals from the global Universal catalog so students see them!
        if (mealsProgress.length === 0) {
          if (!activeMenu) {
            setWeekRange('Current Pre-Order Cycle');
          }
          const allCatalogMeals = await mealService.getAllMeals();
          mealsProgress = allCatalogMeals.map((m) => ({
            menu_meal_id: m.id, // Fallback to meal_id as menu_meal_id
            menu_id: activeMenu?.id || 'dynamic-menu',
            meal_id: m.id,
            meal_name: m.name,
            meal_category: m.category as any,
            unit_price: m.price,
            image_url: m.image_url,
            min_threshold: 40,
            total_ordered_quantity: 0,
            remaining_orders_needed: 40,
            is_threshold_met: false,
          }));
        }

        setMeals(mealsProgress);
      } catch (err) {
        console.error('Failure reloading active menu selections:', err);
      } finally {
        setLoading(false);
      }
    }
    loadActiveMenuMeals();
  }, []);

  const toggleLike = (mealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  const filteredMeals = meals.filter((meal) => {
    const matchesCategory =
      selectedCategory === 'all' || meal.meal_category === selectedCategory;
    const matchesSearch =
      (meal.meal_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meal.meal_category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW="90%">
        {/* Navigation Breadcrumbs & Cart Indicator */}
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <Button
            variant="ghost"
            size="sm"
            color="gray.600"
            _hover={{ bg: 'gray.100', color: 'black' }}
            onClick={onNavigateHome}
            borderRadius="xl"
            fontWeight="bold"
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Back to Home
          </Button>

          {cartCount > 0 && (
            <Button
              onClick={onViewCart}
              bg="#C65D3A"
              _hover={{ bg: '#A94B2B' }}
              color="white"
              size="md"
              borderRadius="full"
              fontWeight="bold"
              px={6}
              shadow="md"
            >
              <ShoppingCart size={16} style={{ marginRight: '8px' }} />
              View Cart ({cartCount})
            </Button>
          )}
        </Flex>

        {/* Weekly Header Card */}
        <Box bg="white" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150" mb={6} shadow="sm">
          <Grid templateColumns={{ base: '1fr', md: '1.2fr 0.8fr' }} gap={6} alignItems="center">
            <VStack align="flex-start" spaceY={2.5}>
              <Badge bg="#FFF8F0" color="#C65D3A" px={3} py={1} borderRadius="lg" fontSize="10px" fontWeight="bold">
                ACTIVE COOKING MENU
              </Badge>
              <Heading as="h1" size="2xl" fontWeight="black" color="black" letterSpacing="tight">
                JDH Kitchen Pre-Order Catalog
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {weekRange || 'Active Weekly Cycle'} • Fresh Nigerian recipes prepared by gathering collective student demand. Zero waste, street price, delivered warm.
              </Text>
            </VStack>

            <Box bg="#FAFAF7" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
              <VStack align="stretch" spaceY={2}>
                <HStack spaceX={2}>
                  <TrendingUp size={15} color="#C65D3A" />
                  <Text fontSize="xs" fontWeight="bold" color="black">Threshold Multi-Buyer Model</Text>
                </HStack>
                <Text fontSize="11px" color="gray.500" lineHeight="relaxed">
                  We prepare premium recipes in bulk only when student demand crosses <strong>40 orders</strong> per meal. Direct personal refund: your transfer is fully returned if the batch threshold fails.
                </Text>
              </VStack>
            </Box>
          </Grid>
        </Box>

        {/* Filters and Search Interface */}
        <Flex gap={4} p={4} bg="white" borderRadius="3xl" borderWidth="1px" borderColor="gray.150" mb={8} align="center" justify="space-between" flexWrap="wrap" shadow="sm">
          {/* Search Box */}
          <HStack spaceX={2.5} px={4} py={2} bg="#FAFAF7" borderRadius="2xl" borderWidth="1px" borderColor="gray.250" flex={{ base: '1fr', md: '0.4fr' }} minW="260px">
            <Search size={16} color="gray" />
            <Input
              placeholder="Search dishes (e.g. Jollof, Efo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              outline="none"
              p={0}
              fontSize="xs"
              height="auto"
              _focus={{ boxShadow: 'none' }}
              bg="transparent"
              w="full"
              color="black"
            />
          </HStack>

          {/* Quick Category Buttons */}
          <Flex gap={2} wrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }} flex="1">
            {[
              { id: 'all', label: 'All Dishes' },
              { id: 'soup', label: 'Traditional Soups' },
              { id: 'stew', label: 'Rich Stews' },
              { id: 'rice', label: 'Rice Specialties' },
              { id: 'other', label: 'Sides & Others' },
            ].map((cat) => (
              <Button
                key={cat.id}
                size="xs"
                variant={selectedCategory === cat.id ? 'solid' : 'ghost'}
                bg={selectedCategory === cat.id ? '#C65D3A' : 'transparent'}
                color={selectedCategory === cat.id ? 'white' : 'gray.500'}
                _hover={{ bg: selectedCategory === cat.id ? '#A94B2B' : '#FFF8F0' }}
                borderRadius="lg"
                fontWeight="bold"
                onClick={() => setSelectedCategory(cat.id)}
                px={3}
              >
                {cat.label}
              </Button>
            ))}
          </Flex>
        </Flex>

        {/* Catalog Grid View */}
        {loading ? (
          <Flex py={24} justify="center" align="center" direction="column" gap={4}>
            <ShoppingBag size={32} color="gray" className="animate-pulse" />
            <Text fontSize="sm" color="gray.500">Querying active co-op meal progress in real-time...</Text>
          </Flex>
        ) : filteredMeals.length === 0 ? (
          <Box bg="white" py={20} textAlign="center" borderRadius="3xl" borderWidth="1px" borderColor="gray.150">
            <ShoppingBag size={40} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
            <Heading as="h4" size="md" mb={2}>No Culinary Dishes Found</Heading>
            <Text color="gray.500" fontSize="xs" maxW="md" mx="auto">
              We couldn't locate any meals matching "{searchQuery}" under the current filter selection. Try removing search words.
            </Text>
          </Box>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={8}>
            {filteredMeals.map((meal) => {
              const orderPct = Math.min(
                100,
                Math.round(((meal.total_ordered_quantity || 0) / (meal.min_threshold || 40)) * 100)
              );
              const isMet = meal.is_threshold_met;

              return (
                <Box
                  key={meal.menu_meal_id}
                  bg="white"
                  borderRadius="3xl"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="gray.150"
                  shadow="sm"
                  transition="all 0.2s ease"
                  _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
                  cursor="pointer"
                  onClick={() => onSelectMeal(meal)}
                >
                  {/* Meal Photo Header */}
                  <Box h="220px" w="full" bg="gray.100" position="relative">
                    <Box
                      as="img"
                      src={
                        meal.image_url ||
                        'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600'
                      }
                      alt={meal.meal_name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                    <Box position="absolute" top={4} left={4}>
                      <Badge bg="white" color="black" fontWeight="bold" borderRadius="md" px={2.5} py={0.5} fontSize="9px">
                        {meal.meal_category.toUpperCase()}
                      </Badge>
                    </Box>
                    <Box position="absolute" top={4} right={4}>
                      <Button
                        size="xs"
                        bg="white"
                        _hover={{ bg: 'white' }}
                        onClick={(e) => toggleLike(meal.menu_meal_id, e)}
                        borderRadius="full"
                        boxSize="32px"
                        p={0}
                        color={likedMeals[meal.menu_meal_id] ? 'red.500' : 'gray.400'}
                      >
                        <Heart size={15} fill={likedMeals[meal.menu_meal_id] ? 'currentColor' : 'none'} />
                      </Button>
                    </Box>
                  </Box>

                  {/* Meal Body */}
                  <VStack align="stretch" p={5} spaceY={5}>
                    <VStack align="flex-start" spaceY={1.5}>
                      <Heading as="h3" size="md" fontWeight="bold" color="black" lineClamp={1}>
                        {meal.meal_name}
                      </Heading>
                      <Text fontSize="11.5px" color="gray.500" lineClamp={2} lineHeight="short">
                        {meal.unit_price > 4000 ? '⭐ Premium Recipe • ' : ''}Cooked fresh in heavy pots, using selected native ingredients.
                      </Text>
                    </VStack>

                    {/* Progress tracking threshold gauge */}
                    <VStack spaceY={2} align="stretch" bg="#FAFAF7" p={3.5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                      <Flex justify="space-between" fontSize="10px" fontWeight="bold">
                        <Text color="gray.500" display="flex" alignItems="center">
                          <Flame size={12} style={{ marginRight: '4px', color: '#EA580C' }} />
                          Co-Op Threshold Progress
                        </Text>
                        <Text color={isMet ? 'emerald.600' : 'orange.600'}>
                          {meal.total_ordered_quantity} / {meal.min_threshold} Ordered
                        </Text>
                      </Flex>

                      {/* Bar indicator gauge */}
                      <Box w="full" h="6px" bg="gray.100" borderRadius="full" overflow="hidden">
                        <Box
                          w={`${orderPct}%`}
                          h="full"
                          bg={isMet ? '#10B981' : '#EA580C'}
                          borderRadius="full"
                          transition="width 0.3s ease"
                        />
                      </Box>

                      <Flex justify="space-between" align="center" fontSize="9px" fontWeight="semibold">
                        {isMet ? (
                          <Text color="emerald.600">✓ Green-lit! Batch guaranteed to cook</Text>
                        ) : (
                          <Text color="orange.600">⏳ Needs {meal.remaining_orders_needed} more pre-orders</Text>
                        )}
                        <Text color="gray.400">{orderPct}% Met</Text>
                      </Flex>
                    </VStack>

                    {/* Footer Row */}
                    <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="gray.100">
                      <VStack align="flex-start" spaceY={0}>
                        <Text fontSize="9px" color="gray.400" fontWeight="bold" letterSpacing="wide">PRE-ORDER PRICE</Text>
                        <Text fontSize="md" fontWeight="extrabold" color="black">
                          ₦{meal.unit_price.toLocaleString()}
                        </Text>
                      </VStack>

                      <HStack spaceX={2}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMeal(meal);
                          }}
                          color="gray.600"
                          _hover={{ bg: 'gray.100' }}
                          borderRadius="lg"
                          fontWeight="bold"
                        >
                          Details
                        </Button>

                        <Button
                          size="sm"
                          bg="#C65D3A"
                          color="white"
                          _hover={{ bg: '#A94B2B' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(meal);
                          }}
                          borderRadius="xl"
                          px={4.5}
                          fontWeight="bold"
                        >
                          <ShoppingCart size={13} style={{ marginRight: '6px' }} />
                          Add Basket
                        </Button>
                      </HStack>
                    </Flex>
                  </VStack>
                </Box>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};
