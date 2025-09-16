

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useData } from '@/context/data-provider-refactored';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const { registerUser, appSettings } = useData();
    const { appName, schoolName, logoUrl, backgroundImageUrl } = appSettings;
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (password !== confirmPassword) {
            toast({
                title: 'Las contraseñas no coinciden',
                description: 'Por favor, verifica que las contraseñas sean iguales.',
                variant: 'destructive'
            });
            return;
        }
        
        setIsLoading(true);

        try {
            const newUser = await registerUser({
                name: `${name.trim()} ${lastName.trim()}`,
                email,
                dni,
                password,
                role: 'Admin',
            });
            
            if (newUser) {
                toast({
                    title: '¡Registro Exitoso!',
                    description: `Bienvenido, ${newUser.name}. Ahora puedes iniciar sesión.`,
                });
                router.push('/');
            } else {
                 throw new Error('No se pudo crear el usuario.');
            }

        } catch (error: any) {
            toast({
                title: 'Error en el Registro',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                <div className="mx-auto h-24 w-24">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${schoolName} logo`}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  ) : (
                    <Logo className="h-full w-full text-primary" />
                  )}
                </div>
                <h1 className="text-3xl font-bold">{appName}</h1>
                <p className="text-balance text-muted-foreground">
                    {schoolName}
                </p>
            </div>
            <form onSubmit={handleRegister}>
                <Card>
                    <CardHeader>
                        <CardTitle>Registro de Administrador</CardTitle>
                        <CardDescription>
                            Completa el formulario para crear una nueva cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombres</Label>
                                <Input 
                                    id="name" 
                                    type="text"
                                    placeholder="Tu nombre" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellidos</Label>
                                <Input 
                                    id="lastName" 
                                    type="text"
                                    placeholder="Tus apellidos" 
                                    required 
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input 
                                id="dni" 
                                type="text"
                                placeholder="Documento de 8 dígitos" 
                                required 
                                maxLength={8}
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="tu@correo.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Repetir Contraseña</Label>
                            <div className="relative">
                                <Input 
                                    id="confirm-password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrarse
                        </Button>
                    </CardContent>
                </Card>
            </form>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/" className="underline">
                Inicia Sesión
              </Link>
            </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src={backgroundImageUrl || "https://picsum.photos/seed/classroom/1200/1800"}
          alt="Aula de Innovación Pedagógica"
          data-ai-hint="classroom technology"
          fill
          className="object-cover"
        />
         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
    </div>
  );
}
