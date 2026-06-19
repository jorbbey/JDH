/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Textarea,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { MenuMealProgress } from '../services/menus';

interface MealDetailProps {
  meal: MenuMealProgress;
  onBack: () => void;
  onAddToCart: (meal: MenuMealProgress, quantity: number, notes: string) => void;
  cartCount: number;
  onViewCart: () => void;
}

export const MealDetail: React.FC<MealDetailProps> = ({
  meal,
  onBack,
  onAddToCart,
  cartCount,
  onViewCart,
}) => {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const incrementQty = () => setQty((prev) => prev + 1);
  const decrementQty = () => setQty((prev) => (prev > 1 ? prev - 1 : 1));

  // Extrapolate allergens, nutrition values or description details elegantly
  const getDescription = () => {
    switch (meal.meal_category) {
      case 'soup':
        return 'Authentic, slow-simmered traditional soup prepared raw with rich palm oils, standard native spices, scent leaves, and choice cuts of meat or protein. Prepared in massive copper-base pots under strict health guidelines.';
      case 'stew':
        return 'Sun-ripened red plum tomato and bell-pepper base standard Nigerian stew, pre-crushed and fried in clean vegetable oil with local seasoning cubes. Delivered hot, ready to pair with standard starches or swallows.';
      case 'rice':
        return 'Smoky party jollof, fried rice, or ofada options. Steamed down in seasoned beef or chicken stock for beautiful flavor depth. Includes standard sweet carrots, green peas, or sweet corn accents.';
      default:
        return 'Homemade standard culinary recipe planned by chef, focused on maximum nourishment. Crafted inside our hygienic co-op headquarters specifically to satisfy campus cravings on a student-friendly budget.';
    }
  };

  const getAllergens = () => {
    switch (meal.meal_category) {
      case 'soup':
        return ['Seafood (crayfish/prawns)', 'Traces of red pepper'];
      case 'stew':
        return ['Tomato acidity', 'Traces of seasoning cubes'];
      default:
        return ['None recorded'];
    }
  };

  const getNutritionalInfo = () => {
    switch (meal.meal_category) {
      case 'soup':
        return { cal: '480 kcal', pro: '24g', fat: '18g', carb: '12g' };
      case 'stew':
        return { cal: '520 kcal', pro: '28g', fat: '22g', carb: '14g' };
      case 'rice':
        return { cal: '610 kcal', pro: '16g', fat: '12g', carb: '82g' };
      default:
        return { cal: '450 kcal', pro: '20g', fat: '14g', carb: '45g' };
    }
  };

  const macros = getNutritionalInfo();

  const handleAdd = () => {
    onAddToCart(meal, qty, notes);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 2800);
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW="90%">
        {/* Navigation Breadcrumb */}
        <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
          <Button
            variant="ghost"
            size="sm"
            color="gray.600"
            _hover={{ bg: 'gray.100', color: 'black' }}
            onClick={onBack}
            borderRadius="xl"
            fontWeight="bold"
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Return to Menu List
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
              View Basket ({cartCount})
            </Button>
          )}
        </Flex>

        {/* Detailed Layout */}
        <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap={12}>
          {/* Left Media & Metadata Column */}
          <Box>
            <Box h={{ base: '260px', md: '440px' }} w="full" bg="white" borderRadius="3xl" overflow="hidden" borderWidth="1px" borderColor="gray.150" shadow="sm" mb={8}>
              <Box
                as="img"
                src={
                  meal.image_url ||
                  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=1200'
                }
                alt={meal.meal_name}
                w="full"
                h="full"
                objectFit="cover"
              />
            </Box>

            {/* Description Tab & Cooking Transparency */}
            <VStack align="stretch" spaceY={6} bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              <VStack align="flex-start" spaceY={2.5}>
                <Heading as="h3" size="md" fontWeight="bold" color="black">
                  Chef Preparation Details
                </Heading>
                <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                  {getDescription()}
                </Text>
              </VStack>

              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={6} pt={4} borderTopWidth="1px" borderColor="gray.100">
                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="10px" fontWeight="bold" color="gray.400" letterSpacing="wide" textTransform="uppercase">
                    HEALTH & DIETARY ALLERGENS
                  </Text>
                  <HStack spaceX={1.5} flexWrap="wrap" gap={1}>
                    {getAllergens().map((allergen, idx) => (
                      <Badge key={idx} bg="red.50" color="red.700" px={2} py={0.5} borderRadius="md" fontSize="9px">
                        {allergen}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>

                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="10px" fontWeight="bold" color="gray.400" letterSpacing="wide" textTransform="uppercase">
                    PREPARATION STANDARD
                  </Text>
                  <HStack spaceX={1.5} color="emerald.600" fontSize="11px" fontWeight="bold">
                    <ShieldCheck size={14} />
                    <Text>Safe NAFDAC/HACCP Standard</Text>
                  </HStack>
                </VStack>
              </Grid>
            </VStack>
          </Box>

          {/* Right Ordering Configuration Panel */}
          <Box>
            <VStack align="stretch" spaceY={6} bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              {/* Heading Parameters */}
              <VStack align="flex-start" spaceY={2}>
                <Badge bg="#FFF8F0" color="#C65D3A" px={2.5} py={0.5} borderRadius="md" fontSize="9px" fontWeight="extrabold">
                  {meal.meal_category?.toUpperCase()} SELECTION
                </Badge>
                <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
                  {meal.meal_name}
                </Heading>
                <HStack spaceX={2}>
                  <Clock size={13} color="gray" />
                  <Text fontSize="11px" color="gray.500">Preparation & Cooking cycles start on Fridays</Text>
                </HStack>
              </VStack>

              {/* Price Row */}
              <Flex justify="space-between" align="center" py={4} borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="bold" color="gray.600">Calculated Portion Value</Text>
                <Text fontSize="2xl" fontWeight="black" color="black">
                  ₦{meal.unit_price.toLocaleString()}
                </Text>
              </Flex>

              {/* Nutritional Macro Tags */}
              <VStack align="stretch" spaceY={2.5}>
                <Text fontSize="10px" fontWeight="bold" color="gray.400" letterSpacing="wide" textTransform="uppercase">
                  ESTIMATED MACROS PER PORTION
                </Text>
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }} gap={2}>
                  {[
                    { label: 'CALORIES', val: macros.cal },
                    { label: 'PROTEIN', val: macros.pro },
                    { label: 'FAT VALUE', val: macros.fat },
                    { label: 'CARBS', val: macros.carb },
                  ].map((macro, idx) => (
                    <Box key={idx} bg="#FAFAF7" p={2.5} borderRadius="xl" borderWidth="1px" borderColor="gray.250" align="center">
                      <Text fontSize="9px" color="gray.400" fontWeight="bold">{macro.label}</Text>
                      <Text fontSize="xs" color="black" fontWeight="bold" mt={0.5}>{macro.val}</Text>
                    </Box>
                  ))}
                </Grid>
              </VStack>

              {/* Progressive Co-Op Pooling Info Module */}
              <VStack align="stretch" spaceY={3} bg="#E9EFF6/50" p={4.5} borderRadius="2xl" borderWidth="1px" borderColor="blue.100">
                <HStack spaceX={2}>
                  <TrendingUp size={15} color="#2563EB" />
                  <Text fontSize="xs" fontWeight="bold" color="blue.800">Cooperative Campaign Details</Text>
                </HStack>
                <Text fontSize="11px" color="gray.600" lineHeight="relaxed">
                  There are currently <strong>{meal.total_ordered_quantity} student orders</strong> placed in the pool. We need a minimum of <strong>{meal.min_threshold}</strong> to cook.
                </Text>
                {meal.is_threshold_met ? (
                  <Badge bg="green.50" color="green.700" w="fit-content" borderRadius="md" py={0.5} px={2} fontSize="9px" fontWeight="bold">
                    ✓ Threshold Met (Guaranteed Cook!)
                  </Badge>
                ) : (
                  <Badge bg="orange.50" color="orange.700" w="fit-content" borderRadius="md" py={0.5} px={2} fontSize="9px" fontWeight="bold">
                    ⏳ Needs {meal.remaining_orders_needed} more units to activate
                  </Badge>
                )}
              </VStack>

              {/* Quantity Selecting Interface */}
              <VStack align="flex-start" spaceY={2} pt={2}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Select Purchase Portions</Text>
                <HStack spaceX={3}>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    color="black"
                    _hover={{ bg: 'gray.50' }}
                    borderRadius="xl"
                    onClick={decrementQty}
                    fontWeight="bold"
                    px={3}
                  >
                    -
                  </Button>
                  <Text fontSize="md" fontWeight="black" color="black" minW="28px" align="center">
                    {qty}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    color="black"
                    _hover={{ bg: 'gray.50' }}
                    borderRadius="xl"
                    onClick={incrementQty}
                    fontWeight="bold"
                    px={3}
                  >
                    +
                  </Button>
                </HStack>
              </VStack>

              {/* Special Pre-order Chef Notes */}
              <VStack align="flex-start" spaceY={2}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Special Cooking Details (Optional)</Text>
                <Textarea
                  placeholder="e.g. Please wrap swallow in plastic bag, extra hot pepper stew separately..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  bg="#FAFAF7"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'black', boxShadow: 'none' }}
                  borderRadius="2xl"
                  fontSize="xs"
                  p={3.5}
                  color="black"
                  rows={2}
                />
              </VStack>

              {/* Cart Adding Trigger Buttons */}
              <VStack align="stretch" spaceY={2.5} pt={2}>
                <Button
                  bg="#C65D3A"
                  color="white"
                  _hover={{ bg: '#A94B2B' }}
                  size="lg"
                  borderRadius="2xl"
                  onClick={handleAdd}
                  fontWeight="bold"
                >
                  <ShoppingCart size={16} style={{ marginRight: '8px' }} />
                  Add to Pre-Order Basket (₦{(meal.unit_price * qty).toLocaleString()})
                </Button>

                {successMsg && (
                  <Flex align="center" gap={2} bg="green.50" color="green.700" p={2.5} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="green.300" fontSize="11px" fontWeight="bold">
                    <CheckCircle size={14} />
                    Added successfully! Click "View Basket" above to finalize checkout.
                  </Flex>
                )}
              </VStack>
            </VStack>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};
