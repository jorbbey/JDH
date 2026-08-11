import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Grid,
  Flex,
  Button,
  Input,
  Badge,
} from '@chakra-ui/react';
import {
  HelpCircle,
  ShoppingBag,
  CreditCard,
  Truck,
  PhoneCall,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Utensils,
  ShieldCheck,
  MapPin,
  Calendar,
} from 'lucide-react';

interface HelpFAQProps {
  onNavigateMenu: () => void;
  onNavigateTracking: () => void;
  onNavigateContact: () => void;
  onNavigateCatering: () => void;
}

interface FAQItem {
  id: string;
  category: 'ordering' | 'payment' | 'pickup' | 'catering';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  // Ordering
  {
    id: 'faq-1',
    category: 'ordering',
    question: 'How do I place an order for food?',
    answer:
      'Ordering is super simple! 1. Go to the "Food Menu" page. 2. Tap on any meal you like and choose your portion size, swallow type, or extra meat/fish. 3. Click "Add to Cart". 4. Open your cart, type your name, phone number, and pickup spot. 5. Click "Pay by Bank Transfer" to submit your order.',
  },
  {
    id: 'faq-2',
    category: 'ordering',
    question: 'Do I need to register or create an account to buy food?',
    answer:
      'No! You do not need any password or account registration. Anyone can order immediately using just their name and phone number.',
  },
  {
    id: 'faq-3',
    category: 'ordering',
    question: 'Can I customize my food (e.g., extra meat, no pepper, different swallow)?',
    answer:
      'Yes! When you click on a meal, a pop-up window opens where you can select extra meat, extra fish, plantain, fried egg, swallow types (Eba, Semo, Amala, Pounded Yam), and write special notes like "No pepper" or "Extra stew".',
  },
  {
    id: 'faq-4',
    category: 'ordering',
    question: 'How do I know if my order was received?',
    answer:
      'As soon as you complete checkout, you will receive an ORDER CODE (e.g., #ORD-123456) and a PICKUP CODE on your screen. You can screenshot these codes or use your phone number to check your order anytime on the "Track My Order" page.',
  },

  // Payment
  {
    id: 'faq-5',
    category: 'payment',
    question: 'How do I pay for my food order?',
    answer:
      'We accept direct bank transfers! On the payment page, you will see our official bank details (Bank: OPay, Account Number: 6100712673, Name: JDH World Best Foods). Simply copy the account number, send the exact amount from your mobile bank app (OPay, PalmPay, GTBank, Kuda, FirstBank, USSD, etc.), and paste your Order Code in the transfer message.',
  },
  {
    id: 'faq-6',
    category: 'payment',
    question: 'What if I forget to upload my bank transfer screenshot?',
    answer:
      'No problem! On the payment page, you can choose "Option B" and simply type the sender name written on your bank account (e.g., John Doe). Our team will verify the transfer in our bank logs automatically.',
  },
  {
    id: 'faq-7',
    category: 'payment',
    question: 'Is my money safe if a meal cannot be prepared?',
    answer:
      'Yes, 100%! If a meal is canceled or unavailable for any reason, you receive a full 100% money-back refund directly to your bank account immediately.',
  },

  // Pickup & Delivery
  {
    id: 'faq-8',
    category: 'pickup',
    question: 'Where do I collect my food when it is ready?',
    answer:
      'We deliver to designated campus spots such as Front of School, Coke Villa, SICT Gate, and Hostel Blocks. When ordering, you pick the location closest to you. Your food will be brought directly there warm and fresh.',
  },
  {
    id: 'faq-9',
    category: 'pickup',
    question: 'What do I show the delivery rider to get my food?',
    answer:
      'Simply show your Pickup Code or Order Code on your phone screen, or mention your phone number. The delivery person will hand over your meal immediately.',
  },
  {
    id: 'faq-10',
    category: 'pickup',
    question: 'How do I track when my food is ready for pickup?',
    answer:
      'Click "Track My Order" in the top menu. Enter your Order Code or Phone Number. You will see real-time status updates: "Payment Checking", "Preparing Food", "Ready for Pickup", or "Delivered".',
  },

  // Catering
  {
    id: 'faq-11',
    category: 'catering',
    question: 'How do I book catering for a party, meeting, or event?',
    answer:
      'Click "Book Catering" or "Special Orders" in the top menu bar. Fill out the quick form specifying your event date, number of guests, and food requested. Our team will contact you on WhatsApp or call you directly to confirm menus and prices.',
  },
  {
    id: 'faq-12',
    category: 'catering',
    question: 'How far in advance should I book catering?',
    answer:
      'We recommend booking at least 24 to 48 hours before your event date so our kitchen can procure fresh ingredients in bulk for you at discounted prices.',
  },
];

export const HelpFAQ: React.FC<HelpFAQProps> = ({
  onNavigateMenu,
  onNavigateTracking,
  onNavigateContact,
  onNavigateCatering,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Box bg="#FAF8F5" minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW={{ base: "100%", md: "90%" }} px={{ base: 3, md: 4 }}>
        {/* Header Hero */}
        <VStack spaceY={4} textAlign="center" maxW="3xl" mx="auto" mb={10}>
          <Badge bg="#FFF3EB" color="#C65D3A" px={3.5} py={1} borderRadius="full" fontSize="11px" fontWeight="black" letterSpacing="wider">
            <HelpCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            HELP CENTER & EASY GUIDES
          </Badge>
          <Heading as="h1" size={{ base: "xl", sm: "2xl" }} fontWeight="950" color="black" letterSpacing="tight">
            How Can We Help You Today?
          </Heading>
          <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
            Simple step-by-step instructions on how to order food, pay with bank transfer, track your meal, and get answers to common questions.
          </Text>

          {/* Quick Search Bar */}
          <Box w="full" maxW="md" pt={2}>
            <HStack bg="white" p={2} borderRadius="2xl" borderWidth="1.5px" borderColor="gray.200" shadow="sm">
              <Box color="gray.400" pl={3}>
                <Search size={18} />
              </Box>
              <Input
                placeholder="Search questions (e.g., payment, pickup, refund)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                border="none"
                _focus={{ outline: 'none' }}
                fontSize="xs"
                color="black"
              />
              {searchQuery && (
                <Button size="xs" variant="ghost" onClick={() => setSearchQuery('')} color="gray.500">
                  Clear
                </Button>
              )}
            </HStack>
          </Box>
        </VStack>

        {/* 4 VISUAL HOW-TO-USE GUIDES */}
        <Box mb={14}>
          <Heading as="h2" size="md" fontWeight="black" color="black" mb={6} textAlign="center">
            📖 How to Use Different Parts of the App
          </Heading>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
            {/* Guide 1: How to Order */}
            <Box bg="white" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
              <HStack spaceX={3} mb={4}>
                <Box bg="#FFF3EB" p={3} borderRadius="2xl" color="#C65D3A">
                  <ShoppingBag size={22} />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Badge bg="orange.100" color="orange.800" fontSize="9px" fontWeight="black" px={2} py={0.5} borderRadius="md">
                    STEP 1
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                    How to Order Food
                  </Heading>
                </VStack>
              </HStack>
              <VStack align="stretch" spaceY={2.5} fontSize="xs" color="gray.700">
                <HStack spaceX={2} align="flex-start">
                  <Text color="#C65D3A" fontWeight="black">1.</Text>
                  <Text>Open the <strong>Food Menu</strong> page to see today's available meals.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="#C65D3A" fontWeight="black">2.</Text>
                  <Text>Tap on any food item to choose portion size, extras, or swallow type.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="#C65D3A" fontWeight="black">3.</Text>
                  <Text>Open your <strong>Cart</strong> at the top right, fill in your name and phone number.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="#C65D3A" fontWeight="black">4.</Text>
                  <Text>Click <strong>Pay by Bank Transfer</strong> to complete your order.</Text>
                </HStack>
              </VStack>
              <Button
                size="xs"
                mt={5}
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                borderRadius="xl"
                fontWeight="bold"
                onClick={onNavigateMenu}
                w="full"
              >
                Go to Food Menu <ArrowRight size={12} style={{ marginLeft: '6px' }} />
              </Button>
            </Box>

            {/* Guide 2: How to Pay */}
            <Box bg="white" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
              <HStack spaceX={3} mb={4}>
                <Box bg="emerald.50" p={3} borderRadius="2xl" color="emerald.600">
                  <CreditCard size={22} />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Badge bg="emerald.100" color="emerald.800" fontSize="9px" fontWeight="black" px={2} py={0.5} borderRadius="md">
                    STEP 2
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                    How to Pay & Send Proof
                  </Heading>
                </VStack>
              </HStack>
              <VStack align="stretch" spaceY={2.5} fontSize="xs" color="gray.700">
                <HStack spaceX={2} align="flex-start">
                  <Text color="emerald.600" fontWeight="black">1.</Text>
                  <Text>Copy our bank details (Bank: <strong>OPay</strong>, Acct: <strong>6100712673</strong>).</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="emerald.600" fontWeight="black">2.</Text>
                  <Text>Send money from your bank app (OPay, PalmPay, GTBank, Kuda, USSD).</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="emerald.600" fontWeight="black">3.</Text>
                  <Text>Put your <strong>Order Code</strong> in the bank transfer description message.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="emerald.600" fontWeight="black">4.</Text>
                  <Text>Upload transfer screenshot OR type your Bank Account Name on the app.</Text>
                </HStack>
              </VStack>
              <Button
                size="xs"
                mt={5}
                bg="emerald.600"
                color="white"
                _hover={{ bg: 'emerald.700' }}
                borderRadius="xl"
                fontWeight="bold"
                onClick={onNavigateMenu}
                w="full"
              >
                Start Food Order <ArrowRight size={12} style={{ marginLeft: '6px' }} />
              </Button>
            </Box>

            {/* Guide 3: How to Track & Pickup */}
            <Box bg="white" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
              <HStack spaceX={3} mb={4}>
                <Box bg="blue.50" p={3} borderRadius="2xl" color="blue.600">
                  <Truck size={22} />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Badge bg="blue.100" color="blue.800" fontSize="9px" fontWeight="black" px={2} py={0.5} borderRadius="md">
                    STEP 3
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                    How to Track & Collect Food
                  </Heading>
                </VStack>
              </HStack>
              <VStack align="stretch" spaceY={2.5} fontSize="xs" color="gray.700">
                <HStack spaceX={2} align="flex-start">
                  <Text color="blue.600" fontWeight="black">1.</Text>
                  <Text>Click <strong>Track My Order</strong> in the menu bar.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="blue.600" fontWeight="black">2.</Text>
                  <Text>Enter your <strong>Order Code</strong> or <strong>Phone Number</strong> to check status.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="blue.600" fontWeight="black">3.</Text>
                  <Text>When status says <strong>Ready for Pickup</strong>, head to your selected location.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="blue.600" fontWeight="black">4.</Text>
                  <Text>Show your <strong>Pickup Code</strong> to the delivery rider to collect your food!</Text>
                </HStack>
              </VStack>
              <Button
                size="xs"
                mt={5}
                bg="blue.600"
                color="white"
                _hover={{ bg: 'blue.700' }}
                borderRadius="xl"
                fontWeight="bold"
                onClick={onNavigateTracking}
                w="full"
              >
                Track My Order Now <ArrowRight size={12} style={{ marginLeft: '6px' }} />
              </Button>
            </Box>

            {/* Guide 4: How to Book Catering */}
            <Box bg="white" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
              <HStack spaceX={3} mb={4}>
                <Box bg="purple.50" p={3} borderRadius="2xl" color="purple.600">
                  <Utensils size={22} />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Badge bg="purple.100" color="purple.800" fontSize="9px" fontWeight="black" px={2} py={0.5} borderRadius="md">
                    EVENTS & PARTIES
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                    How to Book Catering
                  </Heading>
                </VStack>
              </HStack>
              <VStack align="stretch" spaceY={2.5} fontSize="xs" color="gray.700">
                <HStack spaceX={2} align="flex-start">
                  <Text color="purple.600" fontWeight="black">1.</Text>
                  <Text>Click <strong>Special Orders / Catering</strong> in the menu.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="purple.600" fontWeight="black">2.</Text>
                  <Text>Fill in your event date, number of guests, and food requested.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="purple.600" fontWeight="black">3.</Text>
                  <Text>Submit the form — our team will call or WhatsApp you directly.</Text>
                </HStack>
                <HStack spaceX={2} align="flex-start">
                  <Text color="purple.600" fontWeight="black">4.</Text>
                  <Text>Get freshly cooked bulk meals delivered directly to your party venue!</Text>
                </HStack>
              </VStack>
              <Button
                size="xs"
                mt={5}
                bg="purple.600"
                color="white"
                _hover={{ bg: 'purple.700' }}
                borderRadius="xl"
                fontWeight="bold"
                onClick={onNavigateCatering}
                w="full"
              >
                Book Catering <ArrowRight size={12} style={{ marginLeft: '6px' }} />
              </Button>
            </Box>
          </Grid>
        </Box>

        {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
        <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm" mb={12}>
          <VStack spaceY={2} align="flex-start" mb={6}>
            <Heading as="h2" size="lg" fontWeight="black" color="black">
              ❓ Frequently Asked Questions
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Click on any question below to see the answer.
            </Text>

            {/* Category Filter Pills */}
            <HStack spaceX={2} flexWrap="wrap" pt={2} gap={2}>
              <Button
                size="xs"
                borderRadius="full"
                fontWeight="bold"
                bg={activeCategory === 'all' ? '#C65D3A' : 'gray.100'}
                color={activeCategory === 'all' ? 'white' : 'gray.700'}
                _hover={{ bg: activeCategory === 'all' ? '#A94B2B' : 'gray.200' }}
                onClick={() => setActiveCategory('all')}
              >
                All Questions ({FAQS.length})
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                fontWeight="bold"
                bg={activeCategory === 'ordering' ? '#C65D3A' : 'gray.100'}
                color={activeCategory === 'ordering' ? 'white' : 'gray.700'}
                _hover={{ bg: activeCategory === 'ordering' ? '#A94B2B' : 'gray.200' }}
                onClick={() => setActiveCategory('ordering')}
              >
                Food Ordering
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                fontWeight="bold"
                bg={activeCategory === 'payment' ? '#C65D3A' : 'gray.100'}
                color={activeCategory === 'payment' ? 'white' : 'gray.700'}
                _hover={{ bg: activeCategory === 'payment' ? '#A94B2B' : 'gray.200' }}
                onClick={() => setActiveCategory('payment')}
              >
                Payments & Refunds
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                fontWeight="bold"
                bg={activeCategory === 'pickup' ? '#C65D3A' : 'gray.100'}
                color={activeCategory === 'pickup' ? 'white' : 'gray.700'}
                _hover={{ bg: activeCategory === 'pickup' ? '#A94B2B' : 'gray.200' }}
                onClick={() => setActiveCategory('pickup')}
              >
                Pickup & Delivery
              </Button>
              <Button
                size="xs"
                borderRadius="full"
                fontWeight="bold"
                bg={activeCategory === 'catering' ? '#C65D3A' : 'gray.100'}
                color={activeCategory === 'catering' ? 'white' : 'gray.700'}
                _hover={{ bg: activeCategory === 'catering' ? '#A94B2B' : 'gray.200' }}
                onClick={() => setActiveCategory('catering')}
              >
                Catering & Events
              </Button>
            </HStack>
          </VStack>

          {/* Accordion FAQ List */}
          <VStack spaceY={3} align="stretch">
            {filteredFaqs.length === 0 ? (
              <Box py={8} textAlign="center" color="gray.500">
                <Text fontSize="sm">No matching questions found.</Text>
                <Button size="xs" variant="link" color="#C65D3A" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} mt={2}>
                  Reset filters
                </Button>
              </Box>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <Box
                    key={faq.id}
                    borderWidth="1px"
                    borderColor={isOpen ? '#C65D3A' : 'gray.200'}
                    borderRadius="2xl"
                    overflow="hidden"
                    bg={isOpen ? '#FFFBF7' : 'white'}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <Flex
                      p={4}
                      justify="space-between"
                      align="center"
                      cursor="pointer"
                      onClick={() => toggleFaq(faq.id)}
                      _hover={{ bg: '#FFF8F0' }}
                    >
                      <HStack spaceX={3}>
                        <Box color={isOpen ? '#C65D3A' : 'gray.400'}>
                          <HelpCircle size={18} />
                        </Box>
                        <Text fontSize="xs" fontWeight="bold" color="black">
                          {faq.question}
                        </Text>
                      </HStack>
                      <Box color="gray.500" pl={2}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </Box>
                    </Flex>

                    {isOpen && (
                      <Box px={4} pb={4} pt={1} borderTopWidth="1px" borderColor="gray.100">
                        <Text fontSize="xs" color="gray.600" lineHeight="relaxed">
                          {faq.answer}
                        </Text>
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </VStack>
        </Box>

        {/* STILL HAVE QUESTIONS / CONTACT CARDS */}
        <Box bg="#FFF3EB" p={{ base: 6, md: 8 }} borderRadius="3xl" borderWidth="1.5px" borderColor="#C65D3A" textAlign="center">
          <VStack spaceY={3} maxW="md" mx="auto">
            <Box bg="#C65D3A" color="white" p={3} borderRadius="full">
              <PhoneCall size={24} />
            </Box>
            <Heading as="h3" size="md" fontWeight="black" color="black">
              Still Need Help or Have Questions?
            </Heading>
            <Text fontSize="xs" color="gray.700" lineHeight="relaxed">
              Our customer care team is available on WhatsApp and phone calls to assist you with your food order.
            </Text>
            <HStack spaceX={3} pt={2} flexWrap="wrap" justify="center" gap={2}>
              <Button
                bg="#C65D3A"
                color="white"
                _hover={{ bg: '#A94B2B' }}
                borderRadius="xl"
                size="sm"
                fontWeight="bold"
                onClick={onNavigateContact}
                px={6}
              >
                <MessageSquare size={14} style={{ marginRight: '6px' }} />
                Contact Customer Support
              </Button>
              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                borderRadius="xl"
                size="sm"
                fontWeight="bold"
                onClick={onNavigateMenu}
                px={6}
              >
                <ShoppingBag size={14} style={{ marginRight: '6px' }} />
                Order Food Now
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};
