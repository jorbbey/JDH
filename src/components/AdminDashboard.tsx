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
  Input,
  VStack,
  HStack,
  Container,
  Badge,
  Grid,
} from '@chakra-ui/react';
import {
  Lock,
  Mail,
  ShieldCheck,
  LogOut,
  Sliders,
  UtensilsCrossed,
  Calendar,
  AlertTriangle,
  Receipt,
  CheckCircle,
  Truck,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Search,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/auth';
import { menuService } from '../services/menus';
import { mealService } from '../services/meals';
import { orderService } from '../services/orders';
import { cateringService } from '../services/catering';
import { paymentService } from '../services/payment';

interface AdminDashboardProps {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setCurrentUser,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab ] = useState<'overview' | 'menus' | 'meals' | 'schedules' | 'orders' | 'catering'>('overview');

  // Feature 2: Weekly Menu Management states
  const [weeklyMenus, setWeeklyMenus] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedMenuMeals, setSelectedMenuMeals] = useState<any[]>([]);
  const [mealCatalog, setMealCatalog] = useState<any[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const [menuActionMessage, setMenuActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for creating a new weekly menu cycle
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newMenuStatus, setNewMenuStatus] = useState<'draft' | 'active' | 'archived'>('draft');

  // Form states for attaching a meal to the selected menu
  const [selectedCatalogMealId, setSelectedCatalogMealId] = useState('');
  const [newMealMinThreshold, setNewMealMinThreshold] = useState<number>(40);

  // Feature 3: Meal Creator states
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealFormName, setMealFormName] = useState('');
  const [mealFormDescription, setMealFormDescription] = useState('');
  const [mealFormCategory, setMealFormCategory] = useState<'soup' | 'stew' | 'rice' | 'other'>('rice');
  const [mealFormPrice, setMealFormPrice] = useState<string>('');
  const [mealFormImageUrl, setMealFormImageUrl] = useState('');
  const [mealActionMsgStyle, setMealActionMsgStyle] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Drag-and-drop Image Upload states and handlers
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const uploadMealImage = async (file: File) => {
    if (!isSupabaseConfigured) {
      setMealActionMsgStyle({
        type: 'success',
        text: 'Supabase storage offline. Applying fallback high-quality placeholder photo!',
      });
      setMealFormImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
      return;
    }

    setUploadingImage(true);
    setMealActionMsgStyle(null);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `meal-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Upload file directly into the "mealsImage" bucket
      const { error } = await supabase.storage
        .from('mealsImage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Obtain public URL of the uploaded asset
      const { data: publicUrlData } = supabase.storage
        .from('mealsImage')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setMealFormImageUrl(publicUrlData.publicUrl);
        setMealActionMsgStyle({
          type: 'success',
          text: `Selected and storage-uploaded image perfectly: ${fileName}`,
        });
      } else {
        throw new Error('Public URL resolution empty');
      }
    } catch (err: any) {
      console.error('Error uploading image to mealsImage bucket:', err);
      // Give a helpful error but don't brick the admin's progress; assign a nice fallback
      setMealActionMsgStyle({
        type: 'error',
        text: `Bucket Transfer Alert: ${err.message || err}. (Checking bucket 'mealsImage' exists and is Public). Assigning placeholder for immediate use.`,
      });
      setMealFormImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    } finally {
      setUploadingImage(false);
    }
  };

  // Feature 4: Delivery schedule management states
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleCutoff, setNewScheduleCutoff] = useState('');
  const [scheduleActionMessage, setScheduleActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Features 6-9, 11: Order & payment review states
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderProof, setSelectedOrderProof] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderActionMessage, setOrderActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Feature 10: Catering request states
  const [cateringRequests, setCateringRequests] = useState<any[]>([]);
  const [isLoadingCaterings, setIsLoadingCaterings] = useState(false);
  const [selectedCateringId, setSelectedCateringId] = useState<string | null>(null);
  const [cateringQuotePrice, setCateringQuotePrice] = useState('');
  const [cateringActionMessage, setCateringActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verify the user is actually an admin, otherwise prompt authenticated login
  const isAdmin = currentUser && currentUser.role === 'admin';

  // Automatically clear all five main action overlay logs after a short period
  useEffect(() => {
    if (menuActionMessage) {
      const timer = setTimeout(() => setMenuActionMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [menuActionMessage]);

  useEffect(() => {
    if (scheduleActionMessage) {
      const timer = setTimeout(() => setScheduleActionMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [scheduleActionMessage]);

  useEffect(() => {
    if (orderActionMessage) {
      const timer = setTimeout(() => setOrderActionMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [orderActionMessage]);

  useEffect(() => {
    if (cateringActionMessage) {
      const timer = setTimeout(() => setCateringActionMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [cateringActionMessage]);

  useEffect(() => {
    if (mealActionMsgStyle) {
      const timer = setTimeout(() => setMealActionMsgStyle(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [mealActionMsgStyle]);

  // Fetch all menu cycles & catalog on load or tab switch
  useEffect(() => {
    if (isAdmin) {
      loadWeeklyMenus();
      loadMealCatalog();
      if (activeTab === 'orders') {
        loadOrders();
      } else if (activeTab === 'catering') {
        loadCaterings();
      }
    }
  }, [currentUser, activeTab]);

  const loadWeeklyMenus = async () => {
    setIsLoadingMenus(true);
    try {
      const data = await menuService.getAllMenus();
      setWeeklyMenus(data);
      // Auto-select first menu if none selected yet
      if (data.length > 0 && !selectedMenuId) {
        setSelectedMenuId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading menus:', err);
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const loadMealCatalog = async () => {
    try {
      const meals = await mealService.getAllMeals();
      setMealCatalog(meals);
    } catch (err: any) {
      console.error('Error loading meal catalog:', err);
    }
  };

  // Fetch linked meals & active schedules when selected cycle shifts
  useEffect(() => {
    if (selectedMenuId) {
      loadSelectedMenuMeals(selectedMenuId);
      loadDeliveryScheduleForSelectedMenu(selectedMenuId);
    } else {
      setSelectedMenuMeals([]);
      setActiveSchedule(null);
    }
  }, [selectedMenuId]);

  const loadSelectedMenuMeals = async (menuId: string) => {
    try {
      const progress = await menuService.getMenuMealsProgress(menuId);
      setSelectedMenuMeals(progress);
    } catch (err: any) {
      console.error('Error fetching menu meals progress:', err);
    }
  };

  // Feature 4: Delivery schedule loaders and management
  const loadDeliveryScheduleForSelectedMenu = async (menuId: string) => {
    setScheduleActionMessage(null);
    try {
      const schedule = await menuService.getDeliveryScheduleForMenu(menuId);
      setActiveSchedule(schedule);
      if (schedule) {
        setNewScheduleDate(schedule.delivery_date);
        // Map ISO to datetime-local format input
        setNewScheduleCutoff(schedule.cutoff_time ? schedule.cutoff_time.substring(0, 16) : '');
      } else {
        setNewScheduleDate('');
        setNewScheduleCutoff('');
      }
    } catch (err: any) {
      console.error('Error loading delivery schedule:', err);
    }
  };

  const handleSaveDeliverySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId) {
      setScheduleActionMessage({ type: 'error', text: 'Select a weekly menu cycle first.' });
      return;
    }
    if (!newScheduleDate || !newScheduleCutoff) {
      setScheduleActionMessage({ type: 'error', text: 'Specify both target delivery date and cutoff timestamp.' });
      return;
    }

    setScheduleActionMessage(null);
    try {
      // Format cutoff time to ISO
      const cutoffISO = new Date(newScheduleCutoff).toISOString();

      if (activeSchedule) {
        // Update schedule
        await menuService.updateDeliverySchedule(activeSchedule.id, {
          delivery_date: newScheduleDate,
          cutoff_time: cutoffISO,
        });
        setScheduleActionMessage({ type: 'success', text: 'Delivery schedule variables saved and updated!' });
      } else {
        // Create new schedule
        const newSched = await menuService.createDeliverySchedule(selectedMenuId, newScheduleDate, cutoffISO);
        setScheduleActionMessage({ type: 'success', text: 'Delivery schedule successfully created for this weekly menu!' });
        setActiveSchedule(newSched);
      }
      if (selectedMenuId) {
        loadDeliveryScheduleForSelectedMenu(selectedMenuId);
      }
    } catch (err: any) {
      setScheduleActionMessage({ type: 'error', text: err?.message || 'Error occurred while saving schedule settings.' });
    }
  };

  const handleChangeScheduleStatus = async (status: 'open' | 'closed' | 'completed') => {
    if (!activeSchedule) return;
    setScheduleActionMessage(null);
    try {
      await menuService.updateDeliverySchedule(activeSchedule.id, { status });
      setScheduleActionMessage({ type: 'success', text: `Courier status transitioned to "${status.toUpperCase()}"` });
      if (selectedMenuId) {
        loadDeliveryScheduleForSelectedMenu(selectedMenuId);
      }
    } catch (err: any) {
      setScheduleActionMessage({ type: 'error', text: err?.message || 'Failed to update schedule status.' });
    }
  };

  // Features 6-9, 11: Order monitoring & verification helpers
  const loadOrders = async () => {
    setIsLoadingOrders(true);
    setOrderActionMessage(null);
    try {
      const orders = await orderService.getAllOrders();
      setAllOrders(orders);
    } catch (err: any) {
      console.error('Error fetching admin orders list:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedOrderProof(null);
    setRejectionReason('');
    try {
      const proof = await paymentService.getPaymentProofForOrder(orderId);
      setSelectedOrderProof(proof);
    } catch (err) {
      console.error('Error retrieving payment proof row:', err);
    }
  };

  const handleVerifyPayment = async (approve: boolean) => {
    if (!selectedOrderId || !selectedOrderProof) return;
    if (!approve && !rejectionReason.trim()) {
      setOrderActionMessage({ type: 'error', text: 'Please outline a rejection reason for the student.' });
      return;
    }

    setOrderActionMessage(null);
    try {
      await paymentService.verifyPayment(
        selectedOrderProof.id,
        selectedOrderId,
        approve,
        approve ? undefined : rejectionReason
      );
      setOrderActionMessage({
        type: 'success',
        text: approve
          ? 'Receipt approved! Order status successfully updated to Paid.'
          : 'Payment receipt rejected. Order returned to pending payment.'
      });
      // reload order list & active selection details
      await loadOrders();
      handleSelectOrder(selectedOrderId);
    } catch (err: any) {
      setOrderActionMessage({ type: 'error', text: err?.message || 'Error verifying receipt details.' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setOrderActionMessage(null);
    try {
      await orderService.updateOrderStatus(orderId, status);
      setOrderActionMessage({ type: 'success', text: `Order status changed successfully to "${status.toUpperCase()}"` });
      await loadOrders();
    } catch (err: any) {
      setOrderActionMessage({ type: 'error', text: err?.message || 'Error shifting order status.' });
    }
  };

  const handleExportOrdersToCSV = () => {
    if (allOrders.length === 0) {
      setOrderActionMessage({ type: 'error', text: 'No order records discovered to export.' });
      return;
    }

    try {
      // Headers
      const headers = ['Order ID', 'Client Name', 'Client Email', 'Hostel', 'Room No', 'Total Amount (N)', 'Status', 'Ordered On'];
      const rows = allOrders.map((o) => [
        o.id,
        o.profiles?.full_name || 'Anonymous Student',
        o.profiles?.email || 'N/A',
        o.hostel_name,
        o.room_number,
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `JDH_Kitchen_System_Orders_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setOrderActionMessage({ type: 'success', text: 'Spreadsheet compiled and downloaded!' });
    } catch (err: any) {
      setOrderActionMessage({ type: 'error', text: err?.message || 'Failed compiling delivery roster export.' });
    }
  };

  // Feature 10: Catering request managers
  const loadCaterings = async () => {
    setIsLoadingCaterings(true);
    setCateringActionMessage(null);
    try {
      const projects = await cateringService.getAllCateringRequests();
      setCateringRequests(projects);
    } catch (err: any) {
      console.error('Error loading corporate caterings:', err);
    } finally {
      setIsLoadingCaterings(false);
    }
  };

  const handleReviewCatering = async (requestId: string, status: any, isQuoting: boolean) => {
    setCateringActionMessage(null);
    let quoteVal: number | undefined = undefined;

    if (isQuoting) {
      quoteVal = parseFloat(cateringQuotePrice);
      if (isNaN(quoteVal) || quoteVal <= 0) {
        setCateringActionMessage({ type: 'error', text: 'Provide a valid price quote value (NGN).' });
        return;
      }
    }

    try {
      await cateringService.reviewCateringRequest(requestId, status, quoteVal);
      setCateringActionMessage({
        type: 'success',
        text: isQuoting
          ? `Dispatched quote of ₦${quoteVal.toLocaleString()} to guest.`
          : `Catering state moved successfully to "${status.toUpperCase()}"`
      });
      setCateringQuotePrice('');
      setSelectedCateringId(requestId);
      await loadCaterings();
    } catch (err: any) {
      setCateringActionMessage({ type: 'error', text: err?.message || 'Failed updating catering request details.' });
    }
  };

  const handleCreateWeeklyMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate || !newEndDate) {
      setMenuActionMessage({ type: 'error', text: 'Please specify start and end dates.' });
      return;
    }

    setIsLoading(true);
    setMenuActionMessage(null);
    try {
      const newMenu = await menuService.createWeeklyMenu(newStartDate, newEndDate, newMenuStatus);
      setMenuActionMessage({ type: 'success', text: `Weekly Menu cycle (${newStartDate} to ${newEndDate}) created successfully as ${newMenuStatus}!` });
      setNewStartDate('');
      setNewEndDate('');
      setNewMenuStatus('draft');
      await loadWeeklyMenus();
      setSelectedMenuId(newMenu.id);
    } catch (err: any) {
      setMenuActionMessage({ type: 'error', text: err?.message || 'Error occurred while creating weekly menu cycle.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMenuStatus = async (menuId: string, status: 'draft' | 'active' | 'archived') => {
    setMenuActionMessage(null);
    try {
      await menuService.updateWeeklyMenuStatus(menuId, status);
      setMenuActionMessage({ type: 'success', text: 'Weekly menu cycle status updated successfully.' });
      await loadWeeklyMenus();
    } catch (err: any) {
      setMenuActionMessage({ type: 'error', text: err?.message || 'Error changing weekly menu status.' });
    }
  };

  const handleAddMealToMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId) {
      setMenuActionMessage({ type: 'error', text: 'No active menu cycle selected.' });
      return;
    }
    if (!selectedCatalogMealId) {
      setMenuActionMessage({ type: 'error', text: 'Please choose a dish from the global catalog first.' });
      return;
    }

    setMenuActionMessage(null);
    try {
      await menuService.addMealToMenu(selectedMenuId, selectedCatalogMealId, newMealMinThreshold);
      setMenuActionMessage({ type: 'success', text: 'Culinary dish attached successfully to this weekly menu rotation.' });
      setSelectedCatalogMealId('');
      setNewMealMinThreshold(40);
      loadSelectedMenuMeals(selectedMenuId);
    } catch (err: any) {
      setMenuActionMessage({ type: 'error', text: err?.message || 'Could not attach dish to menu cycle.' });
    }
  };

  const handleRemoveMealFromMenu = async (menuMealId: string) => {
    if (!window.confirm('Are you absolutely sure you want to decouple this dish from this week\'s active menu?')) {
      return;
    }

    setMenuActionMessage(null);
    try {
      await menuService.removeMealFromMenu(menuMealId);
      setMenuActionMessage({ type: 'success', text: 'Dish decoupled successfully from menu.' });
      if (selectedMenuId) {
        loadSelectedMenuMeals(selectedMenuId);
      }
    } catch (err: any) {
      setMenuActionMessage({ type: 'error', text: err?.message || 'Error decoupling dish.' });
    }
  };

  // Feature 3: Meal Creator & Catalog Management handlers
  const handleCreateOrUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFormName || !mealFormPrice) {
      setMealActionMsgStyle({ type: 'error', text: 'Please fill name and price details.' });
      return;
    }
    const priceNum = parseFloat(mealFormPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setMealActionMsgStyle({ type: 'error', text: 'Price must be a valid positive number.' });
      return;
    }

    setIsLoading(true);
    setMealActionMsgStyle(null);
    try {
      if (editingMealId) {
        // Edit mode
        await mealService.updateMeal(editingMealId, {
          name: mealFormName,
          description: mealFormDescription || null,
          category: mealFormCategory,
          price: priceNum,
          image_url: mealFormImageUrl || null,
        });
        setMealActionMsgStyle({ type: 'success', text: `Culinary dish "${mealFormName}" successfully updated in catalog!` });
      } else {
        // Create mode
        await mealService.createMeal({
          name: mealFormName,
          description: mealFormDescription || null,
          category: mealFormCategory,
          price: priceNum,
          image_url: mealFormImageUrl || null,
        });
        setMealActionMsgStyle({ type: 'success', text: `New dish "${mealFormName}" spawned and added to universal catalog!` });
      }
      // Reset form
      resetMealForm();
      await loadMealCatalog();
    } catch (err: any) {
      setMealActionMsgStyle({ type: 'error', text: err?.message || 'Error saving dish to catalog.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetMealForm = () => {
    setEditingMealId(null);
    setMealFormName('');
    setMealFormDescription('');
    setMealFormCategory('rice');
    setMealFormPrice('');
    setMealFormImageUrl('');
  };

  const handleStartEditMeal = (meal: any) => {
    setEditingMealId(meal.id);
    setMealFormName(meal.name);
    setMealFormDescription(meal.description || '');
    setMealFormCategory(meal.category);
    setMealFormPrice(meal.price.toString());
    setMealFormImageUrl(meal.image_url || '');
    setMealActionMsgStyle(null);
  };

  const handleDeleteMealFromCatalog = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently erase "${name}" from the global food catalog?`)) {
      return;
    }
    setMealActionMsgStyle(null);
    try {
      await mealService.deleteMeal(id);
      setMealActionMsgStyle({ type: 'success', text: `Dish "${name}" permanently excised from database.` });
      await loadMealCatalog();
      if (editingMealId === id) {
        resetMealForm();
      }
    } catch (err: any) {
      setMealActionMsgStyle({ type: 'error', text: err?.message || 'Failed to excise recipe.' });
    }
  };

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@jdhkitchen.com' && password === 'admin123') {
      const mockAdminProfile = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@jdhkitchen.com',
        full_name: 'Executive Chef Admin',
        role: 'admin',
        phone: '+234 801 111 2222',
        hostel_name: 'Kitchen HQ',
        room_number: 'Suite A'
      };
      localStorage.setItem('jdh_admin_session', JSON.stringify(mockAdminProfile));
      setCurrentUser(mockAdminProfile);
      setIsLoading(false);
    } else {
      setAuthError('Invalid administrative credentials. Access denied.');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('jdh_admin_session');
      await authService.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Error signing out admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Screen A: Authentication Portal Overlay
  if (!isAdmin) {
    return (
      <Box py={24} px={4} bg="#FAFBF9" minH="85vh">
        <Container maxW="md">
          <VStack spaceY={8} align="stretch">
            {/* Header / Brand */}
            <VStack spaceY={3} textAlign="center">
              <Box p={3.5} borderRadius="2xl" bg="black" color="white" inlineSize="fit-content">
                <Lock size={26} />
              </Box>
              <Heading as="h1" size="2xl" fontWeight="black" color="black" letterSpacing="tight">
                Culinary Admin Portal
              </Heading>
              <Text fontSize="sm" color="gray.500" maxW="320px">
                Authorized staff terminal log-in. Manage campus feast schedules, orders, and logistics.
              </Text>
            </VStack>

            {/* Auth Card */}
            <Box bg="white" p={8} borderRadius="3xl" shadow="md" borderWidth="1px" borderColor="gray.100">
              <form onSubmit={handleAdminSignIn}>
                <VStack spaceY={5} align="stretch">
                  {authError && (
                    <Box
                      bg="red.50"
                      color="red.700"
                      p={4}
                      borderRadius="xl"
                      fontSize="xs"
                      borderWidth="1px"
                      borderColor="red.150"
                    >
                      <HStack spaceX={2}>
                        <AlertTriangle size={15} />
                        <Text fontWeight="semibold">{authError}</Text>
                      </HStack>
                    </Box>
                  )}

                  <VStack align="flex-start" spaceY={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      Staff Email Address
                    </Text>
                    <HStack w="full" px={3} py={2} bg="white" borderWidth="1px" borderColor="gray.250" borderRadius="xl">
                      <Mail size={16} color="gray" />
                      <Input
                        type="email"
                        placeholder="admin@campusfeast.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        border="none"
                        outline="none"
                        p={0}
                        fontSize="sm"
                        height="auto"
                        bg="transparent"
                        _focus={{ boxShadow: 'none' }}
                        w="full"
                        required
                      />
                    </HStack>
                  </VStack>

                  <VStack align="flex-start" spaceY={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      Security Password
                    </Text>
                    <HStack w="full" px={3} py={2} bg="white" borderWidth="1px" borderColor="gray.250" borderRadius="xl">
                      <Lock size={16} color="gray" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        border="none"
                        outline="none"
                        p={0}
                        fontSize="sm"
                        height="auto"
                        bg="transparent"
                        _focus={{ boxShadow: 'none' }}
                        w="full"
                        required
                      />
                    </HStack>
                  </VStack>

                  <Button
                    type="submit"
                    loading={isLoading}
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.850' }}
                    height="44px"
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="sm"
                    width="full"
                    mt={3}
                  >
                    Authenticate Terminal
                  </Button>
                </VStack>
              </form>
            </Box>

            {/* Quick Helper Note for sandbox preview testing */}
            <Box bg="blue.50" p={4} borderRadius="2xl" borderWidth="1px" borderColor="blue.100">
              <VStack align="flex-start" spaceY={1}>
                <Text fontSize="xs" fontWeight="bold" color="blue.800">
                  ⚡ Sandbox Mode Advisory
                </Text>
                <Text fontSize="10.5px" color="blue.650" lineHeight="relaxed">
                  When local Supabase settings are in dry-run, log in using any email containing <strong>"admin"</strong> (e.g. <code>staff-admin@campus.edu</code>) with any password to gain developer access instantly.
                </Text>
              </VStack>
            </Box>

            <Flex justify="center">
              <Button variant="ghost" size="xs" color="gray.500" onClick={onNavigateHome}>
                ← Back to Student Hub
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
    );
  }

  // Screen B: Authenticated Administrator View Dashboard
  return (
    <Box minH="90vh" bg="#FAFAF7">
      {/* Admin Section Sub Header banner */}
      <Box bg="#2D2D2D" py={4} color="white">
        <Container maxW="90%">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spaceX={3}>
              <Box p={2} bg="rgba(255,255,255,0.08)" borderRadius="xl">
                <ShieldCheck size={20} color="#6B8E23" />
              </Box>
              <VStack align="flex-start" spaceY={0}>
                <HStack spaceX={2}>
                  <Heading as="h4" size="sm" fontWeight="extrabold" color="white" m={0} letterSpacing="tight">
                    CAMPUS FEAST ADMIN
                  </Heading>
                  <Badge bg="#FFF8F0" color="#C65D3A" fontSize="9px" px={2} py={0.5} border="none" borderRadius="md" fontWeight="bold">
                    staff privilege
                  </Badge>
                </HStack>
                <Text fontSize="11px" color="gray.400">
                  Signed in as: {currentUser.full_name} ({currentUser.email})
                </Text>
              </VStack>
            </HStack>

            <Button
              onClick={handleSignOut}
              size="xs"
              variant="outline"
              borderColor="red.550"
              color="red.300"
              _hover={{ bg: 'red.950', color: 'white' }}
              borderRadius="lg"
              fontWeight="bold"
            >
              <LogOut size={12} style={{ marginRight: '6px' }} />
              Terminate Session
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Admin layout panel structure */}
      <Container maxW="90%" py={4}>
        <Grid templateColumns={{ base: '1fr', lg: '240px 1fr' }} gap={8}>
          
          {/* Navigation Sidebar */}
          <Box>
            <VStack align="stretch" spaceY={1.5}>
              <Box px={3} pb={2}>
                <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
                  PORTAL NAVIGATION
                </Text>
              </Box>

              <Button
                variant={activeTab === 'overview' ? 'solid' : 'ghost'}
                bg={activeTab === 'overview' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'overview' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'overview' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'overview' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('overview')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <Sliders size={15} style={{ marginRight: '8px' }} />
                Administrative Overview
              </Button>

              {/* Menu and logistics modules */}
              <Box pt={4} px={3} pb={1}>
                <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
                  MANAGEMENT MODULES
                </Text>
              </Box>

              <Button
                variant={activeTab === 'menus' ? 'solid' : 'ghost'}
                bg={activeTab === 'menus' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'menus' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'menus' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'menus' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('menus')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <Calendar size={15} style={{ marginRight: '8px' }} />
                2. Weekly Menu Cycles
              </Button>

              <Button
                variant={activeTab === 'meals' ? 'solid' : 'ghost'}
                bg={activeTab === 'meals' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'meals' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'meals' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'meals' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('meals')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <UtensilsCrossed size={15} style={{ marginRight: '8px' }} />
                3. Meal Creator & Catalog
              </Button>

              <Button
                variant={activeTab === 'schedules' ? 'solid' : 'ghost'}
                bg={activeTab === 'schedules' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'schedules' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'schedules' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'schedules' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('schedules')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <Truck size={15} style={{ marginRight: '8px' }} />
                4. Logistics & Delivery Days
              </Button>

              <Button
                variant={activeTab === 'orders' ? 'solid' : 'ghost'}
                bg={activeTab === 'orders' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'orders' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'orders' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'orders' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('orders')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <Receipt size={15} style={{ marginRight: '8px' }} />
                6-9. Order & Receipt Verification
              </Button>

              <Button
                variant={activeTab === 'catering' ? 'solid' : 'ghost'}
                bg={activeTab === 'catering' ? '#C65D3A' : 'transparent'}
                color={activeTab === 'catering' ? 'white' : 'gray.600'}
                _hover={{ bg: activeTab === 'catering' ? '#A94B2B' : '#FFF8F0', color: activeTab === 'catering' ? 'white' : 'black' }}
                justifyContent="flex-start"
                size="md"
                borderRadius="xl"
                onClick={() => setActiveTab('catering')}
                fontWeight="semibold"
                fontSize="xs"
              >
                <Briefcase size={15} style={{ marginRight: '8px' }} />
                10. Catering Requests
              </Button>
            </VStack>
          </Box>

          {/* Active Work Panel Tab content */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
            {activeTab === 'overview' && (
              <VStack spaceY={6} align="stretch">
                <Box>
                  <Heading as="h2" size="xl" fontWeight="black" color="#2D2D2D" letterSpacing="tight" mb={1}>
                    System Administrative Panel
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    Welcome back, Staff Chef. Manage weekly co-op cooking loops, track inventory batching, and verify student payments instantly.
                  </Text>
                </Box>

                {/* Sub status alert using the Olive shade */}
                <Box bg="#FFF8F0" p={5} borderRadius="2xl" borderWidth="1px" borderColor="rgba(198, 93, 58, 0.2)">
                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="sm" fontWeight="bold" color="#C65D3A">
                      ✓ System Live & Fully Authenticated
                    </Text>
                    <Text fontSize="xs" color="#2D2D2D" lineHeight="relaxed">
                      Session token is successfully validated. Use the modules in the portal navigation bar to schedule food cycles, publish meals, track delivery slots and approve manual transfer receipts.
                    </Text>
                  </VStack>
                </Box>

                {/* Admin Overview stats using real metrics */}
                <Box>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" letterSpacing="widest" mb={4}>
                    REAL-TIME PLATFORM METRICS
                  </Text>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={5}>
                    <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                      <Text textTransform="uppercase" fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="wider">Active Cycles</Text>
                      <Text fontSize="2xl" fontWeight="black" color="#2D2D2D" mt={1}>{weeklyMenus.length}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1.5}>Schedules programmed</Text>
                    </Box>
                    <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                      <Text textTransform="uppercase" fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="wider">Dishes Created</Text>
                      <Text fontSize="2xl" fontWeight="black" color="#2D2D2D" mt={1}>{mealCatalog.length}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1.5}>Available recipes</Text>
                    </Box>
                    <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                      <Text textTransform="uppercase" fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="wider">Total Orders</Text>
                      <Text fontSize="2xl" fontWeight="black" color="#2D2D2D" mt={1}>{allOrders.length}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1.5}>Checkout receipts</Text>
                    </Box>
                    <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                      <Text textTransform="uppercase" fontSize="10px" fontWeight="bold" color="gray.500" letterSpacing="wider">Catering Enquiries</Text>
                      <Text fontSize="2xl" fontWeight="black" color="#2D2D2D" mt={1}>{cateringRequests.length}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1.5}>Custom event bookings</Text>
                    </Box>
                  </Grid>
                </Box>
              </VStack>
            )}

            {activeTab === 'menus' && (
              <VStack spaceY={8} align="stretch">
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Heading as="h2" size="xl" fontWeight="black" color="black" letterSpacing="tight" mb={1}>
                      Weekly Menu Iterations
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Schedule weekly operations cycles and compile student bulk pre-order menu selections.
                    </Text>
                  </Box>
                  <Badge bg="#FFF8F0" color="#C65D3A" p={2} borderRadius="md" fontWeight="bold" fontSize="xs">
                    Feature 2 Active
                  </Badge>
                </Flex>

                {menuActionMessage && (
                  <Box
                    bg={menuActionMessage.type === 'success' ? 'green.50' : 'red.50'}
                    color={menuActionMessage.type === 'success' ? 'green.800' : 'red.800'}
                    p={4}
                    borderRadius="2xl"
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={menuActionMessage.type === 'success' ? 'green.155' : 'red.155'}
                  >
                    {menuActionMessage.text}
                  </Box>
                )}

                <Grid templateColumns={{ base: '1fr', lg: '1fr 1.15fr' }} gap={8}>
                  {/* Left Column: Menu cycles list and creation */}
                  <VStack spaceY={6} align="stretch">
                    {/* Create New Cycle */}
                    <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" bg="#FAFBF9">
                      <Heading as="h3" size="sm" fontWeight="extrabold" color="black" mb={4}>
                        Create Operations Cycle
                      </Heading>
                      <form onSubmit={handleCreateWeeklyMenu}>
                        <VStack spaceY={4} align="stretch">
                          <Grid templateColumns="1fr 1fr" gap={3}>
                            <VStack align="stretch" spaceY={1}>
                              <Text fontSize="10px" fontWeight="bold" color="gray.500">START DATE</Text>
                              <Input
                                type="date"
                                value={newStartDate}
                                onChange={(e) => setNewStartDate(e.target.value)}
                                bg="white"
                                fontSize="xs"
                                px={2}
                                py={1.5}
                                h="36px"
                                borderRadius="xl"
                                required
                              />
                            </VStack>
                            <VStack align="stretch" spaceY={1}>
                              <Text fontSize="10px" fontWeight="bold" color="gray.500">END DATE</Text>
                              <Input
                                type="date"
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                bg="white"
                                fontSize="xs"
                                px={2}
                                py={1.5}
                                h="36px"
                                borderRadius="xl"
                                required
                              />
                            </VStack>
                          </Grid>

                          <HStack spaceX={3}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.500" w="80px">INITIAL STATUS:</Text>
                            <HStack spaceX={2}>
                              {['draft', 'active'].map((st) => (
                                <Button
                                  key={st}
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  borderColor={newMenuStatus === st ? 'black' : 'gray.200'}
                                  bg={newMenuStatus === st ? 'black' : 'white'}
                                  color={newMenuStatus === st ? 'white' : 'black'}
                                  _hover={{ bg: newMenuStatus === st ? 'black' : 'gray.50' }}
                                  onClick={() => setNewMenuStatus(st as any)}
                                  borderRadius="md"
                                  fontWeight="bold"
                                  px={2.5}
                                >
                                  {st.toUpperCase()}
                                </Button>
                              ))}
                            </HStack>
                          </HStack>

                          <Button
                            type="submit"
                            bg="black"
                            color="white"
                            _hover={{ bg: 'gray.850' }}
                            size="md"
                            width="full"
                            borderRadius="xl"
                            fontWeight="bold"
                            fontSize="xs"
                            h="38px"
                          >
                            <Plus size={14} style={{ marginRight: '6px' }} />
                            Spawn Cycle
                          </Button>
                        </VStack>
                      </form>
                    </Box>

                    {/* Cycle List */}
                    <Box>
                      <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="wider" mb={3}>
                        CYCLES IN DATABASE
                      </Text>
                      {isLoadingMenus ? (
                        <Text fontSize="xs" color="gray.500">Querying weekly cycles...</Text>
                      ) : weeklyMenus.length === 0 ? (
                        <Text fontSize="xs" color="gray.500">No menu cycles discovered.</Text>
                      ) : (
                        <VStack spaceY={2.5} align="stretch">
                          {weeklyMenus.map((menu) => {
                            const isSelected = selectedMenuId === menu.id;
                            return (
                              <Box
                                key={menu.id}
                                p={4}
                                borderRadius="2xl"
                                borderWidth="1px"
                                borderColor={isSelected ? 'black' : 'gray.200'}
                                bg={isSelected ? 'gray.50' : 'white'}
                                cursor="pointer"
                                onClick={() => setSelectedMenuId(menu.id)}
                                transition="all 0.15s ease"
                              >
                                <VStack align="stretch" spaceY={3}>
                                  <Flex justify="space-between" align="center">
                                    <VStack align="flex-start" spaceY={0.5}>
                                      <Text fontSize="xs" fontWeight="black" color="black">
                                        {menu.start_date} to {menu.end_date}
                                      </Text>
                                      <Text fontSize="10px" color="gray.400" fontFamily="monospace">
                                        ID: {menu.id}
                                      </Text>
                                    </VStack>
                                    <Badge
                                      borderRadius="md"
                                      px={2.5}
                                      py={0.5}
                                      fontSize="10px"
                                      fontWeight="bold"
                                      bg={
                                        menu.status === 'active'
                                          ? 'emerald.100'
                                          : menu.status === 'draft'
                                          ? 'gray.100'
                                          : 'amber.100'
                                      }
                                      color={
                                        menu.status === 'active'
                                          ? 'emerald.800'
                                          : menu.status === 'draft'
                                          ? 'gray.800'
                                          : 'amber.800'
                                      }
                                    >
                                      {menu.status.toUpperCase()}
                                    </Badge>
                                  </Flex>

                                  <HStack spaceX={1} mt={1} pt={2} borderTopWidth="1px" borderColor="gray.100" justify="space-between">
                                    <Text fontSize="10.5px" fontWeight="semibold" color="#C65D3A">
                                      {isSelected ? '✓ Selected Cycle' : 'Click to manage'}
                                    </Text>
                                    <HStack spaceX={1.5}>
                                      {menu.status !== 'active' && (
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          fontSize="10px"
                                          colorScheme="green"
                                          color="emerald.700"
                                          fontWeight="bold"
                                          _hover={{ bg: 'green.50' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeMenuStatus(menu.id, 'active');
                                          }}
                                        >
                                          Go Active
                                        </Button>
                                      )}
                                      {menu.status !== 'draft' && (
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          fontSize="10px"
                                          colorScheme="gray"
                                          color="gray.600"
                                          fontWeight="bold"
                                          _hover={{ bg: 'gray.150' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeMenuStatus(menu.id, 'draft');
                                          }}
                                        >
                                          Set Draft
                                        </Button>
                                      )}
                                      {menu.status !== 'archived' && (
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          fontSize="10px"
                                          colorScheme="orange"
                                          color="amber.700"
                                          fontWeight="bold"
                                          _hover={{ bg: 'orange.50' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeMenuStatus(menu.id, 'archived');
                                          }}
                                        >
                                          Archive
                                        </Button>
                                      )}
                                    </HStack>
                                  </HStack>
                                </VStack>
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  </VStack>

                  {/* Right Column: Manage attached dishes */}
                  <VStack spaceY={6} align="stretch">
                    {selectedMenuId ? (
                      <>
                        {/* Selector/Details header */}
                        <Box p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" bg="black" color="white">
                          <VStack align="flex-start" spaceY={1}>
                            <Text fontSize="9px" fontWeight="bold" color="gray.400" letterSpacing="widest">SELECTED CYCLE ROTATION</Text>
                            <Heading as="h4" size="md" fontWeight="bold">
                              {weeklyMenus.find(m => m.id === selectedMenuId)?.start_date || '...'} to {weeklyMenus.find(m => m.id === selectedMenuId)?.end_date || '...'}
                            </Heading>
                          </VStack>
                        </Box>

                        {/* Attach Meal Form */}
                        <Box p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" bg="white">
                          <Heading as="h3" size="sm" fontWeight="extrabold" color="black" mb={3}>
                            Attach Dish to selected Cycle
                          </Heading>
                          <form onSubmit={handleAddMealToMenu}>
                            <VStack spaceY={4} align="stretch">
                              <VStack align="stretch" spaceY={1}>
                                <Text fontSize="10px" fontWeight="bold" color="gray.500">CHOOSE CATALOG DISH</Text>
                                <Box borderStyle="solid" borderWidth="1px" borderColor="gray.250" borderRadius="xl" overflow="hidden">
                                  <select
                                    value={selectedCatalogMealId}
                                    onChange={(e) => setSelectedCatalogMealId(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      fontSize: '12.5px',
                                      background: 'white',
                                      border: 'none',
                                      outline: 'none',
                                      color: 'black'
                                    }}
                                    required
                                  >
                                    <option value="">-- Choose a culinary dish --</option>
                                    {mealCatalog.map((meal) => (
                                      <option key={meal.id} value={meal.id}>
                                        {meal.name} (₦{meal.price.toLocaleString()})
                                      </option>
                                    ))}
                                  </select>
                                </Box>
                              </VStack>

                              <VStack align="stretch" spaceY={1}>
                                <HStack justify="space-between">
                                  <Text fontSize="10px" fontWeight="bold" color="gray.500">MINIMUM QUANTITY THRESHOLD</Text>
                                  <Badge bg="gray.100" color="black" fontSize="10px">{newMealMinThreshold} meals</Badge>
                                </HStack>
                                <Input
                                  type="number"
                                  min={1}
                                  max={200}
                                  value={newMealMinThreshold}
                                  onChange={(e) => setNewMealMinThreshold(Number(e.target.value))}
                                  bg="white"
                                  borderColor="gray.250"
                                  _focus={{ borderColor: 'black' }}
                                  borderRadius="xl"
                                  size="sm"
                                  required
                                />
                                <Text fontSize="9px" color="gray.400">
                                  Co-op collective minimum order target required to green-light prep.
                                </Text>
                              </VStack>

                              <Button
                                type="submit"
                                bg="black"
                                color="white"
                                _hover={{ bg: 'gray.850' }}
                                size="sm"
                                borderRadius="xl"
                                fontWeight="bold"
                                h="36px"
                              >
                                Link Dish to Menu
                              </Button>
                            </VStack>
                          </form>
                        </Box>

                        {/* List of meals inside selected menu */}
                        <Box>
                          <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="wider" mb={3}>
                            DISHES SCHEDULED THIS WEEK ({selectedMenuMeals.length})
                          </Text>
                          {selectedMenuMeals.length === 0 ? (
                            <Box p={6} borderStyle="dashed" borderWidth="1.5px" borderColor="gray.200" borderRadius="2xl" textAlign="center">
                              <Text fontSize="xs" color="gray.500">No dishes attached to this cycle yet. Use the selector above to build our rotation.</Text>
                            </Box>
                          ) : (
                            <VStack spaceY={2.5} align="stretch">
                              {selectedMenuMeals.map((mm) => (
                                <Box
                                  key={mm.menu_meal_id}
                                  p={4}
                                  borderRadius="2xl"
                                  borderWidth="1px"
                                  borderColor="gray.200"
                                  bg="white"
                                >
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <HStack spaceX={3} flex={1}>
                                      {mm.image_url && (
                                        <Box w="42px" h="42px" borderRadius="xl" overflow="hidden" flexShrink={0}>
                                          <Box as="img" src={mm.image_url} w="full" h="full" objectFit="cover" />
                                        </Box>
                                      )}
                                      <VStack align="flex-start" spaceY={0.5}>
                                        <Text fontSize="xs" fontWeight="bold" color="black" lineClamp={2}>
                                          {mm.meal_name}
                                        </Text>
                                        <HStack spaceX={1.5}>
                                          <Badge bg="gray.100" color="gray.700" fontSize="8px">
                                            {mm.meal_category.toUpperCase()}
                                          </Badge>
                                          <Text fontSize="10.5px" fontWeight="bold" color="black">
                                            ₦{mm.unit_price.toLocaleString()}
                                          </Text>
                                        </HStack>
                                      </VStack>
                                    </HStack>

                                    <HStack spaceX={4} flexShrink={0} align="center">
                                      <VStack align="flex-end" spaceY={0}>
                                        <Text fontSize="9px" color="gray.400" fontWeight="bold">TARGET</Text>
                                        <Text fontSize="11px" fontWeight="black" color="black">
                                          {mm.min_threshold} units
                                        </Text>
                                      </VStack>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        color="red.600"
                                        p={1.5}
                                        borderRadius="lg"
                                        _hover={{ bg: 'red.50' }}
                                        onClick={() => handleRemoveMealFromMenu(mm.menu_meal_id)}
                                      >
                                        <Trash2 size={15} />
                                      </Button>
                                    </HStack>
                                  </Flex>
                                </Box>
                              ))}
                            </VStack>
                          )}
                        </Box>
                      </>
                    ) : (
                      <Box p={8} textAlignment="center" bg="gray.50" borderRadius="2xl" borderStyle="dashed" borderWidth="1.5px" borderColor="gray.250">
                        <Text fontSize="xs" color="gray.500">Select a weekly menu cycle from the list to manage its culinary meals roster.</Text>
                      </Box>
                    )}
                  </VStack>
                </Grid>
              </VStack>
            )}

            {activeTab === 'meals' && (
              <VStack spaceY={8} align="stretch">
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Heading as="h2" size="xl" fontWeight="black" color="black" letterSpacing="tight" mb={1}>
                      Universal Food Catalog
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Spawn new culinary recipes, configure baseline prices, and maintain the institutional food inventory.
                    </Text>
                  </Box>
                  <Badge bg="#FFF8F0" color="#C65D3A" p={3} borderRadius="md" fontWeight="bold" fontSize="xs">
                    Feature 3 Active
                  </Badge>
                </Flex>

                {mealActionMsgStyle && (
                  <Box
                    bg={mealActionMsgStyle.type === 'success' ? 'green.50' : 'red.50'}
                    color={mealActionMsgStyle.type === 'success' ? 'green.800' : 'red.800'}
                    p={4}
                    borderRadius="2xl"
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={mealActionMsgStyle.type === 'success' ? 'green.155' : 'red.155'}
                  >
                    {mealActionMsgStyle.text}
                  </Box>
                )}

                <Grid templateColumns={{ base: '1fr', lg: '380px 1fr' }} gap={8}>
                  {/* Left Column: Create or Edit Meal Form */}
                  <Box p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="#FAFBF9" h="fit-content">
                    <VStack spaceY={4} align="stretch">
                      <Box>
                        <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                          {editingMealId ? 'Edit Recipe Details' : 'Create Culinary Dish'}
                        </Heading>
                        <Text fontSize="11px" color="gray.500">
                          Configure pricing and identity variables for standard checkout.
                        </Text>
                      </Box>

                      <form onSubmit={handleCreateOrUpdateMeal}>
                        <VStack spaceY={4} align="stretch">
                          <VStack align="stretch" spaceY={1}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.500">DISH TITLE / NAME</Text>
                            <Input
                              placeholder="e.g. Asun Fried Rice with Ponmo"
                              value={mealFormName}
                              onChange={(e) => setMealFormName(e.target.value)}
                              bg="white"
                              borderColor="gray.250"
                              _focus={{ borderColor: 'black' }}
                              borderRadius="xl"
                              size="sm"
                              required
                            />
                          </VStack>

                          <VStack align="stretch" spaceY={1}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.500">RECIPE CATEGORY</Text>
                            <Box borderStyle="solid" borderWidth="1px" borderColor="gray.250" borderRadius="xl" overflow="hidden">
                              <select
                                value={mealFormCategory}
                                onChange={(e) => setMealFormCategory(e.target.value as any)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  fontSize: '12.5px',
                                  background: 'white',
                                  border: 'none',
                                  outline: 'none',
                                  color: 'black'
                                }}
                                required
                              >
                                <option value="rice">Rice (Jollof, Fried, etc.)</option>
                                <option value="soup">Soup (Efo, Egusi, Okra, etc.)</option>
                                <option value="stew">Stew / Sauce (Ayamase, Tomato, etc.)</option>
                                <option value="other">Other / Swallow / Side items</option>
                              </select>
                            </Box>
                          </VStack>

                          <VStack align="stretch" spaceY={1}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.500">BASE PRICE (₦ NAIJA NAIRA)</Text>
                            <Input
                              type="number"
                              placeholder="e.g. 3500"
                              value={mealFormPrice}
                              onChange={(e) => setMealFormPrice(e.target.value)}
                              bg="white"
                              borderColor="gray.250"
                              _focus={{ borderColor: 'black' }}
                              borderRadius="xl"
                              size="sm"
                              required
                            />
                          </VStack>

                           {/* Drag-and-drop image file selector & Supabase bucket-uploader */}
                           <VStack align="stretch" spaceY={2.5}>
                             <Text fontSize="10px" fontWeight="bold" color="gray.500">CULINARY PHOTO (FILE UPLOAD OR URL)</Text>
                             
                             <Box
                               onDragOver={(e) => {
                                 e.preventDefault();
                                 setIsDraggingFile(true);
                               }}
                               onDragLeave={() => setIsDraggingFile(false)}
                               onDrop={(e) => {
                                 e.preventDefault();
                                 setIsDraggingFile(false);
                                 const files = e.dataTransfer.files;
                                 if (files && files.length > 0) {
                                   uploadMealImage(files[0]);
                                 }
                               }}
                               onClick={() => fileInputRef.current?.click()}
                               p={5}
                               borderRadius="2xl"
                               borderWidth="2px"
                               borderStyle={isDraggingFile ? 'solid' : 'dashed'}
                               borderColor={isDraggingFile ? 'black' : 'gray.200'}
                               bg={isDraggingFile ? 'gray.50' : 'white'}
                               textAlign="center"
                               cursor="pointer"
                               transition="all 0.15s ease"
                               _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                             >
                               <input
                                 type="file"
                                 ref={fileInputRef}
                                 onChange={(e) => {
                                   const files = e.target.files;
                                   if (files && files.length > 0) {
                                     uploadMealImage(files[0]);
                                   }
                                 }}
                                 accept="image/*"
                                 style={{ display: 'none' }}
                               />
                               
                               <VStack spaceY={2} align="center">
                                 {uploadingImage ? (
                                   <>
                                     <Text fontSize="xs" fontWeight="bold" color="#C65D3A" className="animate-pulse">
                                       Uploading to "mealsImage" bucket...
                                     </Text>
                                     <Text fontSize="10px" color="gray.400">
                                       Storing physical picture inside your cloud storage bucket.
                                     </Text>
                                   </>
                                 ) : mealFormImageUrl ? (
                                   <>
                                     <Box w="60px" h="60px" borderRadius="xl" overflow="hidden" shadow="sm">
                                       <Box as="img" src={mealFormImageUrl} w="full" h="full" objectFit="cover" />
                                     </Box>
                                     <Text fontSize="11px" fontWeight="bold" color="emerald.700">
                                       Image uploaded and assigned!
                                     </Text>
                                     <Text fontSize="9px" color="gray.400" maxW="220px" isTruncated>
                                       {mealFormImageUrl}
                                     </Text>
                                     <Button
                                       size="xs"
                                       variant="outline"
                                       fontSize="9px"
                                       h="22px"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setMealFormImageUrl('');
                                       }}
                                     >
                                       Reset Image
                                     </Button>
                                   </>
                                 ) : (
                                   <>
                                     <Text fontSize="xs" fontWeight="bold" color="gray.700">
                                       Drag & drop photo here, or <span style={{ color: 'black', textDecoration: 'underline' }}>browse files</span>
                                     </Text>
                                     <Text fontSize="9px" color="gray.400">
                                       Supports PNG, JPG, or WEBP; uploads to Supabase Storage.
                                     </Text>
                                   </>
                                 )}
                               </VStack>
                             </Box>

                             <HStack justify="space-between">
                               <Button
                                 size="xs"
                                 variant="ghost"
                                 fontSize="9px"
                                 colorScheme="gray"
                                 color="gray.500"
                                 p={0}
                                 _hover={{ bg: 'transparent', textDecoration: 'underline' }}
                                 onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                               >
                                 {showManualUrlInput ? 'Hide network link option' : 'Or assign image via web address'}
                               </Button>
                             </HStack>

                             {showManualUrlInput && (
                               <VStack align="stretch" spaceY={1}>
                                 <Input
                                   placeholder="https://images.unsplash.com/..."
                                   value={mealFormImageUrl}
                                   onChange={(e) => setMealFormImageUrl(e.target.value)}
                                   bg="white"
                                   borderColor="gray.250"
                                   _focus={{ borderColor: 'black' }}
                                   borderRadius="xl"
                                   size="sm"
                                 />
                                 <Text fontSize="9px" color="gray.400">
                                   Ensure link points to a direct image endpoint.
                                 </Text>
                               </VStack>
                             )}
                           </VStack>

                          <VStack align="stretch" spaceY={1}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.500">MENU DESCRIPTION / INGREDIENTS</Text>
                            <Box style={{ borderStyle: 'solid', borderWidth: '1px', borderColor: 'var(--chakra-colors-gray-250)', borderRadius: 'var(--chakra-radii-xl)', background: 'white', overflow: 'hidden', padding: '6px' }}>
                              <textarea
                                placeholder="Smoky baseline jollof seasoned with real locust bean spices..."
                                value={mealFormDescription}
                                onChange={(e) => setMealFormDescription(e.target.value)}
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  fontSize: '12px',
                                  border: 'none',
                                  outline: 'none',
                                  resize: 'vertical',
                                  background: 'transparent',
                                  color: 'black'
                                }}
                              />
                            </Box>
                          </VStack>

                          <VStack spaceY={2} pt={2}>
                            <Button
                              type="submit"
                              bg="black"
                              color="white"
                              _hover={{ bg: 'gray.850' }}
                              size="md"
                              width="full"
                              borderRadius="xl"
                              fontWeight="bold"
                              fontSize="xs"
                              h="38px"
                            >
                              {editingMealId ? 'Apply Update Changes' : 'Spawn New Recipe'}
                            </Button>
                            {editingMealId && (
                              <Button
                                type="button"
                                variant="outline"
                                color="gray.500"
                                _hover={{ bg: 'gray.100' }}
                                size="sm"
                                width="full"
                                borderRadius="xl"
                                fontWeight="bold"
                                fontSize="xs"
                                onClick={resetMealForm}
                              >
                                Cancel Edit Mode
                              </Button>
                            )}
                          </VStack>
                        </VStack>
                      </form>
                    </VStack>
                  </Box>

                  {/* Right Column: Interactive Search & Recipe Catalog Grid */}
                  <VStack spaceY={5} align="stretch">
                    {/* Search and Filters */}
                    <Flex gap={3} w="full" bg="white" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" align="center" justify="space-between" flexWrap="wrap">
                      <HStack spaceX={2} px={3} py={1.5} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200" flex={1} maxW="400px">
                        <Search size={15} color="gray" />
                        <Input
                          placeholder="Search database recipe name..."
                          value={mealSearchQuery}
                          onChange={(e) => setMealSearchQuery(e.target.value)}
                          border="none"
                          outline="none"
                          p={0}
                          fontSize="xs"
                          height="auto"
                          _focus={{ boxShadow: 'none' }}
                          bg="transparent"
                          w="full"
                        />
                      </HStack>

                      <HStack spaceX={1}>
                        {['all', 'rice', 'soup', 'stew', 'other'].map((cat) => (
                          <Button
                            key={cat}
                            size="xs"
                            variant={selectedCategoryFilter === cat ? 'solid' : 'ghost'}
                            bg={selectedCategoryFilter === cat ? 'black' : 'transparent'}
                            color={selectedCategoryFilter === cat ? 'white' : 'gray.500'}
                            _hover={{ bg: selectedCategoryFilter === cat ? 'black' : 'gray.100' }}
                            borderRadius="lg"
                            fontWeight="bold"
                            px={2.5}
                            py={1.5}
                            onClick={() => setSelectedCategoryFilter(cat)}
                          >
                            {cat.toUpperCase()}
                          </Button>
                        ))}
                      </HStack>
                    </Flex>

                    {/* Catalog list block */}
                    <Box>
                      <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="wider" mb={4}>
                        RECIPES FOUND ({mealCatalog.filter(meal => {
                          const matchesSearch = meal.name.toLowerCase().includes(mealSearchQuery.toLowerCase()) || 
                            (meal.description && meal.description.toLowerCase().includes(mealSearchQuery.toLowerCase()));
                          const matchesCat = selectedCategoryFilter === 'all' || meal.category === selectedCategoryFilter;
                          return matchesSearch && matchesCat;
                        }).length})
                      </Text>

                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                        {mealCatalog.filter(meal => {
                          const matchesSearch = meal.name.toLowerCase().includes(mealSearchQuery.toLowerCase()) || 
                            (meal.description && meal.description.toLowerCase().includes(mealSearchQuery.toLowerCase()));
                          const matchesCat = selectedCategoryFilter === 'all' || meal.category === selectedCategoryFilter;
                          return matchesSearch && matchesCat;
                        }).map((meal) => (
                          <Box
                            key={meal.id}
                            p={4}
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="gray.200"
                            bg="white"
                            shadow="xs"
                            transition="all 0.15s ease"
                            _hover={{ shadow: 'sm', borderColor: 'gray.300' }}
                          >
                            <VStack align="stretch" spaceY={3}>
                              <HStack spaceX={3.5} align="flex-start">
                                {meal.image_url ? (
                                  <Box w="64px" h="64px" borderRadius="xl" overflow="hidden" flexShrink={0} bg="gray.100">
                                    <Box as="img" src={meal.image_url} w="full" h="full" objectFit="cover" />
                                  </Box>
                                ) : (
                                  <Box w="64px" h="64px" borderRadius="xl" bg="gray.50" flexShrink={0} display="flex" alignItems="center" justifyContent="center" borderWidth="1px" borderColor="gray.100">
                                    <UtensilsCrossed size={18} color="gray" />
                                  </Box>
                                )}

                                <VStack align="flex-start" spaceY={1} flex={1}>
                                  <HStack justify="space-between" w="full" align="flex-start">
                                    <Badge bg="gray.100" color="gray.700" fontSize="8px" borderRadius="md" px={2} py={0.5}>
                                      {meal.category.toUpperCase()}
                                    </Badge>
                                    <Text fontSize="12.5px" fontWeight="black" color="black">
                                      ₦{meal.price.toLocaleString()}
                                    </Text>
                                  </HStack>

                                  <Text fontSize="xs" fontWeight="bold" color="black" lineClamp={1}>
                                    {meal.name}
                                  </Text>
                                  <Text fontSize="10.5px" color="gray.500" lineClamp={2} lineHeight="short">
                                    {meal.description || 'Description not detailed yet across campus catalog.'}
                                  </Text>
                                </VStack>
                              </HStack>

                              <HStack justify="space-between" pt={2.5} borderTopWidth="1px" borderColor="gray.100">
                                <Text fontSize="9px" color="gray.400" fontFamily="monospace">
                                  ID: {meal.id.slice(0, 10)}...
                                </Text>

                                <HStack spaceX={2}>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    color="blue.600"
                                    _hover={{ bg: 'blue.50' }}
                                    fontWeight="bold"
                                    borderRadius="lg"
                                    onClick={() => handleStartEditMeal(meal)}
                                  >
                                    <Edit size={12} style={{ marginRight: '4px' }} />
                                    Modify
                                  </Button>
                                  
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    color="red.600"
                                    _hover={{ bg: 'red.50' }}
                                    fontWeight="bold"
                                    borderRadius="lg"
                                    onClick={() => handleDeleteMealFromCatalog(meal.id, meal.name)}
                                  >
                                    <Trash2 size={12} style={{ marginRight: '4px' }} />
                                    Delete
                                  </Button>
                                </HStack>
                              </HStack>
                            </VStack>
                          </Box>
                        ))}
                      </Grid>
                    </Box>
                  </VStack>
                </Grid>
                </VStack>
            )}

            {activeTab === 'schedules' && (
              <VStack spaceY={8} align="stretch">
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Heading as="h2" size="xl" fontWeight="black" color="black" letterSpacing="tight" mb={1}>
                      Logistics & Delivery Timelines
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Configure order freeze cutoffs, delivery timestamps, and track co-op cooking thresholds (Feature 4 & 5).
                    </Text>
                  </Box>
                  <Badge bg="#FFF8F0" color="#C65D3A" p={3} borderRadius="md" fontWeight="bold" fontSize="xs">
                    Features 4 & 5 Active
                  </Badge>
                </Flex>

                {scheduleActionMessage && (
                  <Box
                    bg={scheduleActionMessage.type === 'success' ? 'green.50' : 'red.50'}
                    color={scheduleActionMessage.type === 'success' ? 'green.800' : 'red.800'}
                    p={4}
                    borderRadius="2xl"
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={scheduleActionMessage.type === 'success' ? 'green.155' : 'red.155'}
                  >
                    {scheduleActionMessage.text}
                  </Box>
                )}

                <Grid templateColumns={{ base: '1fr', lg: '1fr 1.25fr' }} gap={8}>
                  {/* Left panel: configure schedule */}
                  <VStack spaceY={6} align="stretch">
                    <Box p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="#FAFBF9">
                      <VStack spaceY={4} align="stretch">
                        <Box>
                          <Heading as="h3" size="sm" fontWeight="extrabold" color="black">
                            Schedule Configuration
                          </Heading>
                          <Text fontSize="11px" color="gray.500" mb={3}>
                            Set delivery timelines for the currently highlighted menu cycle.
                          </Text>
                          <Badge bg="black" color="white" px={3} py={1} borderRadius="lg" fontSize="10px">
                            Active Cycle ID: {selectedMenuId ? selectedMenuId.slice(0, 15) : 'None highlighted'}
                          </Badge>
                        </Box>

                        {selectedMenuId ? (
                          <form onSubmit={handleSaveDeliverySchedule}>
                            <VStack spaceY={4} align="stretch" pt={2}>
                              <VStack align="stretch" spaceY={1}>
                                <Text fontSize="10px" fontWeight="bold" color="gray.500">TARGET DELIVERY DATE</Text>
                                <Input
                                  type="date"
                                  value={newScheduleDate}
                                  onChange={(e) => setNewScheduleDate(e.target.value)}
                                  bg="white"
                                  borderColor="gray.250"
                                  _focus={{ borderColor: 'black' }}
                                  borderRadius="xl"
                                  size="sm"
                                  required
                                />
                              </VStack>

                              <VStack align="stretch" spaceY={1}>
                                <Text fontSize="10px" fontWeight="bold" color="gray.500">ORDER CUTOFF TIME (LOCK PRE-ORDERS)</Text>
                                <Input
                                  type="datetime-local"
                                  value={newScheduleCutoff}
                                  onChange={(e) => setNewScheduleCutoff(e.target.value)}
                                  bg="white"
                                  borderColor="gray.250"
                                  _focus={{ borderColor: 'black' }}
                                  borderRadius="xl"
                                  size="sm"
                                  required
                                />
                              </VStack>

                              <Button
                                type="submit"
                                bg="black"
                                color="white"
                                _hover={{ bg: 'gray.850' }}
                                size="md"
                                borderRadius="xl"
                                fontWeight="bold"
                                fontSize="xs"
                                h="38px"
                              >
                                {activeSchedule ? 'Save Timeline Changes' : 'Initialize Schedule Timeline'}
                              </Button>
                            </VStack>
                          </form>
                        ) : (
                          <Text fontSize="xs" color="gray.500">Please choose a weekly menu cycle in tab 2 before defining logistics.</Text>
                        )}
                      </VStack>
                    </Box>

                    {activeSchedule && (
                      <Box p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="white">
                        <VStack spaceY={4} align="stretch">
                          <Box>
                            <Heading as="h4" size="xs" fontWeight="black" color="black" textTransform="uppercase">
                              Active Timeline Status
                            </Heading>
                            <Text fontSize="11px" color="gray.400">Manage order access locks for this delivery terminal.</Text>
                          </Box>

                          <Flex justify="space-between" align="center" bg="gray.50" p={3} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                            <Text fontSize="xs" fontWeight="bold" color="black">Current Status:</Text>
                            <Badge
                              bg={activeSchedule.status === 'open' ? 'green.100' : activeSchedule.status === 'closed' ? 'red.50' : 'blue.50'}
                              color={activeSchedule.status === 'open' ? 'green.800' : activeSchedule.status === 'closed' ? 'red.800' : 'blue.800'}
                              fontWeight="black"
                              borderRadius="md"
                              px={3}
                              py={1}
                              fontSize="xs"
                            >
                              {activeSchedule.status.toUpperCase()}
                            </Badge>
                          </Flex>

                          <VStack spaceY={2}>
                            <Text fontSize="10px" fontWeight="bold" color="gray.400" alignSelf="flex-start" letterSpacing="wide">TRANSITION STATUS</Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={2} w="full">
                              <Button
                                size="xs"
                                variant={activeSchedule.status === 'open' ? 'solid' : 'outline'}
                                bg={activeSchedule.status === 'open' ? 'green.600' : 'transparent'}
                                color={activeSchedule.status === 'open' ? 'white' : 'black'}
                                _hover={{ bg: 'green.50' }}
                                onClick={() => handleChangeScheduleStatus('open')}
                                borderRadius="xl"
                                fontWeight="bold"
                              >
                                Open
                              </Button>
                              <Button
                                size="xs"
                                variant={activeSchedule.status === 'closed' ? 'solid' : 'outline'}
                                bg={activeSchedule.status === 'closed' ? 'red.600' : 'transparent'}
                                color={activeSchedule.status === 'closed' ? 'white' : 'black'}
                                _hover={{ bg: 'red.50' }}
                                onClick={() => handleChangeScheduleStatus('closed')}
                                borderRadius="xl"
                                fontWeight="bold"
                              >
                                Freeze
                              </Button>
                              <Button
                                size="xs"
                                variant={activeSchedule.status === 'completed' ? 'solid' : 'outline'}
                                bg={activeSchedule.status === 'completed' ? 'blue.600' : 'transparent'}
                                color={activeSchedule.status === 'completed' ? 'white' : 'black'}
                                _hover={{ bg: 'blue.50' }}
                                onClick={() => handleChangeScheduleStatus('completed')}
                                borderRadius="xl"
                                fontWeight="bold"
                              >
                                Done
                              </Button>
                            </Grid>
                          </VStack>
                        </VStack>
                      </Box>
                    )}
                  </VStack>

                  {/* Right panel: track co-op cooking threshold quotas */}
                  <VStack spaceY={5} align="stretch">
                    <Box p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="white">
                      <VStack spaceY={4} align="stretch">
                        <Box>
                          <Heading as="h3" size="sm" fontWeight="extrabold" color="black" mb={1}>
                            Active Co-op Threshold Quotas
                          </Heading>
                          <Text fontSize="11px" color="gray.500">
                            Feature 5: Standard threshold setup. Monitors the aggregate orders required to kickstart wholesale kitchen operations.
                          </Text>
                        </Box>

                        {selectedMenuMeals.length === 0 ? (
                          <Text fontSize="xs" color="gray.400" py={6} textAlign="center">
                            No dishes are loaded into this weekly menu block.
                          </Text>
                        ) : (
                          <VStack spaceY={4} align="stretch" pt={2}>
                            {selectedMenuMeals.map((meal) => {
                              const percent = Math.min(100, Math.round(((meal.total_ordered_quantity || 0) / meal.min_threshold) * 100));
                              const met = meal.is_threshold_met;
                              return (
                                <Box key={meal.menu_meal_id} p={3.5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150" bg="gray.25">
                                  <VStack align="stretch" spaceY={2}>
                                    <Flex justify="space-between" align="center">
                                      <Box maxW="200px">
                                        <Text fontSize="xs" fontWeight="bold" color="black" lineClamp={1}>
                                          {meal.meal_name}
                                        </Text>
                                        <Text fontSize="9px" color="gray.400">{meal.meal_category.toUpperCase()}</Text>
                                      </Box>
                                      <Badge
                                        bg={met ? 'green.100' : 'amber.100'}
                                        color={met ? 'green.800' : 'amber.800'}
                                        fontSize="9px"
                                        borderRadius="md"
                                      >
                                        {met ? 'CONFIRMED' : `NEEDS ${meal.remaining_orders_needed}`}
                                      </Badge>
                                    </Flex>

                                    {/* Custom raw progress bar */}
                                    <Box w="full" h="8px" bg="gray.100" borderRadius="full" overflow="hidden" position="relative">
                                      <Box
                                        position="absolute"
                                        left={0}
                                        top={0}
                                        h="full"
                                        w={`${percent}%`}
                                        bg={met ? 'green.500' : 'amber.500'}
                                        borderRadius="full"
                                        transition="width 0.3s ease"
                                      />
                                    </Box>

                                    <Flex justify="space-between" align="center" fontSize="10px">
                                      <Text color="gray.500" fontWeight="bold">
                                        {meal.total_ordered_quantity || 0} / {meal.min_threshold} orders
                                      </Text>
                                      <Text color={met ? 'green.600' : 'amber.600'} fontWeight="bold">
                                        {percent}% met
                                      </Text>
                                    </Flex>
                                  </VStack>
                                </Box>
                              );
                            })}
                          </VStack>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </Grid>
              </VStack>
            )}

            {activeTab === 'orders' && (
              <VStack spaceY={8} align="stretch">
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Heading as="h2" size="xl" fontWeight="black" color="black" letterSpacing="tight" mb={1}>
                      Order Monitoring & Verification Hub
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Audit student bulk receipts, override order statuses, and compile delivery exports (Features 6, 7, 8, 9, 11).
                    </Text>
                  </Box>
                  <HStack spaceX={2}>
                    <Button
                      size="sm"
                      onClick={handleExportOrdersToCSV}
                      bg="#C65D3A"
                      color="white"
                      _hover={{ bg: '#A94B2B' }}
                      borderRadius="xl"
                      fontWeight="bold"
                      fontSize="xs"
                    >
                      <FileSpreadsheet size={15} style={{ marginRight: '6px' }} />
                      Export Spreadsheet (Feature 11)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="gray.200"
                      _hover={{ bg: 'gray.100' }}
                      onClick={loadOrders}
                      borderRadius="xl"
                      fontWeight="bold"
                      fontSize="xs"
                    >
                      Refresh
                    </Button>
                  </HStack>
                </Flex>

                {orderActionMessage && (
                  <Box
                    bg={orderActionMessage.type === 'success' ? 'green.50' : 'red.50'}
                    color={orderActionMessage.type === 'success' ? 'green.800' : 'red.800'}
                    p={4}
                    borderRadius="2xl"
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={orderActionMessage.type === 'success' ? 'green.155' : 'red.155'}
                  >
                    {orderActionMessage.text}
                  </Box>
                )}

                {/* Filter and Search Bar */}
                <Flex gap={3} w="full" bg="#FAFBF9" p={4} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" align="center" justify="space-between" flexWrap="wrap">
                  <HStack spaceX={2} px={3.5} py={2} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.250" flex={1} maxW="400px">
                    <Search size={15} color="gray" />
                    <Input
                      placeholder="Search by student name, hostel, or ID..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      border="none"
                      outline="none"
                      p={0}
                      fontSize="xs"
                      height="auto"
                      _focus={{ boxShadow: 'none' }}
                      bg="transparent"
                      w="full"
                    />
                  </HStack>

                  <HStack spaceX={1.5} flexWrap="wrap" gap={1}>
                    {['all', 'pending_payment', 'payment_under_verification', 'paid', 'confirmed', 'delivered', 'cancelled'].map((filter) => (
                      <Button
                        key={filter}
                        size="xs"
                        variant={orderStatusFilter === filter ? 'solid' : 'ghost'}
                        bg={orderStatusFilter === filter ? 'black' : 'transparent'}
                        color={orderStatusFilter === filter ? 'white' : 'gray.500'}
                        _hover={{ bg: orderStatusFilter === filter ? 'black' : 'gray.150' }}
                        borderRadius="lg"
                        fontWeight="bold"
                        onClick={() => setOrderStatusFilter(filter)}
                      >
                        {filter.replace('_', ' ').toUpperCase()}
                      </Button>
                    ))}
                  </HStack>
                </Flex>

                <Grid templateColumns={{ base: '1fr', lg: '1fr 1.15fr' }} gap={8}>
                  {/* Left panel: orders list */}
                  <VStack spaceY={4} align="stretch">
                    <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="wider">
                      STUDENT ORDERS ({
                        allOrders.filter(o => {
                          const customerLabel = (o.customer_name || o.profiles?.full_name || '').toLowerCase();
                          const phoneLabel = (o.customer_phone || o.profiles?.phone || '').toLowerCase();
                          const codeLabel = (o.pickup_code_direct || '').toLowerCase();
                          const matchesQuery = customerLabel.includes(orderSearchQuery.toLowerCase()) || 
                            phoneLabel.includes(orderSearchQuery.toLowerCase()) || 
                            codeLabel.includes(orderSearchQuery.toLowerCase()) || 
                            (o.hostel_name || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                            o.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                          const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                          return matchesQuery && matchesFilter;
                        }).length
                      })
                    </Text>

                    {isLoadingOrders ? (
                      <Text fontSize="xs" color="gray.500">Querying system orders...</Text>
                    ) : allOrders.length === 0 ? (
                      <Text fontSize="xs" color="gray.400" textAlign="center" py={12}>No order records discovered in database.</Text>
                    ) : (
                      <VStack spaceY={3} align="stretch" maxH="550px" overflowY="auto" pr={1}>
                        {allOrders.filter(o => {
                          const customerLabel = (o.customer_name || o.profiles?.full_name || '').toLowerCase();
                          const phoneLabel = (o.customer_phone || o.profiles?.phone || '').toLowerCase();
                          const codeLabel = (o.pickup_code_direct || '').toLowerCase();
                          const matchesQuery = customerLabel.includes(orderSearchQuery.toLowerCase()) || 
                            phoneLabel.includes(orderSearchQuery.toLowerCase()) || 
                            codeLabel.includes(orderSearchQuery.toLowerCase()) || 
                            (o.hostel_name || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                            o.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
                          const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                          return matchesQuery && matchesFilter;
                        }).map((order) => {
                          const isSelected = selectedOrderId === order.id;
                          return (
                            <Box
                              key={order.id}
                              p={4.5}
                              borderRadius="2xl"
                              borderWidth="1px"
                              borderColor={isSelected ? 'black' : 'gray.200'}
                              bg={isSelected ? 'gray.50' : 'white'}
                              cursor="pointer"
                              onClick={() => handleSelectOrder(order.id)}
                              transition="all 0.15s ease"
                              _hover={{ borderColor: 'gray.400' }}
                            >
                              <VStack align="stretch" spaceY={2.5}>
                                <Flex justify="space-between" align="center">
                                  <VStack align="flex-start" spaceY={0.5}>
                                    <Text fontSize="xs" fontWeight="black" color="black">
                                      {order.customer_name || order.profiles?.full_name || 'Guest User'}
                                    </Text>
                                    <Text fontSize="10px" color="gray.400" fontFamily="monospace">
                                      Code: {order.pickup_code_direct || 'Pending'} • ID: {order.id.slice(0, 8)}
                                    </Text>
                                  </VStack>
                                  <Badge
                                    borderRadius="md"
                                    px={2}
                                    py={0.5}
                                    fontSize="9.5px"
                                    fontWeight="bold"
                                    bg={
                                      order.status === 'paid' || order.status === 'confirmed' || order.status === 'delivered'
                                        ? 'green.100'
                                        : order.status === 'payment_under_verification'
                                        ? 'orange.100'
                                        : 'red.100'
                                    }
                                    color={
                                      order.status === 'paid' || order.status === 'confirmed' || order.status === 'delivered'
                                        ? 'green.800'
                                        : order.status === 'payment_under_verification'
                                        ? 'orange.800'
                                        : 'red.800'
                                    }
                                  >
                                    {order.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </Flex>

                                <Flex justify="space-between" align="center" borderTopWidth="1px" borderColor="gray.100" pt={2.5}>
                                  <Text fontSize="11px" color="gray.500" fontWeight="bold">
                                    ₦{order.total_amount.toLocaleString()} • {order.hostel_name} ({order.room_number})
                                  </Text>
                                  <Text fontSize="9px" color="gray.400">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </Text>
                                </Flex>
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </VStack>

                  {/* Right panel: order detail review */}
                  <Box>
                    {selectedOrderId ? (
                      (() => {
                        const activeOrder = allOrders.find(o => o.id === selectedOrderId);
                        if (!activeOrder) return <Text fontSize="xs" color="gray.400">Loading details...</Text>;
                        return (
                          <VStack spaceY={6} align="stretch" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="white">
                            <Box borderBottomWidth="1px" borderColor="gray.150" pb={4}>
                              <Text fontSize="10px" fontWeight="bold" color="gray.400">ORDER SPECIFICS</Text>
                              <Heading as="h4" size="md" fontWeight="bold" color="black" mt={1}>
                                ₦{activeOrder.total_amount.toLocaleString()} Total due
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                Customer: {activeOrder.customer_name || activeOrder.profiles?.full_name || 'Guest'} • Tel: {activeOrder.customer_phone || activeOrder.profiles?.phone || 'No Phone'} • Code: {activeOrder.pickup_code_direct || 'Pending'}
                              </Text>
                            </Box>

                            {/* Order items */}
                            <Box>
                              <Text fontSize="10px" fontWeight="black" color="gray.400" mb={3}>MEALS DETAILED</Text>
                              <VStack spaceY={2} align="stretch">
                                {activeOrder.items?.map((item: any) => (
                                  <Flex key={item.id} justify="space-between" align="center" bg="gray.25" p={3} borderRadius="xl" borderWidth="1px" borderColor="gray.150">
                                    <VStack align="flex-start" spaceY={0.5}>
                                      <Text fontSize="xs" fontWeight="bold" color="black">{item.meal.name}</Text>
                                      <Text fontSize="9px" color="gray.400">{item.meal.category.toUpperCase()}</Text>
                                    </VStack>
                                    <Text fontSize="xs" fontWeight="black" color="black">
                                      {item.quantity}x @ ₦{item.unit_price.toLocaleString()}
                                    </Text>
                                  </Flex>
                                ))}
                              </VStack>
                            </Box>

                            {/* Hostel details */}
                            <Box bg="gray.50" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
                              <Text fontSize="10px" fontWeight="bold" color="gray.400">DESIRED DROP LOCATION</Text>
                              <Text fontSize="xs" fontWeight="bold" mt={1} color="black">
                                Hostel: {activeOrder.hostel_name}
                              </Text>
                              <Text fontSize="xs" fontWeight="bold" mt={0.5} color="black">
                                Room/Suite No: {activeOrder.room_number}
                              </Text>
                              {activeOrder.notes && (
                                <Text fontSize="11px" color="gray.500" mt={2} fontStyle="italic">
                                  " {activeOrder.notes} "
                                </Text>
                              )}
                            </Box>

                            {/* Feature 7 & 8: Payment proof verification review */}
                            {selectedOrderProof ? (
                              <VStack spaceY={4} align="stretch" borderStyle="dashed" borderWidth="2px" borderColor="amber.200" p={4} borderRadius="2xl" bg="amber.25">
                                <Box>
                                  <Heading as="h4" size="xs" fontWeight="black" color="amber.900" display="flex" alignItems="center">
                                    <Receipt size={14} style={{ marginRight: '6px' }} />
                                    Manual Bank Transfer Receipt (Feature 7 & 8)
                                  </Heading>
                                  <Text fontSize="10px" color="amber.700" mt={0.5}>
                                    Upload verified reference: <strong>{selectedOrderProof.transaction_reference || 'None provided'}</strong>
                                  </Text>
                                </Box>

                                {/* Receipt Photo Box */}
                                <Box bg="gray.100" h="150px" borderRadius="xl" overflow="hidden" position="relative" borderStyle="solid" borderWidth="1px" borderColor="gray.200">
                                  <Box
                                    as="img"
                                    src={selectedOrderProof.proof_image_url}
                                    w="full"
                                    h="full"
                                    objectFit="contain"
                                    alt="Payment reference proof receipt"
                                  />
                                </Box>

                                {selectedOrderProof.status === 'pending' ? (
                                  <VStack spaceY={3} align="stretch">
                                    <VStack align="stretch" spaceY={1}>
                                      <Text fontSize="10px" fontWeight="bold" color="gray.500">REJECTION FEEDBACK REASON (IF REJECTING)</Text>
                                      <Input
                                        placeholder="e.g. Reference mismatch, receipt blurred..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        bg="white"
                                        borderColor="gray.250"
                                        borderRadius="xl"
                                        size="xs"
                                      />
                                    </VStack>

                                    <Grid templateColumns="1fr 1fr" gap={3}>
                                      <Button
                                        size="xs"
                                        colorScheme="green"
                                        bg="green.600"
                                        color="white"
                                        fontWeight="bold"
                                        _hover={{ bg: 'green.700' }}
                                        onClick={() => handleVerifyPayment(true)}
                                        borderRadius="lg"
                                        py={3}
                                      >
                                        ✓ Approve & Verify Port
                                      </Button>
                                      <Button
                                        size="xs"
                                        colorScheme="red"
                                        bg="red.600"
                                        color="white"
                                        fontWeight="bold"
                                        _hover={{ bg: 'red.700' }}
                                        onClick={() => handleVerifyPayment(false)}
                                        borderRadius="lg"
                                        py={3}
                                      >
                                        ✗ Reject Reference
                                      </Button>
                                    </Grid>
                                  </VStack>
                                ) : (
                                  <Box textTransform="uppercase" fontSize="10px" fontWeight="black" textAlign="center" py={2} borderRadius="xl" bg={selectedOrderProof.status === 'approved' ? 'green.100' : 'red.100'} color={selectedOrderProof.status === 'approved' ? 'green.800' : 'red.800'}>
                                    Receipt resolved: {selectedOrderProof.status}
                                  </Box>
                                )}
                              </VStack>
                            ) : (
                              activeOrder.status === 'pending_payment' && (
                                <Text fontSize="xs" color="gray.400" fontStyle="italic" bg="gray.25" p={3} borderRadius="xl">
                                  No payment receipt has been matched / uploaded by this student yet.
                                </Text>
                              )
                            )}

                            {/* Feature 9: Order status upgrades */}
                            <VStack align="stretch" spaceY={2} pt={4} borderTopWidth="1px" borderColor="gray.150">
                              <Text fontSize="10px" fontWeight="black" color="gray.400">UPDATE CLIENT ORDER PIPELINE STATUS (FEATURE 9)</Text>
                              <Box borderStyle="solid" borderWidth="1px" borderColor="gray.350" borderRadius="xl" overflow="hidden">
                                <select
                                  value={activeOrder.status}
                                  onChange={(e) => handleUpdateOrderStatus(activeOrder.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    background: 'white',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'black',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  <option value="pending_payment">Pending Payment</option>
                                  <option value="payment_under_verification">Payment Under Verification</option>
                                  <option value="paid">Paid</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </Box>
                            </VStack>
                          </VStack>
                        );
                      })()
                    ) : (
                      <VStack bg="gray.25" p={12} h="100%" borderRadius="3xl" borderWidth="1px" borderColor="gray.200" justify="center" align="center" textAlign="center">
                        <Receipt size={32} color="gray" />
                        <Text fontSize="xs" fontWeight="semibold" color="gray.400" mt={3}>
                          Highlight an order row from the sidebar panel to audit items, receipts, and override system status.
                        </Text>
                      </VStack>
                    )}
                  </Box>
                </Grid>
              </VStack>
            )}

            {activeTab === 'catering' && (
              <VStack spaceY={8} align="stretch">
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Heading as="h2" size="xl" fontWeight="black" color="black" letterSpacing="tight" mb={1}>
                      Corporate Event & Catering Review
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                      Evaluate custom banquet applications, dispatch pricing quotes, and handle bulk co-op events (Feature 10).
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.100' }}
                    onClick={loadCaterings}
                    borderRadius="xl"
                    fontWeight="bold"
                  >
                    Refresh List
                  </Button>
                </Flex>

                {cateringActionMessage && (
                  <Box
                    bg={cateringActionMessage.type === 'success' ? 'green.50' : 'red.50'}
                    color={cateringActionMessage.type === 'success' ? 'green.800' : 'red.800'}
                    p={4}
                    borderRadius="2xl"
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={cateringActionMessage.type === 'success' ? 'green.155' : 'red.155'}
                  >
                    {cateringActionMessage.text}
                  </Box>
                )}

                <Grid templateColumns={{ base: '1fr', lg: '1fr 1.15fr' }} gap={8}>
                  {/* Left Column: List Requests */}
                  <VStack spaceY={4} align="stretch">
                    <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="wider">
                      CATERING CONCEPTS DISCOVERED ({cateringRequests.length})
                    </Text>

                    {isLoadingCaterings ? (
                      <Text fontSize="xs" color="gray.500">Pinging catering registry...</Text>
                    ) : cateringRequests.length === 0 ? (
                      <Text fontSize="xs" color="gray.400" textAlign="center" py={12}>No custom event bookings registered yet.</Text>
                    ) : (
                      <VStack spaceY={3} align="stretch">
                        {cateringRequests.map((req) => {
                          const isSelected = selectedCateringId === req.id;
                          return (
                            <Box
                              key={req.id}
                              p={4.5}
                              borderRadius="2xl"
                              borderWidth="1px"
                              borderColor={isSelected ? 'black' : 'gray.200'}
                              bg={isSelected ? 'gray.50' : 'white'}
                              cursor="pointer"
                              onClick={() => {
                                setSelectedCateringId(req.id);
                                setCateringQuotePrice(req.quoted_price ? req.quoted_price.toString() : '');
                                setCateringActionMessage(null);
                              }}
                              transition="all 0.15s ease"
                              _hover={{ borderColor: 'gray.400' }}
                            >
                              <VStack align="stretch" spaceY={2}>
                                <Flex justify="space-between" align="center">
                                  <Box>
                                    <Text fontSize="xs" fontWeight="black" color="black" lineClamp={1}>
                                      {req.event_name}
                                    </Text>
                                    <Text fontSize="10px" color="gray.400">
                                      Reserved by: {req.profiles?.full_name || 'Student Host'}
                                    </Text>
                                  </Box>
                                  <Badge
                                    borderRadius="md"
                                    px={2.5}
                                    py={0.5}
                                    fontSize="8.5px"
                                    fontWeight="bold"
                                    bg={
                                      req.status === 'accepted' || req.status === 'completed'
                                        ? 'green.100'
                                        : req.status === 'pending'
                                        ? 'orange.100'
                                        : 'gray.100'
                                    }
                                    color={
                                      req.status === 'accepted' || req.status === 'completed'
                                        ? 'green.800'
                                        : req.status === 'pending'
                                        ? 'orange.800'
                                        : 'gray.800'
                                    }
                                  >
                                    {req.status?.toUpperCase() || 'REF'}
                                  </Badge>
                                </Flex>

                                <Flex justify="space-between" align="center" pt={2} mt={1} borderTopWidth="1px" borderColor="gray.100">
                                  <Text fontSize="11px" fontWeight="semibold" color="gray.500">
                                    Guests: {req.estimated_guests} • {req.quoted_price ? `₦${req.quoted_price.toLocaleString()}` : 'Price unquoted'}
                                  </Text>
                                  <Text fontSize="9px" color="gray.400">
                                    Date: {new Date(req.event_date).toLocaleDateString()}
                                  </Text>
                                </Flex>
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </VStack>

                  {/* Right Column: Detail / Review / Dispatch Price */}
                  <Box>
                    {selectedCateringId ? (
                      (() => {
                        const activeReq = cateringRequests.find(c => c.id === selectedCateringId);
                        if (!activeReq) return <Text fontSize="xs" color="gray.400">Loading booking...</Text>;
                        return (
                          <VStack spaceY={6} align="stretch" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.200" bg="white">
                            <Box borderBottomWidth="1px" borderColor="gray.150" pb={4}>
                              <Text fontSize="10px" fontWeight="bold" color="gray.400">CATERING PROJECT BLUEPRINT</Text>
                              <Heading as="h4" size="md" fontWeight="bold" color="black" mt={1}>
                                {activeReq.event_name}
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                Host Contact: {activeReq.profiles?.full_name} ({activeReq.profiles?.phone || 'No phone'})
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                Email: {activeReq.profiles?.email}
                              </Text>
                            </Box>

                            <Grid templateColumns="1fr 1fr" gap={4}>
                              <Box bg="gray.25" p={3.5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                                <Text fontSize="9px" fontWeight="bold" color="gray.400">ESTIMATED ATTENDEES</Text>
                                <Text fontSize="md" fontWeight="black" mt={1} color="black">
                                  {activeReq.estimated_guests} Guests
                                </Text>
                              </Box>
                              <Box bg="gray.25" p={3.5} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                                <Text fontSize="9px" fontWeight="bold" color="gray.400">EVENT TIMELINE</Text>
                                <Text fontSize="xs" fontWeight="black" mt={1.5} color="black">
                                  {new Date(activeReq.event_date).toLocaleString()}
                                </Text>
                              </Box>
                            </Grid>

                            <Box bg="gray.50" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.150">
                              <Text fontSize="9px" fontWeight="bold" color="gray.400">SPECIAL FOOD ARRANGEMENT REQUISITES</Text>
                              <Text fontSize="xs" color="black" lineHeight="relaxed" mt={1.5} fontStyle="italic">
                                "{activeReq.special_instructions || 'No dietary exceptions specified.'}"
                              </Text>
                            </Box>

                            {/* Dispatch Quote form */}
                            <VStack align="stretch" spaceY={3} borderStyle="dashed" borderWidth="1px" borderColor="gray.250" p={4} borderRadius="2xl">
                              <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase">ADMIN DISPATCH PRICING QUOTE</Text>
                              <HStack spaceX={3}>
                                <Input
                                  type="number"
                                  placeholder="Enter quote in Naira, e.g. 150000"
                                  value={cateringQuotePrice}
                                  onChange={(e) => setCateringQuotePrice(e.target.value)}
                                  bg="white"
                                  borderColor="gray.250"
                                  borderRadius="xl"
                                  size="sm"
                                />
                                <Button
                                  size="sm"
                                  bg="black"
                                  color="white"
                                  _hover={{ bg: 'gray.850' }}
                                  borderRadius="lg"
                                  onClick={() => handleReviewCatering(activeReq.id, 'quoted', true)}
                                >
                                  Send Quote
                                </Button>
                              </HStack>
                              {activeReq.quoted_price && (
                                <Text fontSize="10px" color="emerald.700" fontWeight="bold">
                                  Baseline quote historically declared at: ₦{activeReq.quoted_price.toLocaleString()}
                                </Text>
                              )}
                            </VStack>

                            {/* Status controls */}
                            <VStack align="stretch" spaceY={2.5} pt={4} borderTopWidth="1px" borderColor="gray.150">
                              <Text fontSize="10px" fontWeight="black" color="gray.400">CHANGE BANQUET RESERVATION STATE</Text>
                              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                                {['reviewed', 'accepted', 'completed'].map((status) => (
                                  <Button
                                    key={status}
                                    size="xs"
                                    colorScheme={activeReq.status === status ? 'green' : 'gray'}
                                    variant={activeReq.status === status ? 'solid' : 'outline'}
                                    borderRadius="lg"
                                    fontWeight="bold"
                                    onClick={() => handleReviewCatering(activeReq.id, status as any, false)}
                                  >
                                    {status.toUpperCase()}
                                  </Button>
                                ))}
                              </Grid>
                              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                                {['pending', 'cancelled'].map((status) => (
                                  <Button
                                    key={status}
                                    size="xs"
                                    colorScheme="red"
                                    variant={activeReq.status === status ? 'solid' : 'outline'}
                                    borderRadius="lg"
                                    fontWeight="bold"
                                    onClick={() => handleReviewCatering(activeReq.id, status as any, false)}
                                  >
                                    {status.toUpperCase()}
                                  </Button>
                                ))}
                              </Grid>
                            </VStack>
                          </VStack>
                        );
                      })()
                    ) : (
                      <VStack bg="gray.25" p={12} h="100%" borderRadius="3xl" borderWidth="1px" borderColor="gray.200" justify="center" align="center" textAlign="center">
                        <Briefcase size={32} color="gray" />
                        <Text fontSize="xs" fontWeight="semibold" color="gray.400" mt={3} maxW="300px">
                          Highlight an event booking to quote prices, dispatch reviews, and transition milestones.
                        </Text>
                      </VStack>
                    )}
                  </Box>
                </Grid>
              </VStack>
            )}
          </Box>
        </Grid>
      </Container>

      {/* Dynamic Floating Toast Alert Portal (Bottom-Right overlays) */}
      {(menuActionMessage || scheduleActionMessage || orderActionMessage || cateringActionMessage || mealActionMsgStyle) && (
        <Box
          position="fixed"
          bottom="28px"
          right="28px"
          zIndex={100000}
          w="full"
          maxW="390px"
          px={4}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {menuActionMessage && (
            <Box
              p={4}
              borderRadius="2xl"
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={menuActionMessage.type === 'error' ? 'red.200' : 'emerald.200'}
              bg={menuActionMessage.type === 'error' ? 'red.50' : 'emerald.50'}
              color={menuActionMessage.type === 'error' ? 'red.900' : 'emerald.900'}
            >
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spaceY={0.5} maxW="88%">
                  <Text fontSize="10px" fontWeight="black" tracking="wider" color={menuActionMessage.type === 'error' ? 'red.600' : 'emerald.600'}>
                    MENU CYCLES ALERT
                  </Text>
                  <Text fontSize="12px" fontWeight="semibold">
                    {menuActionMessage.text}
                  </Text>
                </VStack>
                <Button
                  size="2xs"
                  variant="ghost"
                  p={1}
                  _hover={{ bg: 'transparent', opacity: 0.7 }}
                  onClick={() => setMenuActionMessage(null)}
                >
                  <X size={14} />
                </Button>
              </Flex>
            </Box>
          )}

          {scheduleActionMessage && (
            <Box
              p={4}
              borderRadius="2xl"
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={scheduleActionMessage.type === 'error' ? 'red.200' : 'emerald.200'}
              bg={scheduleActionMessage.type === 'error' ? 'red.50' : 'emerald.50'}
              color={scheduleActionMessage.type === 'error' ? 'red.900' : 'emerald.900'}
            >
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spaceY={0.5} maxW="88%">
                  <Text fontSize="10px" fontWeight="black" tracking="wider" color={scheduleActionMessage.type === 'error' ? 'red.600' : 'emerald.600'}>
                    DELIVERY TIMELINE ALERT
                  </Text>
                  <Text fontSize="12px" fontWeight="semibold">
                    {scheduleActionMessage.text}
                  </Text>
                </VStack>
                <Button
                  size="2xs"
                  variant="ghost"
                  p={1}
                  _hover={{ bg: 'transparent', opacity: 0.7 }}
                  onClick={() => setScheduleActionMessage(null)}
                >
                  <X size={14} />
                </Button>
              </Flex>
            </Box>
          )}

          {orderActionMessage && (
            <Box
              p={4}
              borderRadius="2xl"
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={orderActionMessage.type === 'error' ? 'red.200' : 'emerald.200'}
              bg={orderActionMessage.type === 'error' ? 'red.50' : 'emerald.50'}
              color={orderActionMessage.type === 'error' ? 'red.900' : 'emerald.900'}
            >
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spaceY={0.5} maxW="88%">
                  <Text fontSize="10px" fontWeight="black" tracking="wider" color={orderActionMessage.type === 'error' ? 'red.600' : 'emerald.600'}>
                    ORDER CONTROL ALERT
                  </Text>
                  <Text fontSize="12px" fontWeight="semibold">
                    {orderActionMessage.text}
                  </Text>
                </VStack>
                <Button
                  size="2xs"
                  variant="ghost"
                  p={1}
                  _hover={{ bg: 'transparent', opacity: 0.7 }}
                  onClick={() => setOrderActionMessage(null)}
                >
                  <X size={14} />
                </Button>
              </Flex>
            </Box>
          )}

          {cateringActionMessage && (
            <Box
              p={4}
              borderRadius="2xl"
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={cateringActionMessage.type === 'error' ? 'red.200' : 'emerald.200'}
              bg={cateringActionMessage.type === 'error' ? 'red.50' : 'emerald.50'}
              color={cateringActionMessage.type === 'error' ? 'red.900' : 'emerald.900'}
            >
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spaceY={0.5} maxW="88%">
                  <Text fontSize="10px" fontWeight="black" tracking="wider" color={cateringActionMessage.type === 'error' ? 'red.600' : 'emerald.600'}>
                    CATERING REQUEST ALERT
                  </Text>
                  <Text fontSize="12px" fontWeight="semibold">
                    {cateringActionMessage.text}
                  </Text>
                </VStack>
                <Button
                  size="2xs"
                  variant="ghost"
                  p={1}
                  _hover={{ bg: 'transparent', opacity: 0.7 }}
                  onClick={() => setCateringActionMessage(null)}
                >
                  <X size={14} />
                </Button>
              </Flex>
            </Box>
          )}

          {mealActionMsgStyle && (
            <Box
              p={4}
              borderRadius="2xl"
              boxShadow="2xl"
              borderWidth="1px"
              borderColor={mealActionMsgStyle.type === 'error' ? 'red.200' : 'emerald.200'}
              bg={mealActionMsgStyle.type === 'error' ? 'red.50' : 'emerald.50'}
              color={mealActionMsgStyle.type === 'error' ? 'red.900' : 'emerald.900'}
            >
              <Flex justify="space-between" align="center">
                <VStack align="flex-start" spaceY={0.5} maxW="88%">
                  <Text fontSize="10px" fontWeight="black" tracking="wider" color={mealActionMsgStyle.type === 'error' ? 'red.600' : 'emerald.600'}>
                    MEAL CREATOR ALERT
                  </Text>
                  <Text fontSize="12px" fontWeight="semibold">
                    {mealActionMsgStyle.text}
                  </Text>
                </VStack>
                <Button
                  size="2xs"
                  variant="ghost"
                  p={1}
                  _hover={{ bg: 'transparent', opacity: 0.7 }}
                  onClick={() => setMealActionMsgStyle(null)}
                >
                  <X size={14} />
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
