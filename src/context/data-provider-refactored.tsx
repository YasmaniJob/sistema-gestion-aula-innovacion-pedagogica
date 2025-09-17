'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Loan, LoanUser, Resource, Category, Reservation, Meeting, Section, Grade, PedagogicalHour, Area, DamageReport, SuggestionReport, AgreementTask } from '@/domain/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-provider';
import { 
    getUsers, 
    addUser as addUserSvc, 
    updateUser as updateUserSvc,
    deleteUser as deleteUserSvc,
    addMultipleUsers as addMultipleUsersSvc,
    registerUser as registerUserSvc
} from '@/services/client/user.client';
import * as loanService from '@/services/client/loan.client';
import * as resourceService from '@/services/client/resource.client';
import * as reservationService from '@/services/client/reservation.client';
import * as meetingService from '@/services/client/meeting.client';
import * as areaService from '@/services/client/area.client';
import * as gradeService from '@/services/client/grade.client';
import * as pedagogicalHourService from '@/services/client/pedagogical-hour.client';
import * as settingsService from '@/services/client/settings.client';

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
  isLoadingData: boolean;
  appSettings: AppSettings;
  updateAppSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  signOut: () => Promise<void>;
  
  findUserById: (id: string) => LoanUser | undefined;
  
  addUser: (data: Omit<LoanUser, 'id'> & { password?: string }) => Promise<LoanUser>;
  registerUser: (data: Omit<LoanUser, 'id'> & { password?: string }) => Promise<LoanUser | null>;
  updateUser: (userId: string, data: Partial<Omit<LoanUser, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addMultipleUsers: (users: (Omit<LoanUser, 'id'> & { password?: string })[]) => Promise<void>;

  addLoan: (newLoan: Omit<Loan, 'id' | 'loanDate' | 'status'>, creatorRole: LoanUser['role']) => Promise<void>;
  approveLoan: (loanId: string) => Promise<void>;
  rejectLoan: (loanId: string) => Promise<void>;
  processReturn: (loanId: string, damageReports: Record<string, DamageReport>, suggestionReports: Record<string, SuggestionReport>) => Promise<void>;

  addResource: (data: Omit<Resource, 'id' | 'name' | 'stock'> & { quantity: number }) => Promise<void>;
  updateResource: (resourceId: string, data: Partial<Omit<Resource, 'id'>>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  updateResourceStatus: (resourceId: string, status: Resource['status'], notes?: string) => Promise<void>;
  refreshResources: () => Promise<void>;
  refreshLoans: () => Promise<void>;
  refreshAllData: () => Promise<void>;
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
  appName: 'Aula Ágil',
  schoolName: 'Mi Institución Educativa',
  logoUrl: '',
  primaryColor: '#673ab7',
  isPublicRegistrationEnabled: false,
  backgroundImageUrl: '',
};

// Helper function to convert hex to HSL
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
  const { currentUser, isLoadingUser, signOut } = useAuth();
  const { toast } = useToast();
  
  // Estados principales
  const [users, setUsers] = useState<LoanUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [pedagogicalHours, setPedagogicalHours] = useState<PedagogicalHour[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Control de carga de datos
  const hasLoadedDataRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // Debounce para operaciones
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  const debounceOperation = useCallback((key: string, operation: () => void, delay: number = 1000) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(() => {
      operation();
      delete debounceTimersRef.current[key];
    }, delay);
  }, []);



  // Cargar configuración de la aplicación (solo una vez)
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
  }, []); // Sin dependencias - solo se ejecuta una vez

  // Cargar datos de la aplicación (solo cuando el usuario esté listo)
  useEffect(() => {
    let isMounted = true;
    
    const loadAppData = async () => {
      // Evitar múltiples cargas simultáneas
      if (isLoadingRef.current || hasLoadedDataRef.current) {
        return;
      }
      
      // Solo cargar si el usuario ya no está cargando
      if (isLoadingUser) {
        return;
      }
      
      isLoadingRef.current = true;
      hasLoadedDataRef.current = true;
      setIsLoadingData(true);
      
      try {
        console.log('Loading app data...');
        
        const [fetchedUsers, fetchedResources, fetchedCategories, fetchedLoans, fetchedReservations, fetchedMeetings, fetchedAreas, fetchedGrades, fetchedHours] = await Promise.allSettled([
          getUsers(),
          resourceService.getResources(),
          resourceService.getCategories(),
          loanService.getLoans(),
          reservationService.getReservations(),
          meetingService.getMeetings(),
          areaService.getAreas(),
          gradeService.getGradesAndSections().catch(err => {
            console.warn('Grades service failed, using empty array:', err);
            return [];
          }),
          pedagogicalHourService.getPedagogicalHours().catch(err => {
            console.warn('Pedagogical hours service failed, using empty array:', err);
            return [];
          }),
        ]);
        
        // Procesar resultados
        const users = fetchedUsers.status === 'fulfilled' ? fetchedUsers.value || [] : [];
        const resources = fetchedResources.status === 'fulfilled' ? fetchedResources.value || [] : [];
        const categories = fetchedCategories.status === 'fulfilled' ? fetchedCategories.value || [] : [];
        const loans = fetchedLoans.status === 'fulfilled' ? fetchedLoans.value || [] : [];
        const reservations = fetchedReservations.status === 'fulfilled' ? fetchedReservations.value || [] : [];
        const meetings = fetchedMeetings.status === 'fulfilled' ? fetchedMeetings.value || [] : [];
        const areas = fetchedAreas.status === 'fulfilled' ? fetchedAreas.value || [] : [];
        const grades = fetchedGrades.status === 'fulfilled' ? fetchedGrades.value || [] : [];
        const hours = fetchedHours.status === 'fulfilled' ? fetchedHours.value || [] : [];
        
        if (isMounted) {
          // Establecer usuarios primero
          setUsers(users);
          
          // Mapear datos que dependen de usuarios
          const userMap = new Map(users.map(u => [u.id, u]));
          
          // Función para validar fechas
          const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
          
          // Convertir fechas de strings a objetos Date para loans
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
          
          // Convertir fechas de strings a objetos Date para reservations
          const processedReservations = reservations.map(r => {
            const startTime = new Date(r.startTime);
            const endTime = r.endTime ? new Date(r.endTime) : undefined;
            
            // Si la reserva ya tiene un objeto user válido del servicio, usarlo
            // Si no, intentar mapear desde userMap como fallback
            let user = r.user;
            if (!user || !user.id) {
              user = userMap.get(r.user_id) || { 
                id: r.user_id || 'unknown', 
                name: 'Usuario Desconocido', 
                role: 'Docente' as const 
              };
            }
            
            return {
              ...r,
              startTime: isValidDate(startTime) ? startTime : new Date(),
              endTime: endTime && isValidDate(endTime) ? endTime : undefined,
              user: user
            };
          });
          
          setLoans(processedLoans as Loan[]);
          setReservations(processedReservations as Reservation[]);

          setCategories(categories);
          setMeetings(meetings.map(m => ({ ...m, date: new Date(m.date) })));
          setResources(resources);
          setAreas(areas);
          setGrades(grades);
          setPedagogicalHours(hours);
          
          console.log('App data loaded successfully');
        }
      } catch (error) {
        console.error('Error loading app data:', error);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
        isLoadingRef.current = false;
      }
    };
    
    loadAppData();
    
    return () => {
      isMounted = false;
    };
  }, [isLoadingUser]); // Solo depende de isLoadingUser

  // Funciones memoizadas para evitar re-renderizados
  const updateAppSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = await settingsService.updateAppSettings(newSettings);
    if(updatedSettings) {
      setAppSettings(updatedSettings);
      applyPrimaryColor(updatedSettings.primaryColor);
    }
  }, []);

  const findUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);
  
  const addUser = useCallback(async (data: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser> => {
    const newUser = await addUserSvc(data);
    if (newUser) {
        setUsers(prev => [newUser, ...prev]);
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
      const result = await loanService.updateLoanStatus(loanId, 'active');
      
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
      } else {
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
      } else {
        throw new Error("El rechazo del préstamo falló en el servidor.");
      }
  }, []);

  const processReturn = useCallback(async (loanId: string, damageReports: Record<string, DamageReport>, suggestionReports: Record<string, SuggestionReport>) => {
      const result = await loanService.processReturn(loanId, damageReports, suggestionReports);
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
    const fetchedResources = await resourceService.getResources();
    setResources(fetchedResources || []);
  }, []);

  const refreshLoans = useCallback(async () => {
    const fetchedLoans = await loanService.getLoans();
    
    if (fetchedLoans && fetchedLoans.length > 0) {
      setLoans(prevLoans => {
        const currentUsers = users; // Capturar el valor actual
        const loansWithUsers = fetchedLoans.map(loan => {
          const user = currentUsers.find(u => u.id === loan.user_id);
          return {
            ...loan,
            user: user || { id: loan.user_id, name: 'Usuario desconocido', email: '', role: 'Docente' as const },
          };
        });
        return loansWithUsers as Loan[];
      });
    } else {
      setLoans([]);
    }
  }, []);
  
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

  const refreshReservations = useCallback(async () => {
    try {
      const fetchedReservations = await reservationService.getReservations();
      if (fetchedReservations) {
        // Usar el estado actual de users sin crear dependencia
        setReservations(prevReservations => {
          const currentUsers = users; // Capturar el valor actual
          const userMap = new Map(currentUsers.map(u => [u.id, u]));
          const reservationsWithUsers = fetchedReservations.map(r => ({ 
            ...r, 
            user: userMap.get(r.user_id) || { id: r.user_id, name: 'Usuario Desconocido', role: 'Docente' } 
          } as Reservation));
          return reservationsWithUsers;
        });
      }
    } catch (error) {
      console.error('Error in refreshReservations:', error);
      toast({
        title: "Error al cargar reservas",
        description: "No se pudieron cargar las reservas. Intenta recargar la página.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Debounce para operaciones de reservas
  const debouncedReservationOperations = useMemo(() => {
    let refreshTimeoutId: NodeJS.Timeout | null = null;
    
    return {
      debouncedRefreshReservations: () => {
        if (refreshTimeoutId) {
          clearTimeout(refreshTimeoutId);
        }
        refreshTimeoutId = setTimeout(() => {
          refreshReservations();
        }, 300);
      }
    };
  }, [refreshReservations]);

  const { debouncedRefreshReservations } = debouncedReservationOperations;

  const addReservation = useCallback(async (newReservationData: Omit<Reservation, 'id'>) => {
    try {
      const newReservation = await reservationService.addReservation(newReservationData);
      if (newReservation) {
        // Asegurar que la nueva reserva tenga un objeto user válido
        setReservations(prev => {
          let user = newReservation.user;
          if (!user || !user.id) {
            const currentUsers = users; // Capturar el valor actual
            const userMap = new Map(currentUsers.map(u => [u.id, u]));
            user = userMap.get(newReservation.user_id) || { 
              id: newReservation.user_id || 'unknown', 
              name: 'Usuario Desconocido', 
              role: 'Docente' as const 
            };
          }
          
          const reservationWithUser = {
            ...newReservation,
            user: user
          } as Reservation;
          return [reservationWithUser, ...prev];
        });
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
      throw error;
    }
  }, []);

  const updateReservationStatus = useCallback(async (reservationId: string, status: Reservation['status']) => {
    // Optimistic update
    const previousReservations = [...reservations];
    setReservations(prev => 
      prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status }
          : reservation
      )
    );

    try {
      const updatedReservation = await reservationService.updateReservationStatus(reservationId, status);
      if (updatedReservation) {
        setReservations(prev => 
          prev.map(r => r.id === reservationId ? 
            {...updatedReservation, startTime: new Date(updatedReservation.startTime), endTime: new Date(updatedReservation.endTime)} : r
          )
        );
      } else {
        // Revert on failure
        setReservations(previousReservations);
      }
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      // Revert on error
      setReservations(previousReservations);
      throw error;
    }
  }, [reservations]);

  const addMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'date'>) => {
    if (!currentUser) {
      throw new Error('Usuario no encontrado. No se puede crear la reunión.');
    }
    const newMeeting = await meetingService.addMeeting(meetingData, currentUser.id);
    if (newMeeting) {
        // Ensure date is a Date object to match how meetings are loaded initially
        const meetingWithDate = { ...newMeeting, date: new Date(newMeeting.date) };
        setMeetings(prev => [meetingWithDate, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    }
  }, [currentUser]);

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

  // Función para refrescar todos los datos
  const refreshAllData = useCallback(async () => {
    hasLoadedDataRef.current = false;
    setIsLoadingData(true);
    
    try {
      console.log('Refreshing all data...');
      
      const [fetchedUsers, fetchedResources, fetchedCategories, fetchedLoans, fetchedReservations, fetchedMeetings, fetchedAreas, fetchedGrades, fetchedHours] = await Promise.allSettled([
        getUsers(),
        resourceService.getResources(),
        resourceService.getCategories(),
        loanService.getLoans(),
        reservationService.getReservations(),
        meetingService.getMeetings(),
        areaService.getAreas(),
        gradeService.getGradesAndSections().catch(err => {
          console.warn('Grades service failed, using empty array:', err);
          return [];
        }),
        pedagogicalHourService.getPedagogicalHours().catch(err => {
          console.warn('Pedagogical hours service failed, using empty array:', err);
          return [];
        }),
      ]);
      
      // Procesar resultados
      const users = fetchedUsers.status === 'fulfilled' ? fetchedUsers.value || [] : [];
      const resources = fetchedResources.status === 'fulfilled' ? fetchedResources.value || [] : [];
      const categories = fetchedCategories.status === 'fulfilled' ? fetchedCategories.value || [] : [];
      const loans = fetchedLoans.status === 'fulfilled' ? fetchedLoans.value || [] : [];
      const reservations = fetchedReservations.status === 'fulfilled' ? fetchedReservations.value || [] : [];
      const meetings = fetchedMeetings.status === 'fulfilled' ? fetchedMeetings.value || [] : [];
      const areas = fetchedAreas.status === 'fulfilled' ? fetchedAreas.value || [] : [];
      const grades = fetchedGrades.status === 'fulfilled' ? fetchedGrades.value || [] : [];
      const hours = fetchedHours.status === 'fulfilled' ? fetchedHours.value || [] : [];
      
      // Establecer usuarios primero
      setUsers(users);
      
      // Mapear datos que dependen de usuarios
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // Función para validar fechas
      const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
      
      // Convertir fechas de strings a objetos Date para loans
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
      
      // Convertir fechas de strings a objetos Date para reservations
      const processedReservations = reservations.map(r => {
        const startTime = new Date(r.startTime);
        const endTime = r.endTime ? new Date(r.endTime) : undefined;
        
        let user = r.user;
        if (!user || !user.id) {
          user = userMap.get(r.user_id) || { 
            id: r.user_id || 'unknown', 
            name: 'Usuario Desconocido', 
            role: 'Docente' as const 
          };
        }
        
        return {
          ...r,
          startTime: isValidDate(startTime) ? startTime : new Date(),
          endTime: endTime && isValidDate(endTime) ? endTime : undefined,
          user: user
        };
      });
      
      setLoans(processedLoans as Loan[]);
      setReservations(processedReservations as Reservation[]);
      setCategories(categories);
      setMeetings(meetings.map(m => ({ ...m, date: new Date(m.date) })));
      setResources(resources);
      setAreas(areas);
      setGrades(grades);
      setPedagogicalHours(hours);
      
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing all data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Valor del contexto memoizado con dependencias optimizadas
  const value: DataContextType = useMemo(() => ({
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
    isLoadingData,
    appSettings,
    updateAppSettings,
    signOut,
    findUserById,
    addUser,
    registerUser,
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
    refreshAllData,
    addCategories,
    deleteCategory,
    addReservation,
    updateReservationStatus,
    debouncedRefreshReservations,
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
  }), [
    users, resources, categories, loans, reservations, meetings, grades, areas, pedagogicalHours,
    currentUser, isLoadingData, appSettings, updateAppSettings, signOut, findUserById, addUser, registerUser, updateUser,
    deleteUser, addMultipleUsers, addLoan, approveLoan, rejectLoan, processReturn, addResource,
    updateResource, deleteResource, updateResourceStatus, refreshResources, refreshLoans, refreshAllData,
    addCategories, deleteCategory, addReservation, updateReservationStatus, debouncedRefreshReservations, refreshReservations,
    addMeeting, toggleMeetingTaskStatus, addAreas, updateArea, deleteArea, addGrade, deleteGrade,
    addSection, deleteSection, addPedagogicalHour, deletePedagogicalHour
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}