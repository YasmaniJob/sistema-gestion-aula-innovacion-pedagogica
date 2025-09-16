
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useData } from '@/context/data-provider-refactored';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tipos para validación
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface FormTouched {
  email: boolean;
  password: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const { appSettings } = useData();
    const { signIn } = useAuth();
    const { appName, schoolName, logoUrl, backgroundImageUrl } = appSettings;
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<FormTouched>({ email: false, password: false });
    const [attemptCount, setAttemptCount] = useState(0);

    // Validación en tiempo real
    const validateEmail = (email: string): string | undefined => {
        if (!email) return 'El correo electrónico es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Ingresa un correo electrónico válido';
        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) return 'La contraseña es requerida';
        if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        return undefined;
    };

    // Validación del formulario completo
    const formValidation = useMemo(() => {
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        
        return {
            isValid: !emailError && !passwordError,
            errors: {
                email: touched.email ? emailError : undefined,
                password: touched.password ? passwordError : undefined
            }
        };
    }, [email, password, touched]);

    // Actualizar errores solo cuando los campos han sido tocados
    useEffect(() => {
        if (touched.email || touched.password) {
            setErrors(prev => ({ ...prev, ...formValidation.errors }));
        }
    }, [formValidation.errors, touched.email, touched.password]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setErrors(prev => ({ ...prev, email: undefined, general: undefined }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setErrors(prev => ({ ...prev, password: undefined, general: undefined }));
    };

    const handleBlur = (field: keyof FormTouched) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        
        // Marcar todos los campos como tocados
        setTouched({ email: true, password: true });
        
        // Validar formulario
        if (!formValidation.isValid) {
            setErrors({
                email: validateEmail(email),
                password: validatePassword(password)
            });
            return;
        }

        setIsLoading(true);
        setErrors({});
        setAttemptCount(prev => prev + 1);

        try {
            const user = await signIn({ email: email.trim(), password });
            
            toast({
                title: '¡Bienvenido!',
                description: 'Has iniciado sesión correctamente.',
            });
            
            // Redirigir según el rol del usuario
            if (user.role === 'Admin') {
                router.push('/dashboard');
            } else {
                router.push('/my-space');
            }
        } catch (error: any) {
            console.error('Error en login:', error);
            
            let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
            
            if (error.message) {
                if (error.message.includes('Failed to sign in') ||
                    error.message.includes('Invalid login credentials') || 
                    error.message.includes('credenciales') ||
                    error.message.includes('Email o contraseña incorrectos') ||
                    error.message.includes('Invalid email or password')) {
                    errorMessage = 'Correo electrónico o contraseña incorrectos. Verifica tus datos e intenta nuevamente.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            setErrors({ general: errorMessage });
            
            toast({
                title: 'Error de autenticación',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:grid-cols-5">
      <div className="flex items-center justify-center py-12 px-4 lg:col-span-1 xl:col-span-2 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="mx-auto grid w-full max-w-[400px] gap-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="grid gap-4 text-center">
                <div className="mx-auto h-28 w-28 relative group">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${schoolName} logo`}
                      width={112}
                      height={112}
                      className="object-contain"
                    />
                  ) : (
                    <Logo className="h-full w-full text-primary relative z-10 drop-shadow-lg" />
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {appName}
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium">
                    {schoolName}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full mx-auto" />
                </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                    <CardHeader className="space-y-3 pb-6">
                        <CardTitle className="text-2xl font-semibold text-center">Iniciar sesión</CardTitle>
                        <CardDescription className="text-center text-base">
                            Ingresa tu correo y contraseña para acceder a tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-8">
                        {errors.general && (
                            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="font-medium">{errors.general}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-3 group">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                                Correo Electrónico
                            </Label>
                            <div className="relative">
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="tu@correo.com" 
                                    value={email}
                                    onChange={handleEmailChange}
                                    onBlur={() => handleBlur('email')}
                                    disabled={isLoading}
                                    className={`h-12 text-base transition-all duration-200 ${
                                        errors.email 
                                            ? 'border-destructive focus-visible:ring-destructive/20 bg-destructive/5' 
                                            : 'focus-visible:ring-primary/20 hover:border-primary/50'
                                    } ${email && !errors.email ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                />
                                {!errors.email && email && touched.email && (
                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in zoom-in-50 duration-200" />
                                )}
                            </div>
                            {errors.email && (
                                <p id="email-error" className="text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="font-medium">{errors.email}</span>
                                </p>
                            )}
                        </div>
                        
                        <div className="space-y-3 group">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onBlur={() => handleBlur('password')}
                                    disabled={isLoading}
                                    className={`h-12 text-base pr-20 transition-all duration-200 ${
                                        errors.password 
                                            ? 'border-destructive focus-visible:ring-destructive/20 bg-destructive/5' 
                                            : 'focus-visible:ring-primary/20 hover:border-primary/50'
                                    } ${password && !errors.password ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {!errors.password && password && touched.password && (
                                        <CheckCircle className="h-5 w-5 text-green-500 animate-in zoom-in-50 duration-200" />
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        disabled={isLoading}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="font-medium">{errors.password}</span>
                                </p>
                            )}
                        </div>
                        
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]" 
                            disabled={isLoading || !formValidation.isValid}
                        >
                            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            <span className="relative z-10">
                                {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </form>
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">¿Nuevo aquí?</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta de administrador?{" "}
                <Link 
                  href="/register" 
                  className="font-semibold text-primary hover:text-primary/80 underline underline-offset-4 decoration-2 hover:decoration-primary/50 transition-all duration-200"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block xl:col-span-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent z-10" />
        <Image
          src={backgroundImageUrl || "https://picsum.photos/seed/school/1200/1800"}
          alt="Aula de Innovación Pedagógica"
          data-ai-hint="school classroom"
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20" />
        <div className="absolute bottom-8 left-8 right-8 z-30 text-white">
          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl font-bold leading-tight">
              Bienvenido al futuro de la educación
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Descubre nuevas formas de aprender y enseñar con nuestras herramientas innovadoras.
            </p>
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Conectando mentes, construyendo futuro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
