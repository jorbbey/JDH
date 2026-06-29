import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Input,
  Stack,
  Grid,
} from '@chakra-ui/react';
import jdhLogo from '../assets/JDH_logo-trans.png';
import jollofImg from '../assets/Jollof Rice and Beef.jpg';
import stewImg from '../assets/Nigerian Beef Stew (African Stew).jpg';
import egusiImg from '../assets/Egusi Soup.jpg';
import friedRiceImg from '../assets/Fried Rice.jpg';
import ogbonoImg from '../assets/ogbono soup.jpg';
import pepperedChickenImg from '../assets/peppered kitche.jpg';
import foodCollageImg from '../assets/food collage.png';
import logisticsImg from '../assets/logistics.png';
import logisticsRealImg from '../assets/logistics-real.png';
import firstImg from '../assets/first_img.png';
import secondImg from '../assets/second_img.png';
import {
  User,
  MapPin,
  CheckCircle,
  Phone,
  Heart,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Star,
  Check,
  Camera,
  X,
  Users,
  ChefHat,
  Wallet,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from 'lucide-react';
import { authService } from '../services/auth';
import { menuService, MenuMealProgress, DeliveryScheduleRow } from '../services/menus';
import { reviewsService, CustomerReview } from '../services/reviews';

interface LandingPageProps {
  onViewMenu: () => void;
  onViewTracking: () => void;
  onViewCatering?: () => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onViewMenu,
  onViewTracking,
  onViewCatering,
  currentUser,
  setCurrentUser,
}) => {
  // Auth Form State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Weekly highlights state
  const [highlightMeals, setHighlightMeals] = useState<MenuMealProgress[]>([]);
  const [schedule, setSchedule] = useState<DeliveryScheduleRow | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(true);

  // Carousel item index pointers (for visual micro-interactions)
  const [activePopularIdx, setActivePopularIdx] = useState(0);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  // Dynamic reviews state
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewStartIndex, setReviewStartIndex] = useState(0);

  // Leave a review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // PWA Install prompt states
  const [pwaPromptEvent, setPwaPromptEvent] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Active Category Selection for "Regular Menu Pack" (matches Bites tabs)
  const [activeCategory, setActiveCategory] = useState('All');

  // Simulated Hearts/Likes
  const [likedMeals, setLikedMeals] = useState<Record<string, boolean>>({});

  // PWA Event Listener Hook
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaPromptEvent(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setPwaPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (!pwaPromptEvent) return;
    pwaPromptEvent.prompt();
    const { outcome } = await pwaPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      setPwaPromptEvent(null);
    }
  };

  useEffect(() => {
    async function loadHighlights() {
      try {
        const activeMenu = await menuService.getActiveMenu();
        if (activeMenu) {
          const [meals, sched] = await Promise.all([
            menuService.getMenuMealsProgress(activeMenu.id),
            menuService.getDeliveryScheduleForMenu(activeMenu.id),
          ]);
          setHighlightMeals(meals);
          setSchedule(sched);
        }
      } catch (err) {
        console.error('Error loading landing menu highlights:', err);
      } finally {
        setLoadingMeals(false);
      }
    }
    loadHighlights();
  }, []);

  // Fetch Dynamic reviews
  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await reviewsService.getReviews();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, []);

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReviewHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!reviewName.trim() || !reviewRole.trim() || !reviewText.trim()) {
      setReviewError('Please provide your name, role/context, and a review message.');
      return;
    }

    setSubmittingReview(true);
    try {
      let uploadedUrl = '';
      if (reviewImageFile) {
        try {
          uploadedUrl = await reviewsService.uploadAvatar(reviewImageFile);
        } catch (uploadErr: any) {
          console.warn('Avatar upload failed, falling back to dynamic placeholder:', uploadErr.message);
          uploadedUrl = '';
        }
      }

      // If no photo uploaded, use a nice generic initials/abstract avatar or random Unsplash profile image
      if (!uploadedUrl) {
        const fallbackAvatars = [
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80'
        ];
        const randomIdx = Math.floor(Math.random() * fallbackAvatars.length);
        uploadedUrl = fallbackAvatars[randomIdx];
      }

      const savedReview = await reviewsService.submitReview({
        name: reviewName,
        role: reviewRole,
        text: reviewText,
        stars: reviewStars,
        image: uploadedUrl
      });

      // Prepend review
      setReviews(prev => [savedReview, ...prev]);

      // Reset
      setReviewName('');
      setReviewRole('');
      setReviewText('');
      setReviewStars(5);
      setReviewImageFile(null);
      setReviewImagePreview(null);
      setReviewStartIndex(0); // View first
      setReviewSuccess('Your review has been successfully submitted and is now public!');
    } catch (err: any) {
      console.error('Submission error:', err);
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email || !password) {
      setAuthError('Please fill in all credentials.');
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) {
        setAuthError(error.message);
      } else if (data?.user) {
        setAuthSuccess('Logged in successfully!');
        const profile = await authService.getCurrentProfile();
        setCurrentUser(profile);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email || !password || !fullName || !hostelName || !roomNumber) {
      setAuthError('Please fill in all required fields marked with *');
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await authService.signUp(
        email,
        password,
        fullName,
        phone || undefined,
        hostelName,
        roomNumber
      );
      if (error) {
        setAuthError(error.message);
      } else if (data) {
        setAuthSuccess('Registration completed! You can now access your account.');
        const { data: signInData } = await authService.signIn(email, password);
        if (signInData?.user) {
          const profile = await authService.getCurrentProfile();
          setCurrentUser(profile);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setAuthSuccess('Signed out successfully.');
    setEmail('');
    setPassword('');
  };

  const toggleLike = (mealId: string) => {
    setLikedMeals(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  // Static/Fallback menu items matching the design precisely, but integrated with dynamic price tags
  const defaultPopularDishes = [
    {
      name: 'Signature Jollof Rice',
      category: 'Nigerian Party',
      price: 2500,
      description: 'Rich, authentic smoky party jollof rice cooked with traditional spices, served with soft succulent beef and dodo.',
      rating: 5,
      image: jollofImg,
    },
    {
      name: 'Stew',
      category: 'Nigerian Party',
      price: 2000,
      description: 'Chunky succulent beef stew slow cooked in traditional rich tomato and pepper base.',
      rating: 5,
      image: stewImg,
    },
    {
      name: 'Egusi Soup',
      category: 'Gourmet Swallow',
      price: 3000,
      description: 'Classic rich Egusi soup prepared with melon seeds, pumpkin greens, and premium local seasoning.',
      rating: 5,
      image: egusiImg,
    }
  ];

  const defaultOtherDishes = [
    ...defaultPopularDishes,
    {
      name: 'Fried Rice',
      category: 'Nigerian Party',
      price: 2400,
      description: 'Nicely seasoned fried rice loaded with sweet carrots, green peas, sweet corn, and savory herbs.',
      rating: 4,
      image: friedRiceImg,
    },
    {
      name: 'Ogbono Soup',
      category: 'Gourmet Swallow',
      price: 2800,
      description: 'Thick, aromatic wild mango seed soup cooked with spinach, stock fish, and pure red palm oil.',
      rating: 5,
      image: ogbonoImg,
    },
    {
      name: 'Peppered Chicken',
      category: 'Nigerian Party',
      price: 1800,
      description: 'Crispy fried chicken parts thoroughly tossed in rich, fiery spicy pepper sauce and local garnished greens.',
      rating: 5,
      image: pepperedChickenImg,
    }
  ];

  const menuCategories = ['All', 'Nigerian Party', 'Gourmet Swallow'];

  // Under-the-hood filtering
  const displayMeals = highlightMeals.length > 0 
    ? highlightMeals 
    : defaultPopularDishes.map((d, index) => ({
        menu_meal_id: `static-${index}`,
        meal_name: d.name,
        meal_category: d.category,
        unit_price: d.price,
        image_url: d.image,
        description: d.description,
        total_ordered_quantity: 12,
        min_threshold: 20,
        is_threshold_met: false,
        remaining_orders_needed: 8,
      }));

  const displayAllMeals = highlightMeals.length > 0
    ? highlightMeals
    : defaultOtherDishes.map((d, index) => ({
        menu_meal_id: `static-other-${index}`,
        meal_name: d.name,
        meal_category: d.category,
        unit_price: d.price,
        image_url: d.image,
        description: d.description,
        total_ordered_quantity: 14,
        min_threshold: 20,
        is_threshold_met: false,
        remaining_orders_needed: 6,
      }));

  const filteredMealsForPack = activeCategory === 'All'
    ? displayAllMeals
    : displayAllMeals.filter(m => m.meal_category?.toLowerCase() === activeCategory.toLowerCase());

  // Customer Reviews matches Bites savannah nguyen visual
  const testimonials = [
    {
      text: "Getting high-quality Fisherman Soup and yellow garri on a student budget felt impossible. With JDH Kitchen's pool model, my entire floor gets chef meals delivered hot right to the hostel gate. It was green-lit on Wednesday!",
      name: "Amara Okafor",
      role: "Moremi Hall President",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "The zero-waste refund model is brilliant. I ordered the Peppered Gizzard Platter, we missed the threshold by 3 orders, and my wallet was automatically credited instantly. No hassle, no lost funds. Big props to this system.",
      name: "Tunde Balogun",
      role: "Engineering • Year 4",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    {
      text: "Best catering website on campus, hands down! The UI is exceptionally clean, ordering is smooth, and the food tastes authentic. Group delivery is always on time, which helps me optimize my study schedule.",
      name: "Fatimah Yusuf",
      role: "Eni Njoku Hostel",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    }
  ];

  return (
    <Box minH="100vh" bg="#FFFBF7" color="#2D2D2D" fontFamily="Inter, sans-serif">
      
      {/* 1. HERO SECTION: STUNNING BRAND COOP BENTO (REPLICATING BITES DESIGN) */}
      <Box py={{ base: 12, md: 24 }} px={4} position="relative" overflow="hidden">
        {/* Soft elegant floating vector-like circles matching Bites */}
        <Box 
          position="absolute" 
          top="-10%" 
          left="-5%" 
          w="300px" 
          h="300px" 
          borderRadius="full" 
          bg="rgba(198, 93, 58, 0.03)" 
          filter="blur(50px)" 
        />
        <Box 
          position="absolute" 
          bottom="-10%" 
          right="-5%" 
          w="400px" 
          h="400px" 
          borderRadius="full" 
          bg="rgba(107, 142, 35, 0.03)" 
          filter="blur(60px)" 
        />

        <Container maxW="95%">
          <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={16} alignItems="center">
            
            {/* Left Content Column */}
            <VStack align="flex-start" spaceY={6}>
              <Heading 
                as="h1" 
                fontSize={{ base: '5xl', md: '7xl' }} 
                fontWeight="800" 
                lineHeight="1.2" 
                color="#2D2D2D" 
                letterSpacing="-0.02em"
                fontFamily="'Playfair Display', 'Georgia', serif"
              >
                We Serve The <Box as="span" color="#C65D3A" fontStyle="italic" fontWeight="900">Taste</Box><br />
                You <Box as="span" color="#C65D3A" fontStyle="italic" fontWeight="900">Love</Box> 😍
              </Heading>

              <Text fontSize="md" color="gray.600" maxW="xl" lineHeight="relaxed">
                JDH Kitchen brings delicious homemade meals to students at affordable prices. By preparing meals based on weekly group orders, we keep costs low while delivering fresh, tasty, and satisfying meals without the high prices of restaurants.
              </Text>

              <Flex direction={{ base: 'column', sm: 'row' }} gap={4} pt={4} w="full">
                <Button 
                  onClick={onViewMenu} 
                  bg="#C65D3A" 
                  _hover={{ bg: '#A94B2B', transform: 'scale(1.02)' }} 
                  color="white" 
                  size="lg" 
                  fontWeight="black" 
                  px={10}
                  h="60px"
                  borderRadius="full"
                  shadow="lg"
                  w={{ base: 'full', sm: 'auto' }}
                  style={{ transition: 'all 0.2s' }}
                >
                  Explore Food
                </Button>
                
                <Button 
                  onClick={onViewMenu}
                  variant="outline"
                  borderColor="gray.2D2D2D"
                  color="#2D2D2D"
                  _hover={{ bg: 'rgba(0,0,0,0.02)', transform: 'scale(1.02)' }} 
                  size="lg" 
                  fontWeight="bold" 
                  px={8}
                  h="60px"
                  borderRadius="full"
                  w={{ base: 'full', sm: 'auto' }}
                  style={{ transition: 'all 0.2s' }}
                  leftIcon={<Search size={18} />}
                >
                  Search Menu
                </Button>
              </Flex>
            </VStack>

            {/* Right Graphic Column: Massive circular plate matching Bites image */}
            <Box position="relative" display="flex" justifyContent="center" alignItems="center">
              {/* Outer soft vector decor */}
              <Box 
                position="absolute"
                w={{ base: '100%', md: '110%' }}
                h={{ base: '100%', md: '110%' }}
                borderRadius="full"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="rgba(198, 93, 58, 0.15)"
                animation="spin 120s linear infinite"
                zIndex={0}
              />

              {/* Huge circular plate */}
              <Box 
                w={{ base: '240px', sm: '320px', md: '480px' }} 
                h={{ base: '240px', sm: '320px', md: '480px' }} 
                borderRadius="full" 
                bg="white" 
                p={4}
                boxShadow="2xl"
                display="flex"
                justifyContent="center"
                alignItems="center"
                borderWidth="1px"
                borderColor="gray.100"
                zIndex={1}
              >
                <Box 
                  as="img"
                  src={foodCollageImg}
                  alt="JDH Featured Food Collage"
                  w="95%"
                  h="95%"
                  objectFit="cover"
                  borderRadius="full"
                />
              </Box>

              {/* Floating food category tiles matching the right sidebar in screenshot */}
              <VStack 
                position="absolute"
                right={{ base: '-2%', md: '-8%' }}
                top="15%"
                spaceY={3.5}
                zIndex={2}
                align="flex-start"
                display={{ base: 'none', sm: 'flex' }}
              >
                <FloatingPill label="Jollof" icon="🍛" />
                <FloatingPill label="Stew" icon="🍲" />
                <FloatingPill label="Soup" icon="🥣" />
                <FloatingPill label="Chicken" icon="🍗" />
                <FloatingPill label="Fried" icon="🍚" />
              </VStack>
            </Box>

          </Grid>
        </Container>
      </Box>

      {/* 2. CHALICE/BENEFITS GRID */}
      <Container maxW="90%" py={12} px={4}>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={8}>
          
          <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth="1px" borderColor="gray.100" align="center" shadow="sm" _hover={{ shadow: 'md' }} style={{ transition: 'all 0.3s' }}>
            <Box p={4} bg="rgba(198, 93, 58, 0.08)" borderRadius="2xl" w="fit-content" mb={5}>
              <Users size={24} color="#C65D3A" />
            </Box>
            <Heading as="h4" size="sm" fontWeight="900" mb={1} color="black">
              Group Orders
            </Heading>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              Meals are prepared when enough students place orders, helping everyone enjoy fresh food at affordable prices.
            </Text>
          </Box>

          <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth="1px" borderColor="gray.100" align="center" shadow="sm" _hover={{ shadow: 'md' }} style={{ transition: 'all 0.3s' }}>
            <Box p={4} bg="rgba(198, 93, 58, 0.08)" borderRadius="2xl" w="fit-content" mb={5}>
              <ChefHat size={24} color="#C65D3A" />
            </Box>
            <Heading as="h4" size="sm" fontWeight="900" mb={1} color="black">
              Freshly Prepared
            </Heading>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              Every meal is carefully prepared in a clean kitchen to give you the delicious taste of home.
            </Text>
          </Box>

          <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth="1px" borderColor="gray.100" align="center" shadow="sm" _hover={{ shadow: 'md' }} style={{ transition: 'all 0.3s' }}>
            <Box p={4} bg="rgba(198, 93, 58, 0.08)" borderRadius="2xl" w="fit-content" mb={5}>
              <MapPin size={24} color="#C65D3A" />
            </Box>
            <Heading as="h4" size="sm" fontWeight="900" mb={1} color="black">
              Convenient Pickup
            </Heading>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              Collect your meals from designated pickup locations on campus at the scheduled time.
            </Text>
          </Box>

          <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth="1px" borderColor="gray.100" align="center" shadow="sm" _hover={{ shadow: 'md' }} style={{ transition: 'all 0.3s' }}>
            <Box p={4} bg="rgba(198, 93, 58, 0.08)" borderRadius="2xl" w="fit-content" mb={5}>
              <Wallet size={24} color="#C65D3A" />
            </Box>
            <Heading as="h4" size="sm" fontWeight="900" mb={1} color="black">
              Affordable Prices
            </Heading>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              Enjoy quality homemade meals at student-friendly prices without paying restaurant premiums.
            </Text>
          </Box>

        </Grid>
      </Container>

      {/* 3. POPULAR DISHES SECTION */}
      <Box py={16} bg="white" borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100">
        <Container maxW="90%">
          <Flex justify="space-between" align="center" mb={10}>
            <VStack align="flex-start" spaceY={1}>
              <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="#C65D3A" textTransform="uppercase">
                Chef's Recommendations
              </Text>
              <Heading as="h2" size="xl" fontWeight="950" color="black" letterSpacing="-0.02em">
                Popular Dishes
              </Heading>
            </VStack>

            <HStack spaceX={2.5}>
              <Button 
                onClick={() => setActivePopularIdx(prev => Math.max(0, prev - 1))}
                variant="outline" 
                borderColor="gray.200" 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                p={0}
                _hover={{ bg: 'gray.50' }}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button 
                onClick={() => setActivePopularIdx(prev => Math.min(Math.max(0, displayMeals.length - 3), prev + 1))}
                bg="#C65D3A" 
                color="white" 
                _hover={{ bg: '#A94B2B' }} 
                borderRadius="full" 
                w="50px" 
                h="50px" 
                p={0}
              >
                <ChevronRight size={20} />
              </Button>
            </HStack>
          </Flex>

          {loadingMeals ? (
            <Flex py={12} justify="center" align="center">
              <Text fontSize="sm" color="gray.500">Retrieving co-op meal preloads...</Text>
            </Flex>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={8}>
              {displayMeals.slice(activePopularIdx, activePopularIdx + 3).map((meal, index) => {
                const percentProgress = Math.min(100, Math.round((meal.total_ordered_quantity! / meal.min_threshold!) * 100));
                
                return (
                  <Box 
                    key={meal.menu_meal_id || index} 
                    bg="white" 
                    borderRadius="3xl" 
                    p={5} 
                    borderWidth="1px" 
                    borderColor="gray.150" 
                    shadow="sm"
                    _hover={{ transform: 'translateY(-6px)', shadow: 'md' }}
                    style={{ transition: 'all 0.3s' }}
                  >
                    {/* Circle Image Wrapper matching Bites */}
                    <Flex justify="center" py={6}>
                      <Box w="180px" h="180px" borderRadius="full" overflow="hidden" shadow="md">
                        <Box 
                          as="img"
                          src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                          alt={meal.meal_name || 'Meal'}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      </Box>
                    </Flex>

                    {/* Metadata Content */}
                    <VStack align="stretch" spaceY={3} textAlign="center">
                      <Heading as="h4" size="md" fontWeight="900" color="black" lineClamp={1}>
                        {meal.meal_name}
                      </Heading>

                      {/* Display beautiful star ratings matching Bites */}
                      <HStack justify="center" spaceX={1}>
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={13} fill="#C65D3A" color="#C65D3A" />
                        ))}
                      </HStack>

                      <Text color="gray.500" fontSize="xs" lineClamp={2} minH="36px">
                        {meal.description || 'Delectable recipe curated by catering chefs matching premium standard regulations.'}
                      </Text>

                      {/* Dynamic Pooling Tracker Progress Bar */}
                      <VStack spaceY={1.5} align="stretch" bg="#FFFBF7" p={3.5} borderRadius="2xl" borderWidth="1px" borderColor="#FFEFE0">
                        <Flex justify="space-between" fontSize="10px" fontWeight="black">
                          <Text color="gray.600">Pooling Status</Text>
                          <Text color={meal.is_threshold_met ? "#6B8E23" : "amber.800"}>
                            {meal.total_ordered_quantity} / {meal.min_threshold} orders
                          </Text>
                        </Flex>
                        
                        <Box w="full" h="6px" bg="gray.100" borderRadius="full" overflow="hidden">
                          <Box w={`${percentProgress}%`} h="full" bg={meal.is_threshold_met ? "#6B8E23" : "#C65D3A"} borderRadius="full" />
                        </Box>

                        {meal.is_threshold_met ? (
                          <Text fontSize="9px" color="#6B8E23" fontWeight="bold" textAlign="left">
                            ✓ Target reached! Meal is green-lit to cook
                          </Text>
                        ) : (
                          <Text fontSize="9px" color="gray.500" textAlign="left">
                            ⏳ Needs {meal.remaining_orders_needed ?? Math.max(1, meal.min_threshold! - meal.total_ordered_quantity!)} more orders to confirm
                          </Text>
                        )}
                      </VStack>

                      {/* Footer Price & Add Button */}
                      <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="gray.100">
                        <Text fontSize="lg" fontWeight="950" color="#C65D3A">
                          ₦{meal.unit_price?.toLocaleString() || '1,800'}
                        </Text>

                        <Button 
                          onClick={onViewMenu}
                          variant="outline"
                          borderColor="#C65D3A"
                          color="#C65D3A"
                          _hover={{ bg: '#C65D3A', color: 'white' }}
                          size="sm"
                          borderRadius="full"
                          h="38px"
                          px={5}
                          fontWeight="bold"
                        >
                          Add To Cart
                        </Button>
                      </Flex>
                    </VStack>
                  </Box>
                )
              })}
            </Grid>
          )}
        </Container>
      </Box>

      {/* 4. "WE ARE MORE THAN MULTIPLE SERVICE" SECTION */}
      <Box py={20} bg="#FFFBF7">
        <Container maxW="90%">
          <Grid templateColumns={{ base: '1fr', lg: '0.9fr 1.1fr' }} gap={16} alignItems="center">
            
            {/* Left Graphic: Gourmet meal layout card frame */}
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              {/* background visual decor */}
              <Box 
                position="absolute"
                w="105%"
                h="105%"
                borderRadius="3xl"
                borderWidth="1.5px"
                borderStyle="dashed"
                borderColor="rgba(107, 142, 35, 0.2)"
                zIndex={0}
              />
              {/* Gourmet Image Core Frame */}
              <Box 
                w={{ base: '260px', sm: '320px', md: '440px' }} 
                h={{ base: '260px', sm: '320px', md: '440px' }} 
                borderRadius="3xl" 
                overflow="hidden" 
                borderWidth="8px"
                borderColor="white"
                boxShadow="2xl"
                zIndex={1}
              >
                <Box 
                  as="img"
                  src="https://lgkljlcnqcwqoauymlyi.supabase.co/storage/v1/object/public/public-images/first_img.png"
                  alt="JDH Kitchen services and meals"
                  w="full"
                  h="full"
                  objectFit="cover"
                  referrerPolicy="no-referrer"
                />
              </Box>

              {/* Floating Emojis mimicking floating food ingredients */}
              <Box position="absolute" top="-10%" left="-5%" fontSize={{base: 'xl', md: '2xl', lg: '3xl'}} zIndex={2}>🥬</Box>
              <Box position="absolute" bottom="-10%" left="-5%" fontSize={{base: 'xl', md: '2xl', lg: '3xl'}} zIndex={2}>🍅</Box>
              <Box position="absolute" top="-10%" right="-5%" fontSize={{base: 'xl', md: '2xl', lg: '3xl'}} zIndex={2}>🌶️</Box>
              <Box position="absolute" bottom="-10%" right="-5%" fontSize={{base: 'xl', md: '2xl', lg: '3xl'}} zIndex={2}>🍳</Box>
            </Box>

            {/* Right Information Pack */}
            <VStack align="flex-start" spaceY={6}>
              <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="#6B8E23" textTransform="uppercase">
                About Our Service
              </Text>
              <Heading as="h2" size="2xl" fontWeight="950" color="black" letterSpacing="-0.03em" lineHeight="1.15">
                More Than Just
                Food Delivery
              </Heading>
              
              <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                JDH Kitchen makes it easy for students to enjoy delicious homemade meals at affordable prices. By preparing meals in bulk based on weekly orders, we reduce waste, keep prices low, and deliver quality traditional meals you can trust.
              </Text>

              {/* Grid bullet services matching layout of Bites exactly */}
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={6} w="full" pt={4}>
                <ServiceBullet icon="📲" title="Easy Online Ordering" desc="Place your orders conveniently from anywhere." />
                <ServiceBullet icon="📅" title="Weekly Reservations" desc="Reserve your meals ahead of time to secure your spot." />
                <ServiceBullet icon="⏰" title="Real-Time Updates" desc="Stay informed about active meal orders and pickup schedules." />
                <ServiceBullet icon="📍" title="Convenient Pickup Points" desc="Meals are delivered to designated pickup locations on campus." />
                <ServiceBullet icon="🧼" title="Clean and Hygienic Kitchen" desc="Every meal is prepared with strict cleanliness and safety standards." />
                <ServiceBullet icon="👨‍🍳" title="Homemade Taste" desc="Enjoy fresh, authentic meals prepared with care and experience." />
              </Grid>

              <Button 
                onClick={onViewMenu}
                bg="#C65D3A" 
                color="white" 
                _hover={{ bg: '#A94B2B' }} 
                size="lg" 
                fontWeight="black" 
                borderRadius="full" 
                px={10}
                h="56px"
                shadow="md"
                mt={4}
              >
                About Us
              </Button>
            </VStack>

          </Grid>
        </Container>
      </Box>

      {/* 5. "OUR REGULAR MENU PACK" SECTION (INTEGRATING YOUR REAL MEALS) */}
      <Box py={20} bg="white" borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100">
        <Container maxW="90%">
          <VStack spaceY={3} align="center" textAlign="center" mb={12}>
            <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="#C65D3A" textTransform="uppercase">
              Dynamic Campus Catalog
            </Text>
            <Heading as="h2" size="2xl" fontWeight="950" color="black" letterSpacing="-0.03em">
              Our Regular Menu Pack
            </Heading>
            
            {/* Category tabs matching the screenshot tabs exactly */}
            <Flex gap={3} mt={6} flexWrap="wrap" justify="center">
              {menuCategories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <Button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    bg={isActive ? '#C65D3A' : 'transparent'}
                    color={isActive ? 'white' : 'gray.600'}
                    borderWidth="1px"
                    borderColor={isActive ? '#C65D3A' : 'gray.200'}
                    _hover={{ bg: isActive ? '#A94B2B' : 'gray.50' }}
                    borderRadius="full"
                    px={6}
                    h="42px"
                    fontWeight="bold"
                    fontSize="xs"
                    style={{ transition: 'all 0.25s' }}
                  >
                    {cat}
                  </Button>
                );
              })}
            </Flex>
          </VStack>

          {/* Grid of cards matching layout in the Bites image */}
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={8}>
            {filteredMealsForPack.slice(0, 8).map((meal, index) => {
              return (
                <Box 
                  key={meal.menu_meal_id || index}
                  bg="white" 
                  borderRadius="3xl" 
                  p={5} 
                  borderWidth="1px" 
                  borderColor="gray.150" 
                  shadow="sm"
                  _hover={{ transform: 'translateY(-6px)', shadow: 'md' }}
                  style={{ transition: 'all 0.3s' }}
                >
                  <Flex justify="center" py={4}>
                    <Box w="140px" h="140px" borderRadius="full" overflow="hidden" shadow="sm">
                      <Box 
                        as="img"
                        src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                        alt={meal.meal_name || 'Meal Item'}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    </Box>
                  </Flex>

                  <VStack align="stretch" spaceY={2.5}>
                    <Heading as="h4" size="sm" fontWeight="900" color="black" lineClamp={1}>
                      {meal.meal_name}
                    </Heading>

                    <HStack spaceX={1}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={11} fill="#C65D3A" color="#C65D3A" />
                      ))}
                    </HStack>

                    <Text color="gray.500" fontSize="11px" lineClamp={2} minH="32px">
                      {meal.description || 'Pre-order this delicious batch meal cooked fresh under premium local standards.'}
                    </Text>

                    <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="gray.100">
                      <Text fontSize="md" fontWeight="950" color="#C65D3A">
                        ₦{meal.unit_price?.toLocaleString() || '2,000'}
                      </Text>

                      <Button 
                        onClick={onViewMenu}
                        variant="outline"
                        borderColor="#C65D3A"
                        color="#C65D3A"
                        _hover={{ bg: '#C65D3A', color: 'white' }}
                        size="xs"
                        borderRadius="full"
                        h="34px"
                        px={4}
                        fontWeight="bold"
                        fontSize="10px"
                      >
                        Add To Cart
                      </Button>
                    </Flex>
                  </VStack>
                </Box>
              )
            })}
          </Grid>

          {filteredMealsForPack.length === 0 && (
            <Flex py={12} justify="center" align="center" direction="column">
              <Text fontSize="sm" color="gray.500" mb={4}>No meals under this category are listed on this cycles active schedule.</Text>
              <Button size="sm" bg="#C65D3A" color="white" onClick={() => setActiveCategory('All')}>View All Items</Button>
            </Flex>
          )}

          <Flex justify="center" mt={12}>
            <Button 
              onClick={onViewMenu}
              variant="outline" 
              borderColor="black"
              color="black" 
              _hover={{ bg: 'gray.50' }} 
              size="md" 
              fontWeight="black" 
              borderRadius="full" 
              px={8}
            >
              Order Regular Menu Pack
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* 6. DINNER PLAN / RESERVE YOUR TABLE BANNER */}
      <Box py={20} bg="#FFFBF7">
        <Container maxW="90%">
          <Box 
            bg="white" 
            borderRadius="3xl" 
            p={{ base: 8, md: 16 }} 
            borderWidth="1px" 
            borderColor="gray.150" 
            shadow="xl"
            position="relative"
            overflow="hidden"
          >
            {/* Soft decorative background circles imitating the banner in picture */}
            <Box 
              position="absolute"
              w="350px"
              h="350px"
              bg="rgba(198, 93, 58, 0.04)"
              borderRadius="full"
              right="-10%"
              top="-10%"
              zIndex={0}
            />

            <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={12} alignItems="center" position="relative" zIndex={1}>
              <VStack align="flex-start" spaceY={5}>
                <Heading as="h2" size="2xl" fontWeight="950" color="black" letterSpacing="-0.03em" lineHeight="1.15">
                  Planning a Special Event?<br />
                  Let JDH Kitchen Handle the Food
                </Heading>
                <Text fontSize="sm" color="gray.500" maxW="xl" lineHeight="relaxed">
                  Whether it's a birthday celebration, departmental meeting, fellowship, hostel get-together, or student association event, JDH Kitchen provides freshly prepared meals in bulk to make your event memorable.
                </Text>
                
                <Button 
                  onClick={() => onViewCatering ? onViewCatering() : onViewMenu()}
                  bg="#C65D3A" 
                  color="white" 
                  _hover={{ bg: '#A94B2B' }} 
                  size="lg" 
                  fontWeight="black" 
                  borderRadius="full" 
                  px={10}
                  h="56px"
                >
                  Make Reservation
                </Button>
              </VStack>

              {/* Right Side: Elegant rounded card frame matching banner in design */}
              <Flex justify="center">
                <Box 
                  w={{ base: '240px', sm: '280px', md: '360px' }} 
                  h={{ base: '240px', sm: '280px', md: '360px' }} 
                  borderRadius="3xl" 
                  bg="white" 
                  p={3.5}
                  boxShadow="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Box 
                    as="img"
                    src="https://lgkljlcnqcwqoauymlyi.supabase.co/storage/v1/object/public/public-images/second_img.png"
                    alt="JDH Kitchen Special Event Catering"
                    w="full"
                    h="full"
                    objectFit="cover"
                    borderRadius="2xl"
                    referrerPolicy="no-referrer"
                  />
                </Box>
              </Flex>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* 7. CUSTOMER TESTIMONIALS / WHAT OUR CUSTOMER SAYS */}
      <Box py={20} bg="white" borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100">
        <Container maxW="90%">
          <Flex justify="space-between" align="center" mb={12} flexWrap="wrap" gap={4}>
            <VStack align="flex-start" spaceY={1}>
              <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="#C65D3A" textTransform="uppercase">
                Verified Diner Reviews
              </Text>
              <Heading as="h2" size="xl" fontWeight="950" color="black" letterSpacing="-0.02em">
                What Our Customers Say?
              </Heading>
            </VStack>

            <HStack spaceX={3} align="center">
              <Button
                variant="outline"
                size="sm"
                bg="white"
                color="#C65D3A"
                borderColor="#C65D3A"
                fontWeight="extrabold"
                _hover={{ bg: 'rgba(198, 93, 58, 0.05)' }}
                borderRadius="full"
                onClick={() => {
                  setShowReviewForm(true);
                  setReviewSuccess(null);
                  setReviewError(null);
                  setReviewName('');
                  setReviewRole('');
                  setReviewText('');
                  setReviewImageFile(null);
                  setReviewImagePreview(null);
                }}
                as="a"
                href="#add-review-section"
              >
                + Write a Review
              </Button>
              <HStack spaceX={2.5}>
                <Button 
                  onClick={() => setReviewStartIndex(prev => Math.max(0, prev - 1))}
                  disabled={reviewStartIndex === 0}
                  variant="outline" 
                  borderColor="gray.200" 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  p={0}
                  _hover={{ bg: 'gray.50' }}
                  _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button 
                  onClick={() => setReviewStartIndex(prev => Math.min(Math.max(0, reviews.length - 3), prev + 1))}
                  disabled={reviewStartIndex >= Math.max(0, reviews.length - 3)}
                  bg="#C65D3A" 
                  color="white" 
                  _hover={{ bg: '#A94B2B' }} 
                  borderRadius="full" 
                  w="50px" 
                  h="50px" 
                  p={0}
                  _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
                >
                  <ChevronRight size={20} />
                </Button>
              </HStack>
            </HStack>
          </Flex>

          {loadingReviews ? (
            <Flex justify="center" align="center" py={12}>
              <Text fontSize="sm" color="gray.500" fontWeight="bold">Loading dining stories...</Text>
            </Flex>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8} mb={16}>
              {reviews.slice(reviewStartIndex, reviewStartIndex + 3).map((test) => {
                return (
                  <Box 
                    key={test.id}
                    bg="#FFFBF7" 
                    p={8} 
                    borderRadius="3xl" 
                    borderWidth="1px" 
                    borderColor="gray.150" 
                    shadow="sm"
                    position="relative"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    minH="260px"
                    _hover={{ shadow: 'md' }}
                    style={{ transition: 'all 0.3s' }}
                  >
                    <VStack align="flex-start" spaceY={5} w="full">
                      <HStack spaceX={1}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < test.stars ? "#C65D3A" : "transparent"} 
                            color="#C65D3A" 
                          />
                        ))}
                      </HStack>

                      <Text fontSize="sm" color="gray.700" italic lineHeight="relaxed">
                        "{test.text}"
                      </Text>
                    </VStack>

                    <HStack spaceX={3.5} pt={6} borderTopWidth="1px" borderColor="gray.100" mt={4} w="full">
                      <Box w="46px" h="46px" borderRadius="full" overflow="hidden" shadow="sm">
                        <Box as="img" src={test.image} w="full" h="full" objectFit="cover" referrerPolicy="no-referrer" />
                      </Box>
                      <VStack align="flex-start" spaceY={0}>
                        <Text fontSize="sm" fontWeight="black" color="black">
                          {test.name}
                        </Text>
                        <Text fontSize="11px" color="gray.500">
                          {test.role}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )
              })}
            </Grid>
          )}

          {/* Form container: Write Your Review */}
          {showReviewForm && (
            <Box id="add-review-section" bg="#FFFBF7" borderRadius="3xl" borderWidth="1.5px" borderColor="#EFEBE4" p={{ base: 6, md: 10 }} mt={10}>
              <Grid templateColumns={{ base: '1fr', lg: '0.8fr 1.2fr' }} gap={10}>
                <VStack align="flex-start" spaceY={4} w="full">
                  <Flex justify="space-between" align="center" w="full">
                    <Badge bg="rgba(198, 93, 58, 0.08)" color="#C65D3A" px={3} py={1} borderRadius="full" fontSize="10px" fontWeight="black">
                      🎙️ VOICE YOUR DINING JOURNEY
                    </Badge>
                    <Button
                      onClick={() => setShowReviewForm(false)}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "red.500", bg: "red.50" }}
                      borderRadius="full"
                      size="sm"
                      p={1.5}
                      aria-label="Close form"
                    >
                      <X size={18} />
                    </Button>
                  </Flex>
                  <Heading as="h3" size="md" fontWeight="950" color="black">
                    Tell Us Your Taste Story
                  </Heading>
                  <Text fontSize="xs" color="gray.600" lineHeight="relaxed">
                    Did the smoky Party Jollof hit the spot? Or was the fisherman soup exactly like home? Put it in writing to help the kitchen refine aggregate university batch cooks. Your feedback drives our weekly menu tweaks!
                  </Text>
                  
                  <Box borderLeftWidth="3px" borderColor="#C65D3A" pl={4} py={1}>
                    <Text fontSize="xs" fontWeight="bold" italic color="#C65D3A">
                      "We match campus demand with authentic culinary execution."
                    </Text>
                  </Box>
                </VStack>

              <form onSubmit={submitReviewHandler} style={{ width: '100%' }}>
                <VStack align="stretch" spaceY={4}>
                  {reviewSuccess && (
                    <Box bg="green.50" borderWidth="1px" borderColor="green.200" color="green.800" px={4} py={3.5} borderRadius="2xl" fontSize="xs" fontWeight="bold" shadow="xs">
                      🎉 {reviewSuccess}
                    </Box>
                  )}

                  {reviewError && (
                    <Box bg="red.50" borderWidth="1px" borderColor="red.200" color="red.800" px={4} py={3.5} borderRadius="2xl" fontSize="xs" fontWeight="bold" shadow="xs">
                      ⚠️ {reviewError}
                    </Box>
                  )}

                  <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Full Name *</Text>
                      <Input
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Amara Okafor"
                        bg="white"
                        borderColor="gray.200"
                        borderRadius="xl"
                        size="md"
                        fontSize="xs"
                        fontWeight="bold"
                        height="44px"
                        disabled={submittingReview}
                      />
                    </VStack>

                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Role / Campus Hostel *</Text>
                      <Input
                        value={reviewRole}
                        onChange={(e) => setReviewRole(e.target.value)}
                        placeholder="e.g. Moremi Hall • Law Student"
                        bg="white"
                        borderColor="gray.200"
                        borderRadius="xl"
                        size="md"
                        fontSize="xs"
                        fontWeight="bold"
                        height="44px"
                        disabled={submittingReview}
                      />
                    </VStack>
                  </Grid>

                  <VStack align="flex-start" spaceY={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Overall Taste Rating</Text>
                    <HStack spaceX={2}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          onClick={() => setReviewStars(star)}
                          variant="ghost"
                          p={0.5}
                          m={0}
                          width="28px"
                          height="28px"
                          minWidth="auto"
                          _hover={{ transform: 'scale(1.15)', bg: 'transparent' }}
                          style={{ transition: 'transform 0.1s' }}
                          disabled={submittingReview}
                        >
                          <Star
                            size={22}
                            fill={star <= reviewStars ? "#C65D3A" : "transparent"}
                            color="#C65D3A"
                          />
                        </Button>
                      ))}
                      <Text fontSize="xs" fontWeight="black" color="gray.500" pl={2}>
                        {reviewStars} out of 5 Stars
                      </Text>
                    </HStack>
                  </VStack>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Review *</Text>
                    <Box
                      as="textarea"
                      value={reviewText}
                      onChange={(e: any) => setReviewText(e.target.value)}
                      placeholder="Tell us everything about the flavour profiles, the delivery timings, and why you love pre-ordering..."
                      w="full"
                      h="100px"
                      p={3}
                      bg="white"
                      borderColor="gray.200"
                      borderWidth="1px"
                      borderRadius="2xl"
                      fontSize="xs"
                      _focus={{ borderColor: '#6B8E23', outline: 'none' }}
                      disabled={submittingReview}
                    />
                  </VStack>

                  <VStack align="flex-start" spaceY={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Profile Avatar / Photo (Optional)</Text>
                    <Flex direction={{ base: 'column', sm: 'row' }} gap={4} width="100%">
                      <Box flex="1" bg="white" borderStyle="dashed" borderWidth="2px" borderColor="gray.300" borderRadius="2xl" p={4} textAlign="center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReviewImageChange}
                          id="review-avatar-input"
                          style={{ display: 'none' }}
                          disabled={submittingReview}
                        />
                        <label htmlFor="review-avatar-input" style={{ cursor: submittingReview ? 'not-allowed' : 'pointer', width: '100%', display: 'block' }}>
                          <VStack align="center" spaceY={1}>
                            <Camera size={20} color="#C65D3A" />
                            <Text fontSize="11px" fontWeight="bold" color="gray.700">
                              {reviewImageFile ? 'Change Profile Image' : 'Click to Upload Avatar Photo'}
                            </Text>
                            <Text fontSize="9px" color="gray.400">
                              PNG, JPG, or WEBP up to 5MB
                            </Text>
                          </VStack>
                        </label>
                      </Box>

                      {reviewImagePreview && (
                        <VStack justify="center" align="center" bg="white" px={5} py={2} borderRadius="2xl" borderWidth="1px" borderColor="gray.150" h="auto">
                          <Box w="60px" h="60px" borderRadius="full" overflow="hidden" shadow="sm">
                            <Box as="img" src={reviewImagePreview} w="full" h="full" objectFit="cover" />
                          </Box>
                          <Text fontSize="9px" fontWeight="bold" color="#C65D3A" mt={1}>Avatar Selected</Text>
                        </VStack>
                      )}
                    </Flex>
                  </VStack>

                  <Flex gap={4} width="100%" direction={{ base: 'column', sm: 'row' }}>
                    <Button
                      onClick={() => setShowReviewForm(false)}
                      variant="outline"
                      borderColor="gray.200"
                      color="gray.600"
                      _hover={{ bg: 'gray.50' }}
                      size="lg"
                      borderRadius="full"
                      fontWeight="black"
                      h="50px"
                      fontSize="xs"
                      flex="1"
                      disabled={submittingReview}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      bg="#C65D3A"
                      color="white"
                      _hover={{ bg: '#A94B2B' }}
                      size="lg"
                      borderRadius="full"
                      fontWeight="black"
                      h="50px"
                      fontSize="xs"
                      shadow="sm"
                      loadingText="Saving Review..."
                      isLoading={submittingReview}
                      flex="2"
                    >
                      Submit Review & Publish Live
                    </Button>
                  </Flex>
                </VStack>
              </form>
            </Grid>
          </Box>
          )}
        </Container>
      </Box>

      {/* 9. GUEST PRE-ORDER TRACKING ENGINE */}
      <Box py={16} bg="white" borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100">
        <Container maxW="90%">
          <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={16} alignItems="center">
            
            <VStack align="flex-start" spaceY={5}>
              <Badge bg="rgba(198, 93, 58, 0.08)" color="#C65D3A" px={3.5} py={1.5} borderRadius="full" fontSize="11px" fontWeight="black">
                🔍 DYNAMIC TRACKING PORTAL
              </Badge>
              <Heading as="h2" size="2xl" fontWeight="950" color="black" letterSpacing="-0.03em" lineHeight="1.15">
                Track Your Pre-Orders<br />
                Real-time Status Check
              </Heading>
              <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                We design campus food co-operatives with transparent manual auditing. You do not need to register an account! Simply enter your Pickup Code or phone number to view payment verification, threshold progress, and pickup windows.
              </Text>

              {/* Features list */}
              <VStack spaceY={3} align="flex-start" pt={2}>
                <HStack spaceX={3}>
                  <Box p={1} bg="rgba(107, 142, 35, 0.1)" borderRadius="full" color="#6B8E23" display="flex" alignItems="center" justifyContent="center">
                    <Check size={14} strokeWidth={3} />
                  </Box>
                  <Text fontSize="sm" fontWeight="bold">Direct manual transfer receipt pair tracking</Text>
                </HStack>
                <HStack spaceX={3}>
                  <Box p={1} bg="rgba(107, 142, 35, 0.1)" borderRadius="full" color="#6B8E23" display="flex" alignItems="center" justifyContent="center">
                    <Check size={14} strokeWidth={3} />
                  </Box>
                  <Text fontSize="sm" fontWeight="bold">Transparent weekly goal pooling indicators</Text>
                </HStack>
                <HStack spaceX={3}>
                  <Box p={1} bg="rgba(107, 142, 35, 0.1)" borderRadius="full" color="#6B8E23" display="flex" alignItems="center" justifyContent="center">
                    <Check size={14} strokeWidth={3} />
                  </Box>
                  <Text fontSize="sm" fontWeight="bold">Pickup code collection system details</Text>
                </HStack>
              </VStack>
            </VStack>

            {/* Access Tracking Form Box */}
            <Box 
              bg="#FFFBF7" 
              p={8} 
              borderRadius="3xl" 
              borderWidth="1px" 
              borderColor="#FFEFE0" 
              shadow="xl"
              w="full"
              maxW="480px"
              mx="auto"
            >
              <VStack spaceY={5} align="stretch">
                <HStack spaceX={3}>
                  <Box p={2.5} borderRadius="2xl" bg="white" borderWidth="1px" borderColor="gray.150" shadow="sm">
                    <Search size={22} color="#C65D3A" />
                  </Box>
                  <VStack align="flex-start" spaceY={0}>
                    <Heading as="h3" size="sm" fontWeight="900" color="black">
                      Pre-Order Tracking Desk
                    </Heading>
                    <Text fontSize="11px" color="gray.500">
                      Lookup status using Code or Phone
                    </Text>
                  </VStack>
                </HStack>

                <VStack spaceY={4} align="stretch" py={2}>
                  <Box bg="white" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                    <Text fontSize="xs" color="gray.600" lineHeight="relaxed">
                      Enter your 5-digit phone digits or pre-order Pickup Code (e.g., <strong>RC-12345</strong>) below to inspect receipt check status.
                    </Text>
                  </Box>

                  <Button 
                    onClick={onViewTracking} 
                    bg="#C65D3A" 
                    color="white" 
                    _hover={{ bg: '#A94B2B' }} 
                    size="lg" 
                    borderRadius="full" 
                    fontWeight="black" 
                    h="48px"
                    w="full"
                  >
                    Launch Tracking Portal
                  </Button>
                </VStack>
              </VStack>
            </Box>

          </Grid>
        </Container>
      </Box>

      {/* 10. MOBILE APP BANNER SECTION CONVERTED TO PREMIUM PWA INSTALLER */}
      <Box py={20} bg="#FFFBF7">
        <Container maxW="90%">
          <Box 
            bg="white" 
            borderRadius="3xl" 
            p={{ base: 8, md: 16 }} 
            borderWidth="1px" 
            borderColor="gray.150" 
            shadow="xl"
            position="relative"
            overflow="hidden"
          >
            <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={12} alignItems="center">
              
              <VStack align="flex-start" spaceY={6}>
                <Badge bg="rgba(198, 93, 58, 0.08)" color="#C65D3A" px={3} py={1} borderRadius="full" fontSize="10px" fontWeight="black" textTransform="uppercase" letterSpacing="wider">
                  ⚡ INSTANT PWA APP
                </Badge>
                <Heading as="h2" size="2xl" fontWeight="950" color="black" letterSpacing="-0.03em" lineHeight="1.15">
                  Install JDH Kitchen<br />
                  Directly From Your Browser<br />
                  Enjoy Instant Loading
                </Heading>
                <Text fontSize="sm" color="gray.500" maxW="xl" lineHeight="relaxed">
                  Enjoy single-tap home screen access, faster loading speeds, and real-time order pool tracking completely from the browser. No app store clutter—pure instant convenience!
                </Text>

                <VStack align="stretch" spaceY={4} w="full">
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                    How to Add to Home Screen:
                  </Text>
                  <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4} w="full">
                    {/* iOS instructions */}
                    <Box bg="#FAFAF7" p={4} borderRadius="2xl" borderWidth="1.5px" borderColor="#EFEBE4">
                      <HStack spaceX={2.5} align="flex-start">
                        <Text fontSize="lg">📱</Text>
                        <VStack align="flex-start" spaceY={1}>
                          <Text fontSize="xs" fontWeight="black" color="black">iPhone & iPad</Text>
                          <Text fontSize="10px" color="gray.500" lineHeight="tall">
                            Tap the <b>Share</b> icon <span style={{fontSize: '12px'}}>⎋</span> at the bottom of Safari, scroll down, and select <b>Add to Home Screen</b>.
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Android instructions */}
                    <Box bg="#FAFAF7" p={4} borderRadius="2xl" borderWidth="1.5px" borderColor="#EFEBE4">
                      <HStack spaceX={2.5} align="flex-start">
                        <Text fontSize="lg">🤖</Text>
                        <VStack align="flex-start" spaceY={1}>
                          <Text fontSize="xs" fontWeight="black" color="black">Android & Chrome</Text>
                          <Text fontSize="10px" color="gray.500" lineHeight="tall">
                            Tap the <b>three dots menu</b> <span style={{fontSize: '12px'}}>⋮</span> at the top-right of Chrome, and select <b>Install</b> or <b>Add to Home Screen</b>.
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </Grid>
                </VStack>

                {pwaPromptEvent && (
                  <Button
                    onClick={triggerPwaInstall}
                    bg="#C65D3A"
                    color="white"
                    _hover={{ bg: '#A94B2B' }}
                    size="lg"
                    borderRadius="full"
                    fontWeight="black"
                    px={8}
                    h="52px"
                    fontSize="xs"
                    shadow="md"
                    mt={4}
                  >
                    Install Web App Now
                  </Button>
                )}
              </VStack>

              {/* Right Side: Mockup phone styling matching screenshot exactly */}
              <Flex justify="center" position="relative">
                {/* Mock Phone Wrapper */}
                <Box 
                  w="260px" 
                  h="480px" 
                  borderRadius="45px" 
                  borderWidth="12px" 
                  borderColor="black" 
                  bg="white" 
                  shadow="2xl" 
                  overflow="hidden"
                  position="relative"
                >
                  {/* Phone speaker notch */}
                  <Box 
                    position="absolute"
                    top="0"
                    left="50%"
                    transform="translateX(-50%)"
                    w="110px"
                    h="20px"
                    bg="black"
                    borderBottomRadius="14px"
                    zIndex={10}
                  />

                  {/* Phone contents mimicking screenshot screenshot */}
                  <Box p={4} pt={7} bg="#FFFBF7" h="full" overflow="auto">
                    {/* Small brand header */}
                    <Flex justify="space-between" align="center" mb={4}>
                      <HStack spaceX={1.5}>
                        <Box h="18px" display="flex" alignItems="center">
                          <Box as="img" src={jdhLogo} h="full" w="auto" objectFit="contain" />
                        </Box>
                        <Text fontSize="8px" fontWeight="black">JDH Kitchen</Text>
                      </HStack>
                      <Text fontSize="8px">🍔</Text>
                    </Flex>

                    {/* Small Hero inside phone */}
                    <VStack align="flex-start" spaceY={2} mb={4}>
                      <Heading fontSize="xs" fontWeight="950" lineHeight="1.2">
                        We Serve The Test<br />You Love 😍
                      </Heading>
                      <Text fontSize="7px" color="gray.500">
                        This is a type of restaurant which typically serves food and drinks.
                      </Text>
                      
                      <HStack spaceX={1.5}>
                        <Box bg="#C65D3A" color="white" fontSize="6px" py={1} px={2} borderRadius="full" fontWeight="bold">Explore Food</Box>
                        <Box borderWidth="1px" borderColor="black" fontSize="6px" py={1} px={2} borderRadius="full">Search</Box>
                      </HStack>
                    </VStack>

                    {/* Small plate image inside phone mockup */}
                    <Box borderRadius="2xl" overflow="hidden" h="90px" shadow="sm" mb={4}>
                      <Box as="img" src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300" w="full" h="full" objectFit="cover" />
                    </Box>

                    {/* Small layout details */}
                    <Text fontSize="8px" fontWeight="black" mb={2}>Popular Dishes</Text>
                    <Grid templateColumns="1fr 1fr" gap={2}>
                      <Box bg="white" p={2} borderRadius="xl" borderWidth="1px" borderColor="gray.100" align="center">
                        <Box w="34px" h="34px" borderRadius="full" overflow="hidden" mb={1} mx="auto">
                          <Box as="img" src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100" w="full" h="full" objectFit="cover" />
                        </Box>
                        <Text fontSize="6px" fontWeight="black">French Fries</Text>
                        <Text fontSize="5px" color="#C65D3A">₦1,500</Text>
                      </Box>

                      <Box bg="white" p={2} borderRadius="xl" borderWidth="1px" borderColor="gray.100" align="center">
                        <Box w="34px" h="34px" borderRadius="full" overflow="hidden" mb={1} mx="auto">
                          <Box as="img" src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=100" w="full" h="full" objectFit="cover" />
                        </Box>
                        <Text fontSize="6px" fontWeight="black">Shawarma</Text>
                        <Text fontSize="5px" color="#C65D3A">₦2,800</Text>
                      </Box>
                    </Grid>
                  </Box>
                </Box>
              </Flex>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* 11. FULL-FLEDGED PREMIUM FOOTER WITH COMPREHENSIVE BRAND MATCH */}
      <Box borderTopWidth="1px" borderColor="gray.150" bg="#FFFBF7" pt={16} pb={8}>
        <Container maxW="90%" px={4}>
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={10} mb={12}>
            {/* Column 1: Brand Info */}
            <VStack align="flex-start" spaceY={4}>
              <HStack spaceX={3.5} align="center">
                <Box 
                  p={2} 
                  bg="white" 
                  borderRadius="2xl" 
                  borderWidth="1.5px" 
                  borderColor="#EFEBE4" 
                  shadow="sm" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  w="54px"
                  h="54px"
                >
                  <Box
                    as="img"
                    src={jdhLogo}
                    alt="JDH Kitchen Logo"
                    h="36px"
                    w="auto"
                    objectFit="contain"
                  />
                </Box>
                <VStack align="flex-start" spaceY={0}>
                  <Heading as="h3" size="xs" fontWeight="950" letterSpacing="0.05em" color="black" textTransform="uppercase">
                    JDH KITCHEN
                  </Heading>
                  <Text fontSize="10px" fontWeight="black" color="#C65D3A" letterSpacing="widest" textTransform="uppercase">
                    CAMPUS FOOD CO-OP
                  </Text>
                </VStack>
              </HStack>
              <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                The modern student-first culinary co-operative. We gather aggregate campus pre-orders to prepare premium, chef-quality traditional dishes at unbeatable batch prices.
              </Text>

              {/* Social links with actual Lucide icons */}
              <HStack spaceX={3.5} pt={2}>
                <Box as="a" href="#" aria-label="Facebook" w="40px" h="40px" borderRadius="full" bg="white" borderWidth="1.5px" borderColor="#EFEBE4" display="flex" alignItems="center" justifyContent="center" color="gray.600" _hover={{ bg: '#C65D3A', color: 'white', borderColor: '#C65D3A', transform: 'translateY(-2px)' }} style={{ transition: 'all 0.2s' }}>
                  <Facebook size={18} strokeWidth={2} />
                </Box>
                <Box as="a" href="#" aria-label="Twitter" w="40px" h="40px" borderRadius="full" bg="white" borderWidth="1.5px" borderColor="#EFEBE4" display="flex" alignItems="center" justifyContent="center" color="gray.600" _hover={{ bg: '#C65D3A', color: 'white', borderColor: '#C65D3A', transform: 'translateY(-2px)' }} style={{ transition: 'all 0.2s' }}>
                  <Twitter size={18} strokeWidth={2} />
                </Box>
                <Box as="a" href="#" aria-label="Instagram" w="40px" h="40px" borderRadius="full" bg="white" borderWidth="1.5px" borderColor="#EFEBE4" display="flex" alignItems="center" justifyContent="center" color="gray.600" _hover={{ bg: '#C65D3A', color: 'white', borderColor: '#C65D3A', transform: 'translateY(-2px)' }} style={{ transition: 'all 0.2s' }}>
                  <Instagram size={18} strokeWidth={2} />
                </Box>
                <Box as="a" href="#" aria-label="Youtube" w="40px" h="40px" borderRadius="full" bg="white" borderWidth="1.5px" borderColor="#EFEBE4" display="flex" alignItems="center" justifyContent="center" color="gray.600" _hover={{ bg: '#C65D3A', color: 'white', borderColor: '#C65D3A', transform: 'translateY(-2px)' }} style={{ transition: 'all 0.2s' }}>
                  <Youtube size={18} strokeWidth={2} />
                </Box>
              </HStack>
            </VStack>

            {/* Column 2: Kitchen Co-op Menus */}
            <VStack align="flex-start" spaceY={3}>
              <Text fontSize="xs" fontWeight="black" color="gray.400" letterSpacing="widest" textTransform="uppercase">
                Service
              </Text>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Online Order
              </Button>
               <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewCatering || onViewMenu}>
                Pre-Reservation
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                24/7 Services
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Foodie Place
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Super Chefs
              </Button>
            </VStack>

            {/* Column 3: Logistics & Spots */}
            <VStack align="flex-start" spaceY={3}>
              <Text fontSize="xs" fontWeight="black" color="gray.400" letterSpacing="widest" textTransform="uppercase">
                Quick Links
              </Text>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Menu Pack
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Reviews
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Blogs
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewMenu}>
                Reserve Table
              </Button>
              <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={onViewTracking}>
                Order Foods
              </Button>
            </VStack>
          </Grid>

          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4} pt={8} borderTopWidth="1px" borderColor="gray.150">
            <Text fontSize="xs" color="gray.500">
              © {new Date().getFullYear()} JDH Kitchen. All Rights Reserved.
            </Text>
            <HStack spaceX={4} fontSize="xs" color="gray.500">
              <Button variant="link" size="xs" color="gray.500">Terms of Use</Button>
              <Text>•</Text>
              <Button variant="link" size="xs" color="gray.500">Privacy Policy</Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

    </Box>
  );
};

// Helper micro components matching screenshot layout elements
interface FloatingPillProps {
  label: string;
  icon: string;
}

const FloatingPill: React.FC<FloatingPillProps> = ({ label, icon }) => (
  <HStack 
    bg="white" 
    py={2.5} 
    px={4} 
    borderRadius="full" 
    boxShadow="md" 
    borderWidth="1px" 
    borderColor="gray.100" 
    spaceX={2.5}
    _hover={{ transform: 'translateX(4px)' }}
    style={{ transition: 'transform 0.2s' }}
  >
    <Box fontSize="sm">{icon}</Box>
    <Text fontSize="xs" fontWeight="black" color="black" pr={1}>{label}</Text>
  </HStack>
);

interface ServiceBulletProps {
  icon: string;
  title: string;
  desc: string;
}

const ServiceBullet: React.FC<ServiceBulletProps> = ({ icon, title, desc }) => (
  <HStack spaceX={3.5} align="flex-start">
    <Box p={2.5} bg="white" borderRadius="full" shadow="sm" borderWidth="1px" borderColor="gray.150" fontSize="lg">
      {icon}
    </Box>
    <VStack align="flex-start" spaceY={0}>
      <Text fontSize="sm" fontWeight="black" color="black">{title}</Text>
      <Text fontSize="11px" color="gray.500" lineHeight="tall">{desc}</Text>
    </VStack>
  </HStack>
);
