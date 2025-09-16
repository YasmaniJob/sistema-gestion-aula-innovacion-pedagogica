

import { Briefcase, CheckCircle2, CircleDotDashed, Clock, Hand, MoreHorizontal, School, ShieldAlert, TriangleAlert, UserCog, Users, Users2, Wrench, Camera, Laptop, Monitor, Projector, Tablet, PlusCircle, Video, Mouse, Router, Cable, Headphones, HardDrive, Sofa, Tv, Package, Mic, Lightbulb, Airplay } from "lucide-react";
import type { GenericParticipant, ResourceStatus } from "./types";

export const categoryVisuals: Record<string, { icon: React.ElementType; color: string;}> = {
    'Laptops': { icon: Laptop, color: 'text-sky-500' },
    'Tablets': { icon: Tablet, color: 'text-blue-500' },
    'Proyectores': { icon: Projector, color: 'text-orange-500' },
    'Cámaras Fotográficas': { icon: Camera, color: 'text-purple-500' },
    'Filmadoras': { icon: Video, color: 'text-violet-500' },
    'Grabadoras de Audio': { icon: Mic, color: 'text-red-500' },
    'Drones': { icon: Airplay, color: 'text-indigo-500' },
    'Luces de Estudio': { icon: Lightbulb, color: 'text-yellow-500' },
    'Periféricos': { icon: Mouse, color: 'text-slate-500' },
    'Redes': { icon: Router, color: 'text-gray-500' },
    'Cables y Adaptadores': { icon: Cable, color: 'text-neutral-500' },
    'Audio': { icon: Headphones, color: 'text-rose-500' },
    'PCs de Escritorio': { icon: Tv, color: 'text-teal-500' },
    'Mobiliario': { icon: Sofa, color: 'text-lime-600' },
    'Default': { icon: Package, color: 'text-zinc-500' },
};

export const categoryNames = [
    'Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas',
    'Filmadoras', 'Grabadoras de Audio', 'Drones', 'Luces de Estudio', 'Periféricos', 'Redes', 'Cables y Adaptadores',
    'Audio', 'PCs de Escritorio', 'Mobiliario'
];


export const getCategoryVisuals = (categoryName: string) => {
    return categoryVisuals[categoryName] || categoryVisuals['Default'];
};

export const reportLabels: Record<'damage' | 'suggestion', Record<string, { label: string, description: string }>> = {
    damage: {
        'no-power': { label: 'No enciende', description: 'El equipo no responde al botón de encendido.' },
        'no-focus': { label: 'No enfoca', description: 'El lente o sensor de enfoque no funciona correctamente.' },
        'bad-battery': { label: 'Batería falla', description: 'La batería no retiene la carga o se descarga rápido.' },
        'bad-cable': { label: 'Cable dañado', description: 'El cable de poder o datos está roto o en mal estado.' },
        'other': { label: 'Otro', description: 'Requiere atención inmediata' }
    },
    suggestion: {
        'limpiar-sensor': { label: 'Limpiar sensor', description: 'Recomendación para optimizar el recurso' },
        'limpiar-lente': { label: 'Limpiar lente', description: 'Recomendación para optimizar el recurso' },
        'actualizar-firmware': { label: 'Actualizar firmware', description: 'Recomendación para optimizar el recurso' },
        'calibrar-enfoque': { label: 'Calibrar enfoque', description: 'Recomendación para optimizar el recurso' },
        'other': { label: 'Otro', description: 'Sugerencia adicional para el recurso.' }
    }
};

export const participantRoles: {
    name: GenericParticipant;
    label: string;
    icon: React.ElementType;
}[] = [
    { name: 'director', label: 'Director(a)', icon: Briefcase },
    { name: 'subdirector', label: 'Sub-Director(a)', icon: UserCog },
    { name: 'coordinadores', label: 'Coordinadores', icon: Users },
    { name: 'docentes', label: 'Docentes', icon: School },
    { name: 'otros', label: 'Otros', icon: MoreHorizontal },
];
  

export const categoryDetails: Record<string, {
  suggestedBrands: string[];
  brandPlaceholder: string;
  modelPlaceholder: string;
  technicalDetails: {
    label: string;
    suggestions?: string[];
  }[];
}> = {
  'Laptops': {
    suggestedBrands: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer'],
    brandPlaceholder: 'Ej: HP, Dell, Lenovo',
    modelPlaceholder: 'Ej: Pavilion, XPS 15, ThinkPad T480',
    technicalDetails: [
      { label: 'Procesador', suggestions: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7'] },
      { label: 'RAM', suggestions: ['4 GB', '8 GB', '16 GB', '32 GB'] },
      { label: 'Almacenamiento', suggestions: ['128 GB SSD', '256 GB SSD', '512 GB SSD', '1 TB SSD', '1 TB HDD'] },
      { label: 'Sistema Operativo', suggestions: ['Windows 10', 'Windows 11', 'macOS', 'Linux'] },
    ],
  },
  'Tablets': {
    suggestedBrands: ['Apple', 'Samsung', 'Lenovo', 'Microsoft', 'Huawei'],
    brandPlaceholder: 'Ej: Apple, Samsung',
    modelPlaceholder: 'Ej: iPad 9na Gen, Galaxy Tab S8',
    technicalDetails: [
      { label: 'Almacenamiento', suggestions: ['32 GB', '64 GB', '128 GB', '256 GB'] },
      { label: 'Tamaño de Pantalla', suggestions: ['8"', '10"', '11"', '12.9"'] },
    ],
  },
  'Proyectores': {
    suggestedBrands: ['Epson', 'BenQ', 'ViewSonic', 'Optoma'],
    brandPlaceholder: 'Ej: Epson, BenQ',
    modelPlaceholder: 'Ej: PowerLite E20, MH550',
    technicalDetails: [
      { label: 'Lúmenes', suggestions: ['3000', '3500', '4000', '5000'] },
      { label: 'Resolución Nativa', suggestions: ['SVGA', 'XGA', '1080p', '4K'] },
    ],
  },
  'Cámaras Fotográficas': {
    suggestedBrands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
    brandPlaceholder: 'Ej: Canon, Sony',
    modelPlaceholder: 'Ej: EOS R6, Alpha A7 IV',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['DSLR', 'Mirrorless', 'Compacta'] },
      { label: 'Resolución (MP)', suggestions: ['24 MP', '30 MP', '45 MP', '60 MP'] },
    ],
  },
  'Filmadoras': {
    suggestedBrands: ['Sony', 'Canon', 'Panasonic', 'Blackmagic', 'JVC'],
    brandPlaceholder: 'Ej: Sony, Canon, Panasonic',
    modelPlaceholder: 'Ej: FX3, C70, S1H',
    technicalDetails: [
      { label: 'Resolución Máxima', suggestions: ['1080p', '4K', '6K', '8K'] },
      { label: 'Tipo de Sensor', suggestions: ['Full-Frame', 'Super 35', 'Micro 4/3'] },
    ],
  },
  'Grabadoras de Audio': {
    suggestedBrands: ['Zoom', 'Tascam', 'Sony', 'Rode'],
    brandPlaceholder: 'Ej: Zoom, Tascam',
    modelPlaceholder: 'Ej: H4n Pro, DR-40X',
    technicalDetails: [
      { label: 'Pistas', suggestions: ['2', '4', '6'] },
      { label: 'Tipo', suggestions: ['Portátil', 'De campo'] },
    ],
  },
  'Drones': {
    suggestedBrands: ['DJI', 'Autel Robotics', 'Parrot'],
    brandPlaceholder: 'Ej: DJI',
    modelPlaceholder: 'Ej: Mavic 3, Air 2S, Mini 3 Pro',
    technicalDetails: [
      { label: 'Resolución de Video', suggestions: ['1080p', '4K/30fps', '4K/60fps', '5.4K'] },
      { label: 'Tiempo de Vuelo (min)', suggestions: ['20', '25', '30', '45'] },
    ],
  },
  'Luces de Estudio': {
    suggestedBrands: ['Godox', 'Aputure', 'Neewer', 'Falcon Eyes'],
    brandPlaceholder: 'Ej: Godox, Aputure',
    modelPlaceholder: 'Ej: SL-60W, Amaran 100d',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['LED', 'Flash', 'Continuo'] },
      { label: 'Potencia (W)', suggestions: ['60W', '100W', '150W', '200W'] },
    ],
  },
  'Periféricos': {
    suggestedBrands: ['Logitech', 'Razer', 'Corsair', 'Microsoft'],
    brandPlaceholder: 'Ej: Logitech, Razer',
    modelPlaceholder: 'Ej: Mouse G502, Teclado Huntsman',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Mouse', 'Teclado', 'Webcam', 'Tableta Gráfica'] },
    ],
  },
  'Redes': {
    suggestedBrands: ['TP-Link', 'Netgear', 'Ubiquiti', 'Linksys'],
    brandPlaceholder: 'Ej: TP-Link, Ubiquiti',
    modelPlaceholder: 'Ej: Archer C7, UniFi AP AC Lite',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Router', 'Switch', 'Access Point', 'Repetidor'] },
    ],
  },
  'Cables y Adaptadores': {
    suggestedBrands: ['Ugreen', 'Anker', 'Belkin'],
    brandPlaceholder: 'Ej: Ugreen, Anker',
    modelPlaceholder: 'Ej: Adaptador USB-C a HDMI',
    technicalDetails: [
       { label: 'Tipo', suggestions: ['HDMI', 'USB-C', 'VGA', 'Adaptador Multipuerto'] },
    ],
  },
  'Audio': {
    suggestedBrands: ['Sennheiser', 'Audio-Technica', 'Shure', 'Rode'],
    brandPlaceholder: 'Ej: Sennheiser, Shure',
    modelPlaceholder: 'Ej: HD 280 Pro, SM58',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Micrófono', 'Audífonos', 'Parlante', 'Interfaz de Audio'] },
    ],
  },
  'PCs de Escritorio': {
    suggestedBrands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Ensamblado'],
    brandPlaceholder: 'Ej: Dell, Apple',
    modelPlaceholder: 'Ej: OptiPlex, iMac',
    technicalDetails: [
      { label: 'Procesador', suggestions: ['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'Apple M1'] },
      { label: 'RAM', suggestions: ['8 GB', '16 GB', '32 GB'] },
      { label: 'Almacenamiento', suggestions: ['256 GB SSD', '512 GB SSD', '1 TB HDD'] },
    ],
  },
  'Mobiliario': {
    suggestedBrands: ['Genérico', 'Ikea', 'Herman Miller'],
    brandPlaceholder: 'Ej: Genérico',
    modelPlaceholder: 'Ej: Silla Ergonómica, Mesa de trabajo',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Silla', 'Mesa', 'Estante', 'Pizarra'] },
    ],
  },
  'Default': {
    suggestedBrands: [],
    brandPlaceholder: 'Ej: Sony, Epson, DJI',
    modelPlaceholder: 'Ej: A7-IV, PowerLite E20, Mavic 3',
    technicalDetails: [],
  }
};


export const statusStyles: Record<
  ResourceStatus,
  { label: string; badge: string; border: string; icon: React.ElementType }
> = {
  disponible: {
    label: 'Disponible',
    badge: 'bg-green-100 text-green-700 border border-green-200',
    border: 'border-green-300',
    icon: CheckCircle2,
  },
  prestado: {
    label: 'En préstamo',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    border: 'border-yellow-400',
    icon: Clock,
  },
  mantenimiento: {
    label: 'En Mantenimiento',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    border: 'border-blue-400',
    icon: Wrench,
  },
  dañado: {
    label: 'Dañado',
    badge: 'bg-destructive/10 text-destructive border border-destructive/20',
    border: 'border-destructive',
    icon: TriangleAlert,
  },
};
