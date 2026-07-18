import React from 'react';
import { Box, Container, Grid, VStack, HStack, Heading, Text, Flex, Button } from '@chakra-ui/react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import jdhLogo from '../assets/JDH_logo-trans.png';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <Box borderTopWidth="1px" borderColor="gray.150" bg="#FFFBF7" pt={16} pb={8}>
      <Container maxW={{ base: "100%", md: "90%" }} px={{ base: 3, md: 4 }}>
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={{ base: 8, md: 10 }} mb={12}>
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
            <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={() => onNavigate('menu-list')}>
              Online Order
            </Button>
            <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={() => onNavigate('catering')}>
              Pre-Reservation
            </Button>
          </VStack>

          {/* Column 3: Logistics & Spots */}
          <VStack align="flex-start" spaceY={3}>
            <Text fontSize="xs" fontWeight="black" color="gray.400" letterSpacing="widest" textTransform="uppercase">
              Quick Links
            </Text>
            <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={() => onNavigate('menu-list')}>
              Menu Pack
            </Button>
            <Button variant="link" size="sm" color="gray.600" _hover={{ color: 'black' }} onClick={() => onNavigate('order-tracking')}>
              Order Tracking
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
  );
};
