/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
} from '@chakra-ui/react';
import { X, ShoppingBag, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuMealProgress } from '../services/menus';

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'opt-plantain', name: 'Plantain (Per Portion)', price: 300 },
  { id: 'opt-sausage', name: 'Sausage', price: 450 },
  { id: 'opt-gizzard', name: 'Gizzard', price: 300 },
  { id: 'opt-beef', name: 'Beef', price: 600 },
  { id: 'opt-egg', name: 'Egg (boiled)', price: 300 },
  { id: 'opt-hake-big', name: 'Hake Fish big', price: 1700 },
  { id: 'opt-chicken-gourmet', name: 'Peppered Chicken (Gourmet)', price: 3500 },
  { id: 'opt-turkey-medium', name: 'Peppered Medium Turkey', price: 3300 },
  { id: 'opt-turkey-big', name: 'Peppered Big Turkey', price: 5300 },
  { id: 'opt-chicken-regular', name: 'Peppered Chicken', price: 1500 },
  { id: 'opt-hake-mini', name: 'Hake fish mini', price: 1000 },
];

interface CustomizeModalProps {
  meal: MenuMealProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    meal: MenuMealProgress,
    quantity: number,
    selectedExtras: ExtraOption[],
    customPortionPrice: number
  ) => void;
  initialQuantity?: number;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  meal,
  isOpen,
  onClose,
  onConfirm,
  initialQuantity = 1,
}) => {
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity);
      setSelectedExtras({});
    }
  }, [isOpen, initialQuantity]);

  if (!isOpen || !meal) return null;

  const handleToggleExtra = (optionId: string) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedExtras).filter(Boolean).length;
  };

  const activeExtras = EXTRA_OPTIONS.filter((opt) => selectedExtras[opt.id]);
  const extrasTotal = activeExtras.reduce((sum, opt) => sum + opt.price, 0);
  const basePrice = meal.unit_price || 0;
  const singlePortionPrice = basePrice + extrasTotal;
  const grandTotal = singlePortionPrice * quantity;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleConfirmAdd = () => {
    onConfirm(meal, quantity, activeExtras, singlePortionPrice);
    // Reset local state on add
    setSelectedExtras({});
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1200}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={6}
      >
        {/* Backdrop overlay */}
        <Box
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
          onClick={onClose}
        />

        {/* Modal Dialog Card */}
        <Box
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          bg="white"
          w="full"
          maxW="520px"
          borderRadius="3xl"
          shadow="2xl"
          overflow="hidden"
          position="relative"
          display="flex"
          flexDirection="column"
          maxH="85vh"
        >
          {/* Header section */}
          <Flex
            justify="space-between"
            align="center"
            px={6}
            py={4.5}
            borderBottomWidth="1px"
            borderColor="gray.100"
          >
            <VStack align="flex-start" spaceY={0.5}>
              <Heading as="h3" size="md" fontWeight="extrabold" color="black" letterSpacing="tight">
                Customize {meal.meal_name}
              </Heading>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                Select your preferred protein or extras (Optional, up to 10)
              </Text>
            </VStack>
            <Button
              variant="ghost"
              boxSize="36px"
              p={0}
              color="gray.400"
              _hover={{ bg: 'gray.100', color: 'black' }}
              borderRadius="full"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </Flex>

          {/* Body List Scroll container */}
          <Box flex="1" overflowY="auto" px={6} py={4}>
            <Heading as="h4" size="sm" fontWeight="bold" color="black" mb={3} display="flex" justify="space-between" align="center">
              <Text as="span">Extras</Text>
              {getSelectedCount() > 0 && (
                <Text as="span" fontSize="xs" fontWeight="normal" color="#C65D3A">
                  {getSelectedCount()} selected
                </Text>
              )}
            </Heading>

            {/* Extras options checkboxes */}
            <VStack align="stretch" spaceY={2.5}>
              {EXTRA_OPTIONS.map((opt) => {
                const isSelected = !!selectedExtras[opt.id];
                return (
                  <Flex
                    key={opt.id}
                    onClick={() => handleToggleExtra(opt.id)}
                    p={3.5}
                    borderRadius="2xl"
                    borderWidth="1.5px"
                    borderColor={isSelected ? '#C65D3A' : 'gray.150'}
                    bg={isSelected ? '#FFF8F5' : 'white'}
                    _hover={{ bg: isSelected ? '#FFF1EB' : 'gray.50' }}
                    cursor="pointer"
                    align="center"
                    justify="space-between"
                    transition="all 0.15s ease"
                  >
                    <HStack spaceX={3.5}>
                      {/* Styled Custom Checkbox Box */}
                      <Box
                        w="20px"
                        h="20px"
                        borderRadius="md"
                        borderWidth="2px"
                        borderColor={isSelected ? '#C65D3A' : 'gray.300'}
                        bg={isSelected ? '#C65D3A' : 'transparent'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="all 0.15s ease"
                      >
                        {isSelected && (
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="xs"
                            bg="white"
                          />
                        )}
                      </Box>

                      <Text
                        fontSize="sm"
                        fontWeight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? 'black' : 'gray.700'}
                      >
                        {opt.name}
                      </Text>
                    </HStack>

                    <Text
                      fontSize="sm"
                      fontWeight="black"
                      color={isSelected ? '#C65D3A' : 'black'}
                    >
                      +₦{opt.price.toLocaleString()}
                    </Text>
                  </Flex>
                );
              })}
            </VStack>
          </Box>

          {/* Sticky Footer Panel / Add Section */}
          <Box
            p={6}
            borderTopWidth="1px"
            borderColor="gray.100"
            bg="white"
            boxShadow="0 -4px 12px rgba(0,0,0,0.02)"
          >
            <Flex
              align="center"
              justify="space-between"
              flexWrap="wrap"
              gap={4}
            >
              {/* Quantity counter - 1 + */}
              <HStack
                borderWidth="1.5px"
                borderColor="gray.200"
                borderRadius="2xl"
                p={1}
                bg="#FAFAF7"
                spaceX={1}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  boxSize="36px"
                  p={0}
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  _disabled={{ opacity: 0.3 }}
                  borderRadius="xl"
                  color="black"
                >
                  <Minus size={14} />
                </Button>
                <Text
                  fontSize="md"
                  fontWeight="black"
                  minW="28px"
                  textAlign="center"
                  color="black"
                >
                  {quantity}
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  boxSize="36px"
                  p={0}
                  onClick={handleIncrement}
                  borderRadius="xl"
                  color="black"
                >
                  <Plus size={14} />
                </Button>
              </HStack>

              {/* Add to order action button */}
              <Button
                flex="1"
                minW="200px"
                size="lg"
                bg="black"
                _hover={{ bg: 'gray.850' }}
                color="white"
                borderRadius="2xl"
                fontWeight="black"
                onClick={handleConfirmAdd}
                fontSize="sm"
                shadow="md"
              >
                <ShoppingBag size={15} style={{ marginRight: '8px' }} />
                ADD TO ORDER • ₦{grandTotal.toLocaleString()}
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>
    </AnimatePresence>
  );
};
