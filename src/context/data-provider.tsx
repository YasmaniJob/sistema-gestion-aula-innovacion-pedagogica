

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Loan, LoanUser, Resource, Category, Reservation, Meeting, Section, Grade, PedagogicalHour, Area, DamageReport, SuggestionReport, MissingResourceReport, AgreementTask } from '@/domain/types';
import { useToast } from '@/hooks/use-toast';
import { localCache, withCache, CacheKeys, CacheConfigs } from '@/services/local-cache.service';
import { 
    getUsers, 
    addUser as addUserSvc, 
    updateUser as updateUserSvc,
    deleteUser as deleteUserSvc,
    addMultipleUsers as addMultipleUsersSvc,
    registerUser as registerUserSvc
} from '@/services/user.service';
import * as loanService from '@/services/loan.service';
import * as resourceService from '@/services/resource.service';
import * as reservationService from '@/services/reservation.service';
import * as meetingService from '@/services/meeting.service';
import * as areaService from '@/services/area.service';
import * as gradeService from '@/services/grade.service';
import * as pedagogicalHourService from '@/services/pedagogical-hour.service';
import * as settingsService from '@/services/settings.service';
import { signIn as signInSvc, signOut as signOutSvc, getCurrentUser, getSession } from '@/services/auth.client';
import { useRealtimeSubscriptions } from '@/hooks/use-realtime-subscriptions';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

interface AppSettings {
  appName: string;
  schoolName: string;
  logoUrl: string;
  primaryColor: string;
  isPublicRegistrationEnabled: boolean;
  backgroundImageUrl: string;
}

interface DataContextType {
  users: LoanUser[];
  resources: Resource[];
  categories: Category[];
  loans: Loan[];
  reservations: Reservation[];
  meetings: Meeting[];
  grades: Grade[];
  areas: Area[];
  pedagogicalHours: PedagogicalHour[];
  currentUser: LoanUser | null;
  isLoadingUser: boolean; 
  isLoadingData: boolean; 
  appSettings: AppSettings;
  updateAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<LoanUser | null>>;
  
  findUserById: (id: string) => LoanUser | undefined;
  
  addUser: (data: Omit<LoanUser, 'id'> & { password?: string }) => Promise<LoanUser>;
  registerUser: (data: Omit<LoanUser, 'id'> & { password?: string }) => Promise<LoanUser | null>;
  updateUser: (userId: string, data: Partial<Omit<LoanUser, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addMultipleUsers: (users: (Omit<LoanUser, 'id'> & { password?: string })[]) => Promise<void>;
  signIn: (credentials: {email: string, password: string}) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUserSession: () => Promise<void>;

  addLoan: (newLoan: Omit<Loan, 'id' | 'loanDate' | 'status'>, creatorRole: LoanUser['role']) => Promise<void>;
  approveLoan: (loanId: string) => Promise<void>;
  rejectLoan: (loanId: string) => Promise<void>;
  processReturn: (loanId: string, damageReports: Record<string, DamageReport>, suggestionReports: Record<string, SuggestionReport>, missingResources?: MissingResourceReport[]) => Promise<void>;

  addResource: (data: Omit<Resource, 'id' | 'name' | 'stock'> & { quantity: number }) => Promise<void>;
  updateResource: (resourceId: string, data: Partial<Omit<Resource, 'id'>>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  updateResourceStatus: (resourceId: string, status: Resource['status'], notes?: string) => Promise<void>;
  refreshResources: () => Promise<void>;
  refreshLoans: () => Promise<void>;
  addCategories: (categoryNames: string[]) => Promise<Category[] | null>;
  deleteCategory: (categoryName: string) => Promise<void>;

  addReservation: (newReservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => Promise<void>;
  refreshReservations: () => Promise<void>;

  addMeeting: (meetingData: Omit<Meeting, 'id' | 'date'>) => Promise<void>;
  toggleMeetingTaskStatus: (meetingId: string, taskId: string) => Promise<void>;

  addAreas: (names: string[]) => Promise<void>;
  updateArea: (areaId: string, newName: string) => Promise<void>;
  deleteArea: (areaId: string) => Promise<void>;
  
  addGrade: (name: string) => Promise<Grade | null>;
  deleteGrade: (gradeId: string) => Promise<void>;
  addSection: (gradeId: string, name: string) => Promise<void>;

  deleteSection: (sectionId: string) => Promise<void>;

  addPedagogicalHour: (name: string) => Promise<void>;
  deletePedagogicalHour: (hourId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

const defaultAppSettings: AppSettings = {
  appName: 'AIP',
  schoolName: 'Mi Institución Educativa',
  logoUrl: '',
  primaryColor: '#673ab7',
  isPublicRegistrationEnabled: false,
  backgroundImageUrl: '',
};

// Helper function to convert hex to HSL, moved here for global use
function hexToHSL(hex: string): { h: number, s: number, l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { 
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const applyPrimaryColor = (hex: string) => {
    if (typeof document === 'undefined') return;
    const hsl = hexToHSL(hex);
    if (hsl) {
      const root = document.documentElement;
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
};


export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<LoanUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentUser, setCurrentUser] = useState<LoanUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Cache timestamps to avoid unnecessary API calls
  const [lastReservationsUpdate, setLastReservationsUpdate] = useState<number>(0);
  const [lastUsersUpdate, setLastUsersUpdate] = useState<number>(0);
  const [lastRoomsUpdate, setLastRoomsUpdate] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds
  
  // Race condition prevention
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  
  // Debounce timers and operation control
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const operationLocksRef = useRef<Set<string>>(new Set());
  
  // Debounce utility
  const debounceOperation = useCallback((key: string, operation: () => void, delay: number = 1000) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(() => {
      operation();
      delete debounceTimersRef.current[key];
    }, delay);
  }, []);
  
  // Operation lock utility
  const withOperationLock = useCallback(async <T>(key: string, operation: () => Promise<T>): Promise<T | null> => {
    if (operationLocksRef.current.has(key)) {
      console.log(`Operation ${key} is already in progress, skipping`);
      return null;
    }
    
    operationLocksRef.current.add(key);
    try {
      return await operation();
    } finally {
      operationLocksRef.current.delete(key);
    }
  }, []);

  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [pedagogicalHours, setPedagogicalHours] = useState<PedagogicalHour[]>([]);

  const { toast } = useToast();
  const hasLoadedDataRef = useRef(false);

  // Function to reset data loading state
  const resetDataLoadingState = useCallback(() => {
    hasLoadedDataRef.current = false;
    setIsLoadingData(true);
  }, []);

  // Real-time subscriptions will be set up after function definitions

  // Optimización: Verificar sesión de Supabase y localStorage
  useEffect(() => {
    const checkUserSession = async () => {
        setIsLoadingUser(true);
        
        try {
            // Primero verificar si hay una sesión activa en Supabase
            const session = await getSession();
            
            if (session?.user) {
                // Si hay sesión activa, verificar si tenemos el perfil en localStorage
                const storedUser = localStorage.getItem('currentUser');
                
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        // Verificar que el usuario almacenado coincida con la sesión
                        if (parsedUser.id === session.user.id) {
                            console.log('DataProvider: Usuario válido encontrado en localStorage');
                            setCurrentUser(parsedUser);
                        } else {
                            console.log('DataProvider: Usuario en localStorage no coincide con sesión');
                            localStorage.removeItem('currentUser');
                            await signOutSvc(); // Limpiar sesión inconsistente
                        }
                    } catch (error) {
                        console.error("Error al parsear usuario de localStorage:", error);
                        localStorage.removeItem('currentUser');
                    }
                } else {
                    console.log('DataProvider: Sesión activa pero sin perfil local, cerrando sesión');
                    await signOutSvc();
                }
            } else {
                // No hay sesión activa, limpiar localStorage si existe
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    console.log('DataProvider: Limpiando usuario obsoleto de localStorage');
                    localStorage.removeItem('currentUser');
                }
                console.log('DataProvider: No hay sesión activa');
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            // En caso de error, limpiar todo
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
        } finally {
            setIsLoadingUser(false);
            console.log('DataProvider: Verificación de sesión completada');
        }
    };
    
    checkUserSession();
  }, []);

  // Separate useEffect for loading settings (always runs)
  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        console.log('Loading app settings...');
        const fetchedSettings = await settingsService.getAppSettings();
        if (fetchedSettings && isMounted) {
          setAppSettings(fetchedSettings);
          applyPrimaryColor(fetchedSettings.primaryColor);
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };
    
    loadSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Separate useEffect for loading app data (only runs when user session is resolved)
  useEffect(() => {
    let isMounted = true;
    
    const loadAppData = async () => {
      try {
        if (isLoadingUser || !isMounted) return;
        
        if (hasLoadedDataRef.current) {
          console.log('Data already loaded, skipping...');
          return;
        }
        
        hasLoadedDataRef.current = true;
        setIsLoadingData(true);
        console.log('Loading app data...');
        
        const [fetchedUsers, fetchedResources, fetchedCategories, fetchedLoans, fetchedReservations, fetchedMeetings, fetchedAreas, fetchedGrades, fetchedHours] = await Promise.allSettled([
          withCache(CacheKeys.USERS, () => getUsers(100, 0), CacheConfigs.USERS),
          withCache(CacheKeys.RESOURCES, () => resourceService.getResources(200, 0), CacheConfigs.RESOURCES),
          withCache(CacheKeys.CATEGORIES, () => resourceService.getCategories(), CacheConfigs.CATEGORIES),
          withCache(CacheKeys.LOANS, () => loanService.getLoans(), CacheConfigs.LOANS),
          withCache(CacheKeys.RESERVATIONS, () => reservationService.getReservations(), CacheConfigs.RESERVATIONS),
          withCache(CacheKeys.MEETINGS, () => meetingService.getMeetings(), CacheConfigs.MEETINGS),
          withCache(CacheKeys.AREAS, () => areaService.getAreas(), CacheConfigs.AREAS),
          withCache(CacheKeys.GRADES, () => gradeService.getGradesAndSections(), CacheConfigs.GRADES).catch(err => {
            console.warn('Grades service failed, using empty array:', err);
            return [];
          }),
          withCache(CacheKeys.PEDAGOGICAL_HOURS, () => pedagogicalHourService.getPedagogicalHours(), CacheConfigs.PEDAGOGICAL_HOURS).catch(err => {
            console.warn('Pedagogical hours service failed, using empty array:', err);
            return [];
          }),
        ]);
        
        // Handle results and log any errors
        const users = fetchedUsers.status === 'fulfilled' ? fetchedUsers.value || [] : [];
        const resources = fetchedResources.status === 'fulfilled' ? fetchedResources.value || [] : [];
        const categories = fetchedCategories.status === 'fulfilled' ? fetchedCategories.value || [] : [];
        const loans = fetchedLoans.status === 'fulfilled' ? fetchedLoans.value || [] : [];
        const reservations = fetchedReservations.status === 'fulfilled' ? fetchedReservations.value || [] : [];
        const meetings = fetchedMeetings.status === 'fulfilled' ? fetchedMeetings.value || [] : [];
        const areas = fetchedAreas.status === 'fulfilled' ? fetchedAreas.value || [] : [];
        const grades = fetchedGrades.status === 'fulfilled' ? fetchedGrades.value || [] : [];
        const hours = fetchedHours.status === 'fulfilled' ? fetchedHours.value || [] : [];
        
        // Log any failed requests
        if (fetchedUsers.status === 'rejected') console.error('Failed to load users:', fetchedUsers.reason);
        if (fetchedResources.status === 'rejected') console.error('Failed to load resources:', fetchedResources.reason);
        if (fetchedCategories.status === 'rejected') console.error('Failed to load categories:', fetchedCategories.reason);
        if (fetchedLoans.status === 'rejected') console.error('Failed to load loans:', fetchedLoans.reason);
        if (fetchedReservations.status === 'rejected') console.error('Failed to load reservations:', fetchedReservations.reason);
        if (fetchedMeetings.status === 'rejected') console.error('Failed to load meetings:', fetchedMeetings.reason);
        if (fetchedAreas.status === 'rejected') console.error('Failed to load areas:', fetchedAreas.reason);
        if (fetchedGrades.status === 'rejected') console.error('Failed to load grades:', fetchedGrades.reason);
        if (fetchedHours.status === 'rejected') console.error('Failed to load hours:', fetchedHours.reason);
        
        // Populate users first as they are needed for mapping other data
        const allUsers = users;
        setUsers(allUsers);
        
        // Now map other data that depends on users
        const userMap = new Map(allUsers.map(u => [u.id, u]));
        
        // Convert date strings back to Date objects for loans
        const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
        const processedLoans = loans.map(l => {
          const loanDate = new Date(l.loanDate);
          const returnDate = l.returnDate ? new Date(l.returnDate) : undefined;
          return {
            ...l,
            loanDate: isValidDate(loanDate) ? loanDate : new Date(),
            returnDate: returnDate && isValidDate(returnDate) ? returnDate : undefined,
            user: userMap.get(l.user_id) || { id: l.user_id, name: 'Usuario Desconocido', role: 'Docente' }
          };
        });
        
        setLoans(processedLoans as Loan[]);
        
        // Convert date strings back to Date objects for reservations
        const processedReservations = reservations.map(r => {
          const startTime = new Date(r.startTime);
          const endTime = r.endTime ? new Date(r.endTime) : undefined;
          return {
            ...r,
            startTime: isValidDate(startTime) ? startTime : new Date(),
            endTime: endTime && isValidDate(endTime) ? endTime : undefined,
            user: userMap.get(r.user_id) || { id: r.user_id, name: 'Usuario Desconocido', role: 'Docente' }
          };
        });
        
        // Convert date strings back to Date objects for meetings
        const processedMeetings = meetings.map(m => {
          const date = new Date(m.date);
          return {
            ...m,
            date: isValidDate(date) ? date : new Date()
          };
        });
        
        setReservations(processedReservations as Reservation[]);
        setCategories(categories);
        setMeetings(processedMeetings as Meeting[]);
        setResources(resources);
        setAreas(areas);
        setGrades(grades);
        setPedagogicalHours(hours);
        
        console.log('App data loaded successfully');
        if (isMounted) {
          setIsLoadingData(false);
        }
      } catch (error) {
        console.error('Error loading app data:', error);
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };
    
    // Only load data once when user session is resolved
    if (!isLoadingUser) {
      loadAppData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoadingUser]); // Keep this dependency but prevent re-execution with the condition above

  const updateAppSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = await settingsService.updateAppSettings(newSettings);
    if(updatedSettings) {
      setAppSettings(updatedSettings);
      applyPrimaryColor(updatedSettings.primaryColor);
    }
  }, []);

  const findUserById = (id: string) => {
    return users.find(u => u.id === id);
  };
  
  const addUser = useCallback(async (data: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser> => {
    const newUser = await addUserSvc(data);
    if (newUser) {
        setUsers(prev => [newUser, ...prev]);
        localCache.invalidate(CacheKeys.USERS);
        return newUser;
    }
    throw new Error("No se pudo crear el usuario.");
  }, []);
  
  const registerUser = useCallback(async (data: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser | null> => {
      const hasAdmins = users.some(u => u.role === 'Admin');
      if (hasAdmins && !appSettings.isPublicRegistrationEnabled) {
          throw new Error('El registro público de administradores no está habilitado.');
      }

      const newUser = await registerUserSvc(data);
      if (newUser) {
        setUsers(prev => [newUser, ...prev]);
      }
      return newUser;
  }, [users, appSettings.isPublicRegistrationEnabled]);

  const signIn = useCallback(async (credentials: {email: string, password: string}) => {
    try {
      const authUser = await signInSvc(credentials);
      
      if (authUser) {
        // Buscar el perfil del usuario en la lista de usuarios
        const userProfile = users.find(u => u.id === authUser.id);
        
        if (!userProfile) {
          throw new Error("El perfil de usuario no se encontró en la base de datos pública.");
        }
        
        // Actualizar estado y localStorage
        setCurrentUser(userProfile);
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
        
        // No redirigir automáticamente aquí
        // La redirección debe manejarse en el componente que llama a signIn
        
        return userProfile;
      } else {
        throw new Error("No se pudo obtener el usuario autenticado.");
      }
    } catch (error) {
      console.error('Error en signIn del contexto:', error);
      throw error;
    }
  }, [users]);
  
  const signOut = useCallback(async () => {
    try {
      await signOutSvc();
      
      // Limpiar estado local
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      
      // Resetear estado de carga para permitir nueva carga de datos
      resetDataLoadingState();
      
      console.log('DataProvider: Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así limpiar el estado local
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      resetDataLoadingState();
      throw error;
    }
  }, [resetDataLoadingState]);
  
  const refreshUserSession = useCallback(async () => {
    try {
      const session = await getSession();
      
      if (session?.user) {
        // Use existing users state instead of fetching fresh data to avoid loops
        const userProfile = users.find(u => u.id === session.user.id);
        
        if (userProfile) {
          setCurrentUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        } else {
          // Only fetch fresh data if user not found in current state
          try {
            const freshUsers = await getUsers();
            const freshUserProfile = freshUsers.find(u => u.id === session.user.id);
            
            if (freshUserProfile) {
              setCurrentUser(freshUserProfile);
              localStorage.setItem('currentUser', JSON.stringify(freshUserProfile));
            } else {
              console.warn('Perfil de usuario no encontrado para sesión activa');
              await signOut();
            }
          } catch (fetchError) {
            console.error('Error al obtener datos frescos del usuario:', fetchError);
            await signOut();
          }
        }
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Error al refrescar sesión de usuario:', error);
      await signOut();
    }
  }, [signOut]);

  const updateUser = useCallback(async (userId: string, data: Partial<Omit<LoanUser, 'id'>>) => {
    const updatedUser = await updateUserSvc(userId, data);
    if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    const success = await deleteUserSvc(userId);
    if (success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }
  }, []);
  
  const addMultipleUsers = useCallback(async (newUsersData: (Omit<LoanUser, 'id'> & { password?: string })[]) => {
    try {
        const newUsers = await addMultipleUsersSvc(newUsersData);
        if (newUsers && newUsers.length > 0) {
            setUsers(prev => [...prev, ...newUsers]);
        }
    } catch (error) {
        console.error("Failed to add multiple users in provider:", error);
        throw error;
    }
  }, []);
  
  const addLoan = useCallback(async (newLoanData: Omit<Loan, 'id'|'loanDate'|'status'>, creatorRole: LoanUser['role']) => {
    try {
      const newLoan = await loanService.addLoan(newLoanData, creatorRole);
      if (newLoan) {
        // Ensure dates are properly converted to Date objects
        const newLoanWithDates = {
          ...newLoan,
          loanDate: new Date(newLoan.loanDate),
          returnDate: newLoan.returnDate ? new Date(newLoan.returnDate) : undefined
        };
        setLoans(prev => [newLoanWithDates, ...prev]);
        
        if (newLoanWithDates.status === 'active') {
          const resourceIdsToUpdate = newLoanWithDates.resources.map(r => r.id);
          setResources(prevResources => 
            prevResources.map(resource => 
              resourceIdsToUpdate.includes(resource.id)
                ? { ...resource, status: 'prestado' }
                : resource
            )
          );
        }
      }
    } catch(error) {
        console.error("Failed to add loan in provider:", error);
        throw error;
    }
  }, []);

  const approveLoan = useCallback(async (loanId: string) => {
    try {
      console.log('Aprobando préstamo:', loanId);
      const result = await loanService.updateLoanStatus(loanId, 'active');
      console.log('Resultado de aprobación:', result);
      
      if (result && result.updatedLoan) {
          const updatedLoanWithDate = {
              ...result.updatedLoan,
              loanDate: new Date(result.updatedLoan.loanDate),
          };
        
          setLoans(prevLoans => prevLoans.map(l => l.id === loanId ? updatedLoanWithDate : l));
        
          if (result.updatedResources) {
              const updatedResourceMap = new Map(result.updatedResources.map(r => [r.id, r]));
              setResources(prevResources => 
                  prevResources.map(r => updatedResourceMap.get(r.id) || r)
              );
          }

          // Toast se maneja en el componente que llama esta función
      } else {
          console.error('No se recibió resultado válido del servicio');
          throw new Error('No se pudo aprobar el préstamo');
      }
    } catch (error) {
      console.error('Error en approveLoan:', error);
      throw error;
    }
  }, []);

  const rejectLoan = useCallback(async (loanId: string) => {
      const result = await loanService.updateLoanStatus(loanId, 'rejected');
      if (result && result.updatedLoan) {
        setLoans(prev => prev.map(l => l.id === loanId ? { ...result.updatedLoan, loanDate: new Date(result.updatedLoan.loanDate) } : l));
        // No need to update resources when rejecting - they were never marked as 'prestado'
      } else {
        throw new Error("El rechazo del préstamo falló en el servidor.");
      }
  }, []);

  const processReturn = useCallback(async (loanId: string, damageReports: Record<string, DamageReport>, suggestionReports: Record<string, SuggestionReport>, missingResources?: MissingResourceReport[]) => {
      const result = await loanService.processReturn(loanId, damageReports, suggestionReports, missingResources);
      if (result) {
        const { updatedLoan, updatedResources } = result;

        // Convertir fechas correctamente como en otras funciones
        const updatedLoanWithDates = {
          ...updatedLoan,
          loanDate: new Date(updatedLoan.loanDate),
          returnDate: updatedLoan.returnDate ? new Date(updatedLoan.returnDate) : undefined
        };

        setLoans(prev => prev.map(l => l.id === loanId ? updatedLoanWithDates : l));
        
        const updatedResourceMap = new Map(updatedResources.map(r => [r.id, r]));
        setResources(prev => prev.map(r => updatedResourceMap.get(r.id) || r));
      }
  }, []);

  const addResource = useCallback(async (data: Omit<Resource, 'id' | 'name' | 'stock'> & { quantity: number }) => {
    const newResources = await resourceService.addResource(data);
    if (newResources) {
      setResources(prev => [...prev, ...newResources]);
    }
  }, []);

  const updateResource = useCallback(async (resourceId: string, data: Partial<Omit<Resource, 'id'>>) => {
    const updatedResource = await resourceService.updateResource(resourceId, data);
    if(updatedResource) {
      setResources(prev => prev.map(r => r.id === resourceId ? {...r, ...updatedResource} : r));
    }
  }, []);
  
  const deleteResource = useCallback(async (resourceId: string) => {
    const success = await resourceService.deleteResource(resourceId);
    if(success) {
      setResources(prev => prev.filter(r => r.id !== resourceId));
    }
  }, []);

  const updateResourceStatus = useCallback(async (resourceId: string, status: Resource['status'], notes?: string) => {
    const updatedResource = await resourceService.updateResourceStatus(resourceId, status, notes);
    if (updatedResource) {
      setResources(prev => prev.map(r => (r.id === resourceId ? { ...r, status, damageNotes: updatedResource.damageNotes } : r)));
    }
  }, []);

  const refreshResources = useCallback(async () => {
    localCache.invalidate(CacheKeys.RESOURCES);
    const fetchedResources = await withCache(CacheKeys.RESOURCES, () => resourceService.getResources(200, 0), CacheConfigs.RESOURCES);
    setResources(fetchedResources || []);
  }, []);

  const refreshLoans = useCallback(async () => {
    localCache.invalidate(CacheKeys.LOANS);
    const fetchedLoans = await withCache(CacheKeys.LOANS, () => loanService.getLoans(), CacheConfigs.LOANS);
    
    if (fetchedLoans && fetchedLoans.length > 0) {
      const loansWithUsers = fetchedLoans.map(loan => {
        const user = users.find(u => u.id === loan.user_id);
        return {
          ...loan,
          user: user || { id: loan.user_id, name: 'Usuario desconocido', email: '', role: 'Docente' as const },
        };
      });
      setLoans(loansWithUsers as Loan[]);
    } else {
      setLoans([]);
    }
  }, [users]);
  
  const addCategories = useCallback(async (categoryNames: string[]): Promise<Category[] | null> => {
    try {
      const newCategories = await resourceService.addCategories(categoryNames);
      if (newCategories) {
          setCategories(prev => [...prev, ...newCategories]);
      }
      return newCategories;
    } catch (error) {
      console.error("Failed to add categories in provider:", error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryName: string) => {
    const success = await resourceService.deleteCategory(categoryName);
    if (success) {
      setCategories(prev => prev.filter(c => c.name !== categoryName));
      setResources(prev => prev.filter(r => r.category !== categoryName));
    }
  }, []);

  const refreshReservations = useCallback(async (showLoading = true, forceRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (isRefreshing && !forceRefresh) {
      console.log('RefreshReservations: Already refreshing, skipping...');
      return;
    }
    
    // Check cache validity (3 minutes instead of 5 for better UX)
    const cacheAge = Date.now() - lastReservationsUpdate;
    if (!forceRefresh && cacheAge < 3 * 60 * 1000 && reservations.length > 0) {
      console.log('RefreshReservations: Cache still valid, skipping...');
      return;
    }
    
    console.log('RefreshReservations: Starting refresh...');
    setIsRefreshing(true);
    
    try {
      if (forceRefresh) {
        localCache.invalidate(CacheKeys.RESERVATIONS);
      }
      const fetchedReservations = await withCache(CacheKeys.RESERVATIONS, () => reservationService.getReservations(), CacheConfigs.RESERVATIONS);
      if (fetchedReservations) {
        // Get current users without creating dependency
        setReservations(prev => {
          // Use current users state at the time of update
          const currentUsers = users;
          const userMap = new Map(currentUsers.map(u => [u.id, u]));
          return fetchedReservations.map(r => ({ 
            ...r, 
            user: userMap.get(r.user_id) || { id: r.user_id, name: 'Usuario Desconocido', role: 'Docente' } 
          } as Reservation));
        });
        setLastReservationsUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error in refreshReservations:', error);
      // Remove recursive retry to prevent infinite loops
      toast({
        title: "Error al cargar reservas",
        description: "No se pudieron cargar las reservas. Intenta recargar la página.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []); // Remove all dependencies to prevent infinite loops

  // TEMPORARILY DISABLED - addReservation function causing infinite POST loops
  // This is a temporary measure to stop the excessive POST requests
  // TODO: Investigate and fix the root cause of the infinite loop
  const addReservation = useCallback(async (newReservationData: Omit<Reservation, 'id'>) => {
    console.warn('addReservation is temporarily disabled to prevent infinite POST loops');
    console.log('Attempted to add reservation:', newReservationData);
    
    // Show a toast to inform the user
    toast({
      title: "Función Temporalmente Deshabilitada",
      description: "La creación de reservas está temporalmente deshabilitada mientras se soluciona un problema técnico.",
      variant: 'destructive',
    });
    
    // Return early without making any API calls
    return;
    
    // ORIGINAL CODE COMMENTED OUT TO PREVENT INFINITE LOOPS:
    // const operationId = `add-${Date.now()}`;
    // 
    // // Prevent duplicate operations
    // if (pendingOperations.has(operationId)) {
    //   return;
    // }
    // 
    // setPendingOperations(prev => new Set(prev).add(operationId));
    // 
    // // Optimistic update: add reservation immediately to UI
    // const tempId = `temp-${Date.now()}`;
    // const optimisticReservation: Reservation = {
    //   ...newReservationData,
    //   id: tempId,
    //   user: users.find(u => u.id === newReservationData.user_id) || 
    //         { id: newReservationData.user_id, name: 'Usuario Desconocido', role: 'Docente' }
    // };
    // 
    // // Add optimistic reservation to state
    // setReservations(prev => [...prev, optimisticReservation]);
    // 
    // try {
    //   const newReservation = await reservationService.addReservation(newReservationData);
    //   if (newReservation) {
    //     // Replace optimistic reservation with real one
    //     setReservations(prev => 
    //       prev.map(r => r.id === tempId ? newReservation : r)
    //     );
    //   } else {
    //     // Remove optimistic reservation on failure
    //     setReservations(prev => prev.filter(r => r.id !== tempId));
    //   }
    // } catch (error) {
    //   // Remove optimistic reservation on error
    //   setReservations(prev => prev.filter(r => r.id !== tempId));
    //   console.error('Error adding reservation:', error);
    // } finally {
    //   setPendingOperations(prev => {
    //     const newSet = new Set(prev);
    //     newSet.delete(operationId);
    //     return newSet;
    //   });
    // }
  }, [toast]);

  const updateReservationStatus = useCallback(async (reservationId: string, status: Reservation['status']) => {
    // Prevent duplicate operations
    const operationKey = `update-reservation-${reservationId}`;
    if (pendingOperations.has(operationKey)) {
      return;
    }
    
    // Store the previous state for rollback
    const previousReservations = [...reservations];
    
    // Optimistic update: update status immediately in UI
    setReservations(prev => 
      prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status }
          : reservation
      )
    );

    // Add to pending operations
    setPendingOperations(prev => new Set([...prev, operationKey]));

    try {
      const updatedReservation = await reservationService.updateReservationStatus(reservationId, status);
      if (updatedReservation) {
        // Update with server response
        setReservations(prev => 
          prev.map(r => r.id === reservationId ? 
            {...updatedReservation, startTime: new Date(updatedReservation.startTime), endTime: new Date(updatedReservation.endTime)} : r
          )
        );
        // Update cache timestamp to prevent unnecessary refreshes
        setLastReservationsUpdate(Date.now());
      } else {
        // Revert optimistic update on failure
        setReservations(previousReservations);
      }
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      // Revert optimistic update on error
      setReservations(previousReservations);
      throw error;
    } finally {
      // Remove from pending operations
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [reservations, pendingOperations]);

  const addMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'date'>) => {
    const newMeeting = await meetingService.addMeeting(meetingData);
    if (newMeeting) {
        // Ensure date is a Date object
        const meetingWithDate = { ...newMeeting, date: new Date(newMeeting.date) };
        setMeetings(prev => [meetingWithDate, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    }
  }, []);

  const toggleMeetingTaskStatus = useCallback(async (meetingId: string, taskId: string) => {
    const updatedMeeting = await meetingService.toggleTaskStatus(meetingId, taskId);
    if (updatedMeeting) {
        setMeetings(prev => prev.map(m => m.id === meetingId ? {...updatedMeeting, date: new Date(updatedMeeting.date)} : m));
    }
  }, []);

  const addAreas = useCallback(async (names: string[]) => {
    const newAreas = await areaService.addAreas(names);
    if (newAreas) {
      setAreas(prev => [...prev, ...newAreas].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const updateArea = useCallback(async (areaId: string, newName: string) => {
    const updatedArea = await areaService.updateArea(areaId, newName);
    if (updatedArea) {
      setAreas(prev => prev.map(a => a.id === areaId ? updatedArea : a).sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const deleteArea = useCallback(async (areaId: string) => {
    const success = await areaService.deleteArea(areaId);
    if (success) {
      setAreas(prev => prev.filter(a => a.id !== areaId));
    }
  }, []);

  const addGrade = useCallback(async (name: string) => {
    const newGrade = await gradeService.addGrade(name);
    if (newGrade) {
      setGrades(prev => [...prev, newGrade]);
    }
    return newGrade;
  }, []);

  const deleteGrade = useCallback(async (gradeId: string) => {
    await gradeService.deleteGrade(gradeId);
    setGrades(prev => prev.filter(g => g.id !== gradeId));
  }, []);

  const addSection = useCallback(async (gradeId: string, name: string) => {
    const newSection = await gradeService.addSection(gradeId, name);
    if (newSection) {
      setGrades(prev => prev.map(g => 
        g.id === gradeId ? { ...g, sections: [...g.sections, newSection].sort((a,b) => a.name.localeCompare(b.name)) } : g
      ));
    }
  }, []);



  const deleteSection = useCallback(async (sectionId: string) => {
    await gradeService.deleteSection(sectionId);
    setGrades(prev => prev.map(g => ({
      ...g,
      sections: g.sections.filter(s => s.id !== sectionId)
    })));
  }, []);

  const addPedagogicalHour = useCallback(async (name: string) => {
    const newHour = await pedagogicalHourService.addPedagogicalHour(name);
    if (newHour) {
      setPedagogicalHours(prev => [...prev, newHour]);
    }
  }, []);

  const deletePedagogicalHour = useCallback(async (hourId: string) => {
    const success = await pedagogicalHourService.deletePedagogicalHour(hourId);
    if (success) {
      setPedagogicalHours(prev => prev.filter(h => h.id !== hourId));
    }
  }, []);

  // Real-time subscriptions - ENABLED with improved debouncing and loop prevention
  const subscriptionCallbacks = useMemo(() => ({
    onLoansChange: () => {
      if (isRefreshing || isLoadingData) {
        console.log('Skipping loans refresh - already loading');
        return;
      }
      console.log('Loans changed, debouncing refresh...');
      debounceOperation('refresh-loans', () => {
        withOperationLock('refresh-loans', () => refreshLoans());
      }, 2000); // Reduced debounce time for better responsiveness
    },
    onReservationsChange: () => {
      if (isRefreshing || isLoadingData) {
        console.log('Skipping reservations refresh - already loading');
        return;
      }
      console.log('Reservations changed, debouncing refresh...');
      debounceOperation('refresh-reservations', () => {
        withOperationLock('refresh-reservations', () => refreshReservations(false, false));
      }, 2000);
    },
    onResourcesChange: () => {
      if (isRefreshing || isLoadingData) {
        console.log('Skipping resources refresh - already loading');
        return;
      }
      console.log('Resources changed, debouncing refresh...');
      debounceOperation('refresh-resources', () => {
        withOperationLock('refresh-resources', () => refreshResources());
      }, 2000);
    }
  }), [debounceOperation, withOperationLock, refreshLoans, refreshReservations, refreshResources, isRefreshing, isLoadingData]);

  // Enable real-time subscriptions only when user is authenticated and data is loaded
  useRealtimeSubscriptions({
    ...subscriptionCallbacks,
    enabled: !!currentUser && !isLoadingUser && !isLoadingData && !isRefreshing
  });

  const value: DataContextType = {
    users,
    resources,
    categories,
    loans,
    reservations,
    meetings,
    grades,
    areas,
    pedagogicalHours,
    currentUser,
    isLoadingUser,
    isLoadingData,
    appSettings,
    updateAppSettings,
    setCurrentUser,
    findUserById,
    addUser,
    registerUser,
    signIn,
    signOut,
    refreshUserSession,
    updateUser,
    deleteUser,
    addMultipleUsers,
    addLoan,
    approveLoan,
    rejectLoan,
    processReturn,
    addResource,
    updateResource,
    deleteResource,
    updateResourceStatus,
    refreshResources,
        refreshLoans,
        addCategories,
    deleteCategory,
    addReservation,
    updateReservationStatus,
    refreshReservations,
    addMeeting,
    toggleMeetingTaskStatus,
    addAreas,
    updateArea,
    deleteArea,
    addGrade,
    deleteGrade,
    addSection,

    deleteSection,
    addPedagogicalHour,
    deletePedagogicalHour,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
