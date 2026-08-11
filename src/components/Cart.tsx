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
  Input,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Trash2,
  MapPin,
  MessageSquare,
  AlertCircle,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import { orderService } from '../services/orders';

interface CartItem {
  menuMealId: string;
  mealName: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  category: string;
  notes: string;
}

interface CartProps {
  currentUser: any;
  cartItems: CartItem[];
  onRemoveItem: (menuMealId: string) => void;
  onUpdateQty: (menuMealId: string, quantity: number) => void;
  onBackToMenu: () => void;
  onCheckoutSuccess: (orderId: string, totalAmount: number) => void;
}

export const Cart: React.FC<CartProps> = ({
  currentUser,
  cartItems,
  onRemoveItem,
  onUpdateQty,
  onBackToMenu,
  onCheckoutSuccess,
}) => {
  // Auto-fill and auto-save customer contact info from local storage
  const [fullName, setFullName] = useState(() => {
    if (currentUser?.full_name) return currentUser.full_name;
    try {
      const saved = localStorage.getItem('jdh_saved_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) return parsed.fullName;
      }
    } catch (e) {}
    return '';
  });

  const [phone, setPhone] = useState(() => {
    if (currentUser?.phone) return currentUser.phone;
    try {
      const saved = localStorage.getItem('jdh_saved_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone) return parsed.phone;
      }
    } catch (e) {}
    return '';
  });

  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    try {
      const saved = localStorage.getItem('jdh_saved_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whatsappNumber) return parsed.whatsappNumber;
      }
    } catch (e) {}
    return '';
  });

  const [deliveryLocation, setDeliveryLocation] = useState('Front of school (for off-klites)');
  
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save info locally whenever user updates name, phone, or whatsapp
  const saveCustomerLocally = (nameVal: string, phoneVal: string, waVal: string) => {
    try {
      localStorage.setItem('jdh_saved_customer_info', JSON.stringify({
        fullName: nameVal,
        phone: phoneVal,
        whatsappNumber: waVal,
      }));
    } catch (e) {}
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = 0; // No individual delivery. All customers collect orders from central location.
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setCheckoutError(null);
    if (cartItems.length === 0) {
      setCheckoutError('Your culinary basket is currently empty. Add dishes first.');
      return;
    }
    if (!fullName.trim()) {
      setCheckoutError('Please provide your full name for manual transfer reconciliation.');
      return;
    }
    if (!phone.trim()) {
      setCheckoutError('A phone number is required for urgent chef pickup alerts.');
      return;
    }

    setIsSubmitting(true);
    saveCustomerLocally(fullName.trim(), phone.trim(), whatsappNumber.trim());
    try {
      // Map cartItems to OrderItemInput database format
      const itemsInput = cartItems.map((item) => ({
        menu_meal_id: item.menuMealId.split('__')[0], // strip unique cart suffix if any
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.notes || null,
      }));

      const order = await orderService.createOrder({
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_whatsapp: whatsappNumber.trim() || undefined,
        hostel_name: deliveryLocation,
        room_number: 'N/A',
        notes: `Details: ${cartItems.map((i) => i.notes).filter(Boolean).join('; ') || 'None'}`,
        items: itemsInput,
      });

      if (order) {
        // Track locally for lookups without student accounts
        try {
          const localData = localStorage.getItem('jdh_local_orders');
          let localIds: string[] = [];
          if (localData) {
            try {
              localIds = JSON.parse(localData);
            } catch (e) {
              // ignore
            }
          }
          if (!localIds.includes(order.id)) {
            localIds.push(order.id);
            localStorage.setItem('jdh_local_orders', JSON.stringify(localIds));
          }
        } catch (e) {
          console.error('Local order cache saving failed', e);
        }
        // Trigger success callback with newly assigned orderId and computed cost
        onCheckoutSuccess(order.id, total);
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'An unexpected server error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW={{ base: "100%", md: "95%", lg: "90%" }} px={{ base: 2.5, sm: 4, md: 6 }}>
        {/* Navigation Breadcrumb */}
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          _hover={{ bg: 'gray.100', color: 'black' }}
          onClick={onBackToMenu}
          borderRadius="xl"
          fontWeight="bold"
          mb={8}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Back to Food Menu
        </Button>

        {/* Stepper Header */}
        <Flex justify="space-between" align="center" mb={8} bg="white" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.150" shadow="sm" overflowX="auto">
          <HStack spaceX={3} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="#C65D3A" color="white" align="center" justify="center" fontWeight="black" fontSize="xs">
              1
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="black">Cart & Your Info</Text>
              <Text fontSize="9px" color="#C65D3A" fontWeight="bold">Current Step</Text>
            </VStack>
          </HStack>

          <Box h="1px" bg="gray.200" flex="1" mx={4} minW="30px" />

          <HStack spaceX={3} opacity={0.6} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="gray.200" color="gray.600" align="center" justify="center" fontWeight="bold" fontSize="xs">
              2
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700">Bank Transfer</Text>
              <Text fontSize="9px" color="gray.400">Next Step</Text>
            </VStack>
          </HStack>

          <Box h="1px" bg="gray.200" flex="1" mx={4} minW="30px" />

          <HStack spaceX={3} opacity={0.6} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="gray.200" color="gray.600" align="center" justify="center" fontWeight="bold" fontSize="xs">
              3
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700">Get Pickup Code</Text>
              <Text fontSize="9px" color="gray.400">Final Step</Text>
            </VStack>
          </HStack>
        </Flex>

        <Heading as="h1" size="xl" fontWeight="black" color="black" mb={8} letterSpacing="tight">
          Your Food Cart
        </Heading>

        {checkoutError && (
          <Box bg="red.50" color="red.700" p={4} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="red.300" fontSize="12px" fontWeight="bold" mb={6}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', marginTop: '-3px' }} />
            {checkoutError}
          </Box>
        )}

        {cartItems.length === 0 ? (
          <Box bg="white" p={12} textAlign="center" borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <ShoppingCart size={44} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
            <Heading as="h3" size="md" mb={2}>Your Cart is Empty</Heading>
            <Text color="gray.500" fontSize="xs" maxW="sm" mx="auto" mb={6}>
              You have not added any meals yet. Click below to see today's delicious menu!
            </Text>
            <Button onClick={onBackToMenu} bg="black" color="white" _hover={{ bg: 'gray.800' }} borderRadius="xl" size="md" fontWeight="bold" py={6} px={8}>
              See Food Menu
            </Button>
          </Box>
        ) : (
          <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={10}>
            {/* Left Items Column */}
            <VStack align="stretch" spaceY={6}>
              {cartItems.map((item) => (
                <Flex
                  key={item.menuMealId}
                  bg="white"
                  p={{ base: 4, sm: 5 }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.150"
                  shadow="sm"
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                  gap={4}
                >
                  <Flex direction={{ base: 'row', xs: 'row' }} gap={4.5} flex="1" align="center">
                    {/* Tiny Thumbnail */}
                    <Box w="80px" h="80px" borderRadius="xl" overflow="hidden" bg="gray.100" flexShrink={0}>
                      <Box
                        as="img"
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100'}
                        alt={item.mealName}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    </Box>
 
                    {/* Metadata */}
                    <VStack align="flex-start" spaceY={1} flex="1">
                      <Badge bg="#FAFBF9" color="black" borderWidth="1.5px" borderColor="gray.100" px={1.5} py={0.1} borderRadius="md" fontSize="8.5px" fontWeight="bold">
                        {item.category.toUpperCase()}
                      </Badge>
                      <Heading as="h4" size="sm" fontWeight="bold" color="black" lineClamp={2}>
                        {item.mealName}
                      </Heading>
                      <Text fontSize="md" fontWeight="black" color="black">
                        ₦{item.price.toLocaleString()}
                      </Text>
                      {item.notes && (
                        <Text fontSize="10px" color="gray.500" display="flex" alignItems="center">
                          <MessageSquare size={10} style={{ marginRight: '4px' }} />
                          Note: "{item.notes}"
                        </Text>
                      )}
                    </VStack>
                  </Flex>
 
                  {/* Quantity Actions & Remove */}
                  <Flex justify="space-between" align="center" gap={4} w={{ base: 'full', sm: 'auto' }} borderTopWidth={{ base: '1px', sm: '0px' }} borderColor="gray.100" pt={{ base: 3, sm: 0 }}>
                    <HStack spaceX={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="gray.200"
                        color="black"
                        onClick={() => onUpdateQty(item.menuMealId, item.quantity - 1)}
                        borderRadius="md"
                      >
                        -
                      </Button>
                      <Text fontSize="xs" fontWeight="black" color="black" minW="16px" align="center">
                        {item.quantity}
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="gray.200"
                        color="black"
                        onClick={() => onUpdateQty(item.menuMealId, item.quantity + 1)}
                        borderRadius="md"
                      >
                        +
                      </Button>
                    </HStack>
 
                    <Button
                      size="sm"
                      variant="ghost"
                      color="red.650"
                      _hover={{ bg: 'red.50' }}
                      onClick={() => onRemoveItem(item.menuMealId)}
                      borderRadius="xl"
                      boxSize="36px"
                      p={0}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </VStack>

            {/* Right Form & Checkout Summary Column */}
            <VStack align="stretch" spaceY={6}>
              {/* Checkout Contact Parameters */}
              <VStack align="stretch" spaceY={4.5} bg="white" p={6.5} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
                <HStack spaceX={2} pb={2} borderBottomWidth="1.5px" borderColor="gray.100">
                  <MapPin size={17} color="#C65D3A" />
                  <Heading as="h3" size="sm" fontWeight="bold" color="black">
                    Your Contact & Pickup Details
                  </Heading>
                </HStack>

                <VStack align="flex-start" spaceY={1}>
                  <Text fontSize="10.5px" fontWeight="bold" color="gray.500">Your Full Name *</Text>
                  <Input
                    placeholder="e.g Ebuka Adesina"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    bg="#FAFAF7"
                    borderColor="gray.250"
                    _focus={{ borderColor: 'black' }}
                    borderRadius="xl"
                    size="sm"
                    required
                    color="black"
                  />
                  <Text fontSize="9px" color="gray.500">Please write the same name on your bank account.</Text>
                </VStack>

                <VStack align="flex-start" spaceY={1}>
                  <Text fontSize="10.5px" fontWeight="bold" color="gray.500">Phone Number *</Text>
                  <Input
                    placeholder="e.g. 07038912407"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    bg="#FAFAF7"
                    borderColor="gray.250"
                    _focus={{ borderColor: 'black' }}
                    borderRadius="xl"
                    size="sm"
                    required
                    color="black"
                  />
                  <Text fontSize="9px" color="gray.500">Phone number we will call when your food is ready.</Text>
                </VStack>

                <VStack align="flex-start" spaceY={1}>
                  <Text fontSize="10.5px" fontWeight="bold" color="gray.500">WhatsApp Number (Optional)</Text>
                  <Input
                    placeholder="e.g. 07038912407"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    bg="#FAFAF7"
                    borderColor="gray.250"
                    _focus={{ borderColor: 'black' }}
                    borderRadius="xl"
                    size="sm"
                    color="black"
                  />
                  <Text fontSize="9px" color="gray.500">Only if different from your phone number above.</Text>
                </VStack>

                <VStack align="flex-start" spaceY={2.5}>
                  <Text fontSize="10.5px" fontWeight="bold" color="gray.500">Delivery Location *</Text>
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={3} w="full">
                    <Box
                      onClick={() => setDeliveryLocation('Front of school (for off-klites)')}
                      cursor="pointer"
                      p={3.5}
                      bg={deliveryLocation === 'Front of school (for off-klites)' ? '#FFF8F0' : '#FAFAF7'}
                      borderWidth="1.5px"
                      borderColor={deliveryLocation === 'Front of school (for off-klites)' ? '#C65D3A' : 'gray.200'}
                      borderRadius="2xl"
                      textAlign="center"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C65D3A' }}
                    >
                      <Text fontSize="xs" fontWeight="bold" color="black">Front of School</Text>
                      <Text fontSize="9px" color="gray.500" mt={0.5}>For off-klites</Text>
                    </Box>
                    <Box
                      onClick={() => setDeliveryLocation('Coke Villa (for hostelites)')}
                      cursor="pointer"
                      p={3.5}
                      bg={deliveryLocation === 'Coke Villa (for hostelites)' ? '#FFF8F0' : '#FAFAF7'}
                      borderWidth="1.5px"
                      borderColor={deliveryLocation === 'Coke Villa (for hostelites)' ? '#C65D3A' : 'gray.200'}
                      borderRadius="2xl"
                      textAlign="center"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C65D3A' }}
                    >
                      <Text fontSize="xs" fontWeight="bold" color="black">Coke Villa</Text>
                      <Text fontSize="9px" color="gray.500" mt={0.5}>For hostelites</Text>
                    </Box>
                    <Box
                      onClick={() => setDeliveryLocation('SICT gate (for those in school)')}
                      cursor="pointer"
                      p={3.5}
                      bg={deliveryLocation === 'SICT gate (for those in school)' ? '#FFF8F0' : '#FAFAF7'}
                      borderWidth="1.5px"
                      borderColor={deliveryLocation === 'SICT gate (for those in school)' ? '#C65D3A' : 'gray.200'}
                      borderRadius="2xl"
                      textAlign="center"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C65D3A' }}
                    >
                      <Text fontSize="xs" fontWeight="bold" color="black">SICT Gate</Text>
                      <Text fontSize="9px" color="gray.500" mt={0.5}>For those in school</Text>
                    </Box>
                  </Grid>
                </VStack>

                <Box bg="#FFF8F0" p={3.5} borderRadius="xl" borderWidth="1px" borderColor="#C65D3A" fontSize="10px" color="black" fontWeight="medium">
                  📌 <strong>Delivery Option:</strong> All orders are delivered directly to your selected point (<strong>Front of school</strong> for off-klites, <strong>Coke Villa</strong> for hostelites, or <strong>SICT gate</strong> for those in school).
                </Box>
              </VStack>

              {/* Bill Details Sidecard */}
              <VStack align="stretch" spaceY={4} bg="white" p={6.5} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
                <Heading as="h3" size="sm" fontWeight="bold" color="black" pb={2} borderBottomWidth="1.5px" borderColor="gray.100">
                  Order Summary
                </Heading>

                <VStack spaceY={2.5} align="stretch" fontSize="xs">
                  <Flex justify="space-between">
                    <Text color="gray.500">Food Subtotal</Text>
                    <Text color="black" fontWeight="semibold">₦{subtotal.toLocaleString()}</Text>
                  </Flex>
                  <Flex justify="space-between" pt={3} borderTopWidth="1px" borderStyle="dashed" borderColor="gray.200" fontSize="sm" fontWeight="bold">
                    <Text color="black">Total Amount to Pay</Text>
                    <Text color="#C65D3A" fontSize="lg" fontWeight="black">₦{total.toLocaleString()}</Text>
                  </Flex>
                </VStack>

                <VStack align="stretch" spaceY={2.5} pt={3}>
                  <Button
                    onClick={handleCheckout}
                    loading={isSubmitting}
                    bg="#C65D3A"
                    _hover={{ bg: '#A94B2B' }}
                    color="white"
                    size="lg"
                    borderRadius="2xl"
                    fontWeight="bold"
                    shadow="sm"
                    py={7}
                    px={10}
                  >
                    <CreditCard size={15} style={{ marginRight: '8px' }} />
                    Pay by Bank Transfer
                  </Button>
                  <Text fontSize="9px" color="gray.550" align="center" lineHeight="short">
                    Your money is safe. If a meal cannot be prepared, you will receive a full 100% refund immediately.
                  </Text>
                </VStack>
              </VStack>
            </VStack>
          </Grid>
        )}
      </Container>
    </Box>
  );
};
