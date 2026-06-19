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
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  MapPin,
  ClipboardList,
  Search,
} from 'lucide-react';
import { orderService, DetailedOrder } from '../services/orders';
import { paymentService } from '../services/payment';

interface OrderTrackingProps {
  currentUser: any;
  onNavigateHome: () => void;
  onSelectPaymentRetry: (orderId: string, amount: number) => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  currentUser,
  onNavigateHome,
  onSelectPaymentRetry,
}) => {
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<Record<string, any>>({});
  
  // Guest Lookup Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadProofsForList = async (list: DetailedOrder[]) => {
    try {
      const proofMap: Record<string, any> = {};
      await Promise.all(
        list.map(async (ord) => {
          const proof = await paymentService.getPaymentProofForOrder(ord.id);
          if (proof) {
            proofMap[ord.id] = proof;
          }
        })
      );
      setPaymentProofs((prev) => ({ ...prev, ...proofMap }));
    } catch (e) {
      console.error('Error batch fetching proof files for list', e);
    }
  };

  useEffect(() => {
    async function loadStudentOrders() {
      try {
        setLoading(true);
        // Load local orders placed in this browser session
        const localData = localStorage.getItem('jdh_local_orders');
        let localIds: string[] = [];
        if (localData) {
          try {
            localIds = JSON.parse(localData);
          } catch (e) {
            // ignore
          }
        }

        let list: DetailedOrder[] = [];

        // If there are local orders, fetch them!
        if (Array.isArray(localIds) && localIds.length > 0) {
          const fetchPromises = localIds.map(async (id) => {
            try {
              return await orderService.getOrderById(id);
            } catch (err) {
              return null;
            }
          });
          const fetched = await Promise.all(fetchPromises);
          list = fetched.filter((o): o is DetailedOrder => o !== null);
        }

        // If a logged-in user context is active (or dummy admin/student), combine them
        if (currentUser) {
          try {
            const userOrders = await orderService.getUserOrders();
            const combined = [...list, ...userOrders];
            const seen = new Set();
            list = combined.filter((ord) => {
              if (seen.has(ord.id)) return false;
              seen.add(ord.id);
              return true;
            });
          } catch (e) {
            console.error(e);
          }
        }

        setOrders(list);
        await loadProofsForList(list);
      } catch (err) {
        console.error('Error fetching student order history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentOrders();
  }, [currentUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    try {
      const results = await orderService.getOrdersByPhoneOrCode(searchQuery);
      if (results.length === 0) {
        setSearchError('No pre-orders found matching your search phone or code.');
      } else {
        setOrders(results);
        await loadProofsForList(results);
        if (results.length === 1) {
          setExpandedOrderId(results[0].id);
        }
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error occurred during receipt lookup.');
    } finally {
      setSearching(false);
    }
  };

  const handleReset = async () => {
    setSearchQuery('');
    setSearchError(null);
    setLoading(true);
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

      let list: DetailedOrder[] = [];

      if (Array.isArray(localIds) && localIds.length > 0) {
        const fetchPromises = localIds.map(async (id) => {
          try {
            return await orderService.getOrderById(id);
          } catch (err) {
            return null;
          }
        });
        const fetched = await Promise.all(fetchPromises);
        list = fetched.filter((o): o is DetailedOrder => o !== null);
      }
      setOrders(list);
      await loadProofsForList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return {
          label: 'Awaiting Bank Transfer',
          color: 'orange',
          desc: 'Waiting for you to transfer funds and upload your screenshot proof.',
          step: 0,
        };
      case 'payment_under_verification':
        return {
          label: 'Verifying Receipt',
          color: 'blue',
          desc: 'JDH Kitchen is checking bank reports to process your proof of payment.',
          step: 1,
        };
      case 'paid':
        return {
          label: 'Paid (Goal Campaign)',
          color: 'purple',
          desc: 'Payment confirmed! We are waiting for more students to group pre-order.',
          step: 2,
        };
      case 'confirmed':
        return {
          label: 'Chef Assembled',
          color: 'emerald',
          desc: 'Campaign succeeded! The kitchen team is cooking and prepping dispatches.',
          step: 3,
        };
      case 'delivered':
        return {
          label: 'Delivered at Gate',
          color: 'teal',
          desc: 'Hot food delivered! Check your hostel gate terminal or dispatch group calls.',
          step: 4,
        };
      default:
        return {
          label: 'Unknown Status',
          color: 'gray',
          desc: 'Your pre-order status is currently undergoing update processes.',
          step: 0,
        };
    }
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW="90%">
        {/* Navigation Breadcrumbs */}
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          _hover={{ bg: 'gray.100', color: 'black' }}
          onClick={onNavigateHome}
          borderRadius="xl"
          fontWeight="bold"
          mb={8}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Return to Home
        </Button>

        <VStack align="stretch" spaceY={8}>
          
          {/* Page Heading Card with Guest Search lookup bar */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" mb={2} shadow="sm">
            <Grid templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={6} alignSelf="stretch">
              <HStack spaceX={3.5}>
                <Box p={2.5} bg="#FFF8F0" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" flexShrink={0}>
                  <History size={20} color="#C65D3A" />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
                    Your Meal Receipts
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    Track cooking pool progress, verify bank receipts, and fetch digital gate vouchers. No signup required.
                  </Text>
                </VStack>
              </HStack>

              <VStack align="stretch" spaceY={2} justify="center">
                <form onSubmit={handleSearch}>
                  <HStack spaceX={2}>
                    <Input
                      placeholder="Enter Phone Number or Pickup Code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="xl"
                      bg="#FAFAF7"
                      size="sm"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      color="black"
                    />
                    <Button
                      type="submit"
                      loading={searching}
                      bg="#C65D3A"
                      color="white"
                      size="sm"
                      px={5}
                      borderRadius="xl"
                      fontWeight="bold"
                      _hover={{ bg: '#A94B2B' }}
                    >
                      Search
                    </Button>
                  </HStack>
                </form>
                {searchQuery && (
                  <Button size="xs" variant="link" color="gray.500" onClick={handleReset} alignSelf="flex-start">
                    Reset & Show Session Receipts
                  </Button>
                )}
                {searchError && (
                  <Text fontSize="10px" color="red.600" fontWeight="bold">
                    ⚠️ {searchError}
                  </Text>
                )}
              </VStack>
            </Grid>
          </Box>

          {loading ? (
            <Flex py={24} justify="center" align="center" direction="column" gap={3}>
              <ClipboardList size={32} color="gray" className="animate-bounce" />
              <Text fontSize="sm" color="gray.500">Querying your current pre-order ledger...</Text>
            </Flex>
          ) : orders.length === 0 ? (
            <Box bg="white" py={20} textAlign="center" borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              <ClipboardList size={40} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
              <Heading as="h3" size="md" mb={2}>No Receipts Preloaded</Heading>
              <Text color="gray.500" fontSize="xs" maxW="sm" mx="auto" mb={6}>
                You have not placed any pre-orders on this browser. Use the lookup search bar above with your **Phone Number** to pull previous orders!
              </Text>
              <Button onClick={onNavigateHome} bg="#C65D3A" color="white" _hover={{ bg: '#A94B2B' }} borderRadius="xl" size="md" fontWeight="bold">
                View Weekly Catalog Menu
              </Button>
            </Box>
          ) : (
            <VStack align="stretch" spaceY={6}>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const isExpanded = expandedOrderId === order.id;
                const proof = paymentProofs[order.id];
                const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Box
                    key={order.id}
                    bg="white"
                    borderRadius="3xl"
                    borderWidth="1px"
                    borderColor="gray.150"
                    shadow="sm"
                    overflow="hidden"
                  >
                    {/* Header Row */}
                    <Flex
                      p={6}
                      align="center"
                      justify="space-between"
                      bg="#FAFBF9"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      flexWrap="wrap"
                      gap={4}
                      cursor="pointer"
                      onClick={() => toggleExpandOrder(order.id)}
                    >
                      <VStack align="flex-start" spaceY={1}>
                        <HStack spaceX={2.5}>
                          <Text fontSize="xs" fontWeight="semibold" color="gray.500">GUEST PRE-ORDER REFERENCE</Text>
                          <Badge colorScheme={statusInfo.color} variant="subtle" px={2} py={0.1} borderRadius="md" fontSize="9px" fontWeight="black" color={`${statusInfo.color}.800`} bg={`${statusInfo.color}.50`}>
                            {statusInfo.label.toUpperCase()}
                          </Badge>
                        </HStack>
                        <Heading as="h4" size="sm" fontWeight="black" color="black" fontFamily="monospace">
                          #{order.id.split('-')[0]?.toUpperCase() || order.id.toUpperCase()} (Code: {order.pickup_code_direct || 'Pending'})
                        </Heading>
                        <Text fontSize="10px" color="gray.400">Placed: {orderDate} • Customer: {order.customer_name || (order.profiles as any)?.full_name || 'Guest'}</Text>
                      </VStack>

                      <HStack spaceX={6} flexWrap="wrap">
                        <VStack align="flex-start" spaceY={0}>
                          <Text fontSize="9px" color="gray.400" fontWeight="bold">FULFILLMENT TOTAL</Text>
                          <Text fontSize="md" fontWeight="extrabold" color="black">
                            ₦{order.total_amount.toLocaleString()}
                          </Text>
                        </VStack>

                        <Button
                          size="xs"
                          variant="ghost"
                          color="black"
                          _hover={{ bg: 'gray.100' }}
                          borderRadius="lg"
                          fontWeight="bold"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </Button>
                      </HStack>
                    </Flex>

                    {/* Progress Track & Details Body */}
                    <VStack align="stretch" p={6} spaceY={6}>
                      {/* Unified Stepper Progress Bar */}
                      <VStack spaceY={4} align="stretch" bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                        <Flex justify="space-between" align="baseline">
                          <Text fontSize="11px" fontWeight="bold" color="black">Fulfillment Tracking Status</Text>
                          <Text fontSize="10px" color="gray.500" italic>{statusInfo.desc}</Text>
                        </Flex>

                        {/* Visual Step Points */}
                        <Grid templateColumns="repeat(5, 1fr)" gap={2} position="relative" pt={2}>
                          {['Deposit Sent', 'Reviewing', 'Batch Success', 'Cooking Prep', 'Hostel Gate'].map((stepName, index) => {
                            const isPast = statusInfo.step >= index;
                            return (
                              <VStack key={index} spaceY={1.5} align="center">
                                <Box
                                  w="20px"
                                  h="20px"
                                  borderRadius="full"
                                  bg={isPast ? '#C65D3A' : 'gray.200'}
                                  display="flex"
                                  justifyContent="center"
                                  alignItems="center"
                                  color="white"
                                  fontSize="9px"
                                  fontWeight="bold"
                                >
                                  {isPast ? '✓' : index + 1}
                                </Box>
                                <Text fontSize="8.5px" fontWeight="bold" align="center" color={isPast ? 'black' : 'gray.400'}>
                                  {stepName}
                                </Text>
                              </VStack>
                            );
                          })}
                        </Grid>
                      </VStack>

                      {/* Display Rejections Form Tracing (Manual verification bounce handler) */}
                      {proof && proof.status === 'rejected' && (
                        <Box bg="red.50" color="red.700" p={5} borderRadius="2xl" borderStyle="dashed" borderWidth="1.5px" borderColor="red.300">
                          <VStack align="flex-start" spaceY={2.5}>
                            <HStack spaceX={2}>
                              <AlertTriangle size={15} color="#DC2626" />
                              <Text fontSize="xs" fontWeight="bold" color="red.800">
                                Manual Bank Receipt Audit - Bounced / Rejected
                              </Text>
                            </HStack>
                            <Text fontSize="11px" color="red.600" lineHeight="relaxed">
                              <strong>Reason for rejection:</strong> "{proof.rejection_reason || 'Screenshot clear check failed. Incorrect bank transaction trace matching.'}"
                            </Text>
                            <Button
                              size="xs"
                              bg="red.600"
                              _hover={{ bg: 'red.700' }}
                              color="white"
                              borderRadius="lg"
                              fontWeight="bold"
                              onClick={() => onSelectPaymentRetry(order.id, order.total_amount)}
                              px={5.5}
                              mt={1}
                            >
                              Re-upload Payment Proof Screenshot
                            </Button>
                          </VStack>
                        </Box>
                      )}

                      {/* Expanded Section Containing Meals Lists */}
                      {isExpanded && (
                        <VStack align="stretch" spaceY={4} pt={2} borderTopWidth="1px" borderColor="gray.100">
                          <Heading as="h5" size="xs" fontWeight="bold" color="black" pb={1} borderBottomWidth="1.5px" borderColor="gray.100">
                            Dishes in this Dispatch Pack:
                          </Heading>

                          <VStack align="stretch" spaceY={3}>
                            {order.items.map((item) => (
                              <Flex key={item.id} justify="space-between" align="center" fontSize="xs">
                                <HStack spaceX={3.5}>
                                  <Box w="36px" h="36px" borderRadius="lg" bg="gray.100" overflow="hidden" flexShrink={0}>
                                    <Box
                                      as="img"
                                      src={item.meal?.image_url || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100'}
                                      alt={item.meal?.name}
                                      w="full"
                                      h="full"
                                      objectFit="cover"
                                    />
                                  </Box>
                                  <VStack align="flex-start" spaceY={0}>
                                    <Text color="black" fontWeight="bold">{item.meal?.name}</Text>
                                    <Text fontSize="9px" color="gray.400">Qty: {item.quantity} Portion(s) × ₦{item.unit_price.toLocaleString()}</Text>
                                  </VStack>
                                </HStack>
                                <Text color="black" fontWeight="extrabold">₦{(item.quantity * item.unit_price).toLocaleString()}</Text>
                              </Flex>
                            ))}
                          </VStack>

                          {/* Order metadata tags */}
                          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4} p={3.5} bg="#FAFBF9" borderRadius="2xl" borderWidth="1.5px" borderColor="gray.100" fontSize="10.5px" color="gray.600" mt={2}>
                            <HStack spaceX={2}>
                              <MapPin size={13} color="gray" />
                              <Text><strong>Destination Hostel:</strong> {order.hostel_name}, {order.room_number}</Text>
                            </HStack>
                            {order.notes && (
                              <HStack spaceX={2} alignItems="flex-start">
                                <ClipboardList size={13} color="gray" style={{ marginTop: '2.5px' }} />
                                <Text lineClamp={2}><strong>Notes:</strong> {order.notes}</Text>
                              </HStack>
                            )}
                          </Grid>
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                );
              })}
            </VStack>
          )}

        </VStack>
      </Container>
    </Box>
  );
};
