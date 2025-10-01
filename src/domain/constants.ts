

import { Briefcase, CheckCircle2, CircleDotDashed, Clock, Hand, MoreHorizontal, School, ShieldAlert, TriangleAlert, UserCog, Users, Users2, Wrench, Camera, Laptop, Monitor, Projector, Tablet, PlusCircle, Video, Mouse, Router, Cable, Headphones, HardDrive, Sofa, Tv, Package, Mic, Lightbulb, Airplay, Keyboard, Cpu, Speaker, Webcam } from "lucide-react";
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
    'Monitores': { icon: Monitor, color: 'text-blue-400' },
    'Teclados': { icon: Keyboard, color: 'text-purple-400' },
    'Mouse': { icon: Mouse, color: 'text-green-500' },
    'Torres/CPU': { icon: Cpu, color: 'text-red-500' },
    'Parlantes': { icon: Speaker, color: 'text-yellow-500' },
    'Webcams': { icon: Webcam, color: 'text-indigo-500' },
    'Mobiliario': { icon: Sofa, color: 'text-lime-600' },
    'Default': { icon: Package, color: 'text-zinc-500' },
};

export const categoryNames = [
    'Laptops', 'Tablets', 'Proyectores', 'Cámaras Fotográficas',
    'Filmadoras', 'Grabadoras de Audio', 'Drones', 'Luces de Estudio', 'Periféricos', 'Redes', 'Cables y Adaptadores',
    'Audio', 'Monitores', 'Teclados', 'Mouse', 'Torres/CPU', 'Parlantes', 'Webcams', 'Mobiliario'
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
  smartOptions?: {
    label: string;
    description: string;
    accessories: {
      category: string;
      brand: string;
      model: string;
      attributes?: Record<string, string>;
    }[];
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
    smartOptions: [
      {
        label: 'Incluir Cargador',
        description: 'Cargador compatible',
        accessories: [{
          category: 'Periféricos',
          brand: 'Genérico',
          model: 'Cargador',
          attributes: {
            'Tipo': 'Cargador'
          }
        }]
      },
      {
        label: 'Incluir Mouse',
        description: 'Mouse USB',
        accessories: [{
          category: 'Periféricos',
          brand: 'Logitech',
          model: 'Mouse',
          attributes: {
            'Conexión': 'USB'
          }
        }]
      },
      {
        label: 'Incluir Mochila',
        description: 'Mochila de transporte',
        accessories: [{
          category: 'Periféricos',
          brand: 'Genérico',
          model: 'Mochila',
          attributes: {
            'Tipo': 'Transporte'
          }
        }]
      }
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
    smartOptions: [
      {
        label: 'Incluir Stylus',
        description: 'Lápiz digital compatible para escritura y dibujo',
        accessories: [{
          category: 'Periféricos',
          brand: 'Apple',
          model: 'Apple Pencil',
          attributes: {
            'Tipo': 'Stylus',
            'Compatibilidad': 'iPad'
          }
        }]
      },
      {
        label: 'Kit de Productividad',
        description: 'Teclado, stylus y estuche protector',
        accessories: [
          {
            category: 'Periféricos',
            brand: 'Apple',
            model: 'Magic Keyboard',
            attributes: {
              'Tipo': 'Teclado',
              'Conectividad': 'Bluetooth'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Apple',
            model: 'Apple Pencil',
            attributes: {
              'Tipo': 'Stylus'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Estuche Protector',
            attributes: {
              'Tipo': 'Estuche',
              'Material': 'Silicona'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Cable de Poder',
        description: 'Cable de alimentación estándar de 2 metros',
        accessories: [{
          category: 'Cables y Adaptadores',
          brand: 'Genérico',
          model: 'Cable de Poder 2m',
          attributes: {
            'Tipo': 'Cable de Alimentación',
            'Longitud': '2 metros',
            'Conector': 'IEC C13'
          }
        }]
      },
      {
        label: 'Incluir Cable VGA',
        description: 'Cable VGA de 3 metros para conexiones analógicas',
        accessories: [{
          category: 'Cables y Adaptadores',
          brand: 'Ugreen',
          model: 'Cable VGA 3m',
          attributes: {
            'Tipo': 'VGA',
            'Longitud': '3 metros',
            'Conectores': 'VGA Macho a Macho'
          }
        }]
      },
      {
        label: 'Incluir Estuche',
        description: 'Estuche protector para transporte seguro',
        accessories: [{
          category: 'Periféricos',
          brand: 'Genérico',
          model: 'Estuche para Proyector',
          attributes: {
            'Tipo': 'Estuche Protector',
            'Material': 'Nylon acolchado',
            'Tamaño': 'Estándar'
          }
        }]
      }
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
    smartOptions: [
      {
        label: 'Incluir Tarjeta SD',
        description: 'Tarjeta de memoria SD de 64GB',
        accessories: [{
          category: 'Periféricos',
          brand: 'SanDisk',
          model: 'SD Card 64GB',
          attributes: {
            'Tipo': 'Tarjeta SD',
            'Capacidad': '64GB'
          }
        }]
      },
      {
        label: 'Kit Fotográfico Básico',
        description: 'Tarjeta SD, batería extra y estuche',
        accessories: [
          {
            category: 'Periféricos',
            brand: 'SanDisk',
            model: 'SD Card 64GB',
            attributes: {
              'Tipo': 'Tarjeta SD'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Batería Extra',
            attributes: {
              'Tipo': 'Batería'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Estuche para Cámara',
            attributes: {
              'Tipo': 'Estuche'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Trípode',
        description: 'Trípode profesional para estabilización',
        accessories: [{
          category: 'Periféricos',
          brand: 'Manfrotto',
          model: 'Trípode Profesional',
          attributes: {
            'Tipo': 'Trípode',
            'Material': 'Aluminio',
            'Altura Máxima': '1.8m'
          }
        }]
      },
      {
        label: 'Kit de Grabación Completo',
        description: 'Trípode, tarjeta SD, batería extra y estuche',
        accessories: [
          {
            category: 'Periféricos',
            brand: 'Manfrotto',
            model: 'Trípode Profesional',
            attributes: {
              'Tipo': 'Trípode'
            }
          },
          {
            category: 'Periféricos',
            brand: 'SanDisk',
            model: 'SD Card 128GB',
            attributes: {
              'Tipo': 'Tarjeta SD',
              'Capacidad': '128GB',
              'Velocidad': 'Clase 10'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Batería Extra',
            attributes: {
              'Tipo': 'Batería'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Estuche para Filmadora',
            attributes: {
              'Tipo': 'Estuche',
              'Material': 'Nylon'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Micrófono Externo',
        description: 'Micrófono direccional para mejor calidad',
        accessories: [{
          category: 'Audio',
          brand: 'Rode',
          model: 'VideoMic Pro',
          attributes: {
            'Tipo': 'Micrófono',
            'Patrón': 'Direccional',
            'Conectividad': '3.5mm'
          }
        }]
      },
      {
        label: 'Kit de Grabación Profesional',
        description: 'Micrófono, tarjeta SD, audífonos y estuche',
        accessories: [
          {
            category: 'Audio',
            brand: 'Rode',
            model: 'VideoMic Pro',
            attributes: {
              'Tipo': 'Micrófono'
            }
          },
          {
            category: 'Periféricos',
            brand: 'SanDisk',
            model: 'SD Card 64GB',
            attributes: {
              'Tipo': 'Tarjeta SD',
              'Capacidad': '64GB'
            }
          },
          {
            category: 'Audio',
            brand: 'Sony',
            model: 'Audífonos MDR-7506',
            attributes: {
              'Tipo': 'Audífonos',
              'Impedancia': '63Ω'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Estuche para Grabadora',
            attributes: {
              'Tipo': 'Estuche',
              'Material': 'Espuma'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Batería Extra',
        description: 'Batería adicional para mayor tiempo de vuelo',
        accessories: [{
          category: 'Periféricos',
          brand: 'DJI',
          model: 'Batería Inteligente',
          attributes: {
            'Tipo': 'Batería',
            'Capacidad': '2453mAh',
            'Voltaje': '11.55V'
          }
        }]
      },
      {
        label: 'Kit de Vuelo Completo',
        description: 'Baterías extra, tarjeta SD, hélices y estuche',
        accessories: [
          {
            category: 'Periféricos',
            brand: 'DJI',
            model: 'Batería Inteligente',
            attributes: {
              'Tipo': 'Batería'
            }
          },
          {
            category: 'Periféricos',
            brand: 'DJI',
            model: 'Batería Inteligente',
            attributes: {
              'Tipo': 'Batería'
            }
          },
          {
            category: 'Periféricos',
            brand: 'SanDisk',
            model: 'MicroSD 128GB',
            attributes: {
              'Tipo': 'Tarjeta MicroSD',
              'Capacidad': '128GB',
              'Velocidad': 'U3'
            }
          },
          {
            category: 'Periféricos',
            brand: 'DJI',
            model: 'Hélices de Repuesto',
            attributes: {
              'Tipo': 'Hélices',
              'Cantidad': '4 unidades'
            }
          },
          {
            category: 'Periféricos',
            brand: 'DJI',
            model: 'Estuche de Transporte',
            attributes: {
              'Tipo': 'Estuche',
              'Material': 'Rígido'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Trípode de Luz',
        description: 'Soporte ajustable para posicionamiento',
        accessories: [{
          category: 'Periféricos',
          brand: 'Neewer',
          model: 'Trípode de Luz 2m',
          attributes: {
            'Tipo': 'Trípode',
            'Altura Máxima': '2m',
            'Material': 'Aluminio'
          }
        }]
      },
      {
        label: 'Kit de Iluminación Profesional',
        description: 'Trípode, difusor, reflector y bolsa de transporte',
        accessories: [
          {
            category: 'Periféricos',
            brand: 'Neewer',
            model: 'Trípode de Luz 2m',
            attributes: {
              'Tipo': 'Trípode'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Godox',
            model: 'Softbox 60x60cm',
            attributes: {
              'Tipo': 'Difusor',
              'Tamaño': '60x60cm'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Neewer',
            model: 'Reflector 5 en 1',
            attributes: {
              'Tipo': 'Reflector',
              'Diámetro': '80cm',
              'Colores': '5 superficies'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Bolsa de Transporte',
            attributes: {
              'Tipo': 'Bolsa',
              'Material': 'Nylon'
            }
          }
        ]
      }
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
    smartOptions: [
      {
        label: 'Incluir Cable XLR',
        description: 'Cable XLR de 5 metros para conexión profesional',
        accessories: [{
          category: 'Cables y Adaptadores',
          brand: 'Mogami',
          model: 'Cable XLR 5m',
          attributes: {
            'Tipo': 'XLR',
            'Longitud': '5 metros',
            'Conectores': 'XLR Macho a Hembra'
          }
        }]
      },
      {
        label: 'Kit de Audio Profesional',
        description: 'Cable XLR, soporte de micrófono y filtro anti-pop',
        accessories: [
          {
            category: 'Cables y Adaptadores',
            brand: 'Mogami',
            model: 'Cable XLR 5m',
            attributes: {
              'Tipo': 'XLR'
            }
          },
          {
            category: 'Periféricos',
            brand: 'K&M',
            model: 'Soporte de Micrófono',
            attributes: {
              'Tipo': 'Soporte',
              'Material': 'Metal',
              'Altura Ajustable': 'Sí'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Aokeo',
            model: 'Filtro Anti-Pop',
            attributes: {
              'Tipo': 'Filtro',
              'Diámetro': '15cm'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Genérico',
            model: 'Espuma Acústica',
            attributes: {
              'Tipo': 'Aislamiento',
              'Material': 'Espuma'
            }
          }
        ]
      }
    ],
  },
  'Monitores': {
    suggestedBrands: ['Dell', 'HP', 'LG', 'Samsung', 'Acer', 'Asus'],
    brandPlaceholder: 'Ej: Dell, LG',
    modelPlaceholder: 'Ej: U2720Q, 27UL850',
    technicalDetails: [
      { label: 'Tamaño', suggestions: ['19"', '21.5"', '24"', '27"', '32"', '34" UltraWide'] },
      { label: 'Resolución', suggestions: ['1920x1080', '2560x1440', '3840x2160', '3440x1440'] },
      { label: 'Tipo de Panel', suggestions: ['IPS', 'VA', 'TN', 'OLED'] },
      { label: 'Frecuencia de actualización', suggestions: ['60Hz', '75Hz', '144Hz', '165Hz', '240Hz'] },
      { label: 'Tecnologías', suggestions: ['FreeSync', 'G-Sync', 'HDR', 'USB-C', 'PIP/PBP'] },
    ]
  },
  'Teclados': {
    suggestedBrands: ['Logitech', 'Corsair', 'Razer', 'HyperX', 'Redragon', 'Microsoft'],
    brandPlaceholder: 'Ej: Logitech, Razer',
    modelPlaceholder: 'Ej: K120, BlackWidow',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Membrana', 'Mecánico', 'Semi-mecánico'] },
      { label: 'Switch', suggestions: ['Red', 'Blue', 'Brown', 'Black', 'Silent'] },
      { label: 'Retroiluminación', suggestions: ['Sí', 'No', 'RGB'] },
      { label: 'Teclado numérico', suggestions: ['Sí', 'No'] },
    ]
  },
  'Mouse': {
    suggestedBrands: ['Logitech', 'Razer', 'Corsair', 'SteelSeries', 'HyperX', 'Microsoft'],
    brandPlaceholder: 'Ej: Logitech, Razer',
    modelPlaceholder: 'Ej: G502, DeathAdder',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Óptico', 'Láser'] },
      { label: 'DPI', suggestions: ['1000 DPI', '1600 DPI', '3200 DPI', '6400 DPI', '16000+ DPI'] },
      { label: 'Conectividad', suggestions: ['USB', 'Inalámbrico', 'Bluetooth'] },
      { label: 'Botones programables', suggestions: ['Sí', 'No'] },
      { label: 'Peso', suggestions: ['< 100g', '100-120g', '> 120g'] },
    ]
  },
  'Torres/CPU': {
    suggestedBrands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Ensamblado'],
    brandPlaceholder: 'Ej: Dell, HP, Ensamblado',
    modelPlaceholder: 'Ej: OptiPlex, ProDesk',
    technicalDetails: [
      { label: 'Procesador', suggestions: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'] },
      { label: 'RAM', suggestions: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'] },
      { label: 'Almacenamiento', suggestions: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB HDD', '4 TB HDD', '1 TB SSD + 2 TB HDD'] },
      { label: 'Tarjeta gráfica', suggestions: ['Integrada', 'NVIDIA GTX 1650', 'NVIDIA RTX 3060', 'NVIDIA RTX 4070', 'AMD Radeon RX 6600', 'AMD Radeon RX 7800 XT'] },
      { label: 'Sistema Operativo', suggestions: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Sin sistema operativo'] },
    ]
  },
  'Parlantes': {
    suggestedBrands: ['Logitech', 'Creative', 'Bose', 'JBL', 'Edifier', 'Sony'],
    brandPlaceholder: 'Ej: Logitech, Creative',
    modelPlaceholder: 'Ej: Z120, Pebble',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['2.0', '2.1', '5.1', 'Soundbar'] },
      { label: 'Potencia', suggestions: ['5W', '10W', '20W', '30W', '50W', '100W+'] },
      { label: 'Conectividad', suggestions: ['3.5mm', 'USB', 'Bluetooth', 'Óptico', 'HDMI ARC'] },
      { label: 'Control de volumen', suggestions: ['En parlante', 'Control remoto', 'Sin control'] },
      { label: 'Iluminación', suggestions: ['Sí', 'No', 'RGB'] },
    ]
  },
  'Webcams': {
    suggestedBrands: ['Logitech', 'Microsoft', 'Razer', 'AverMedia', 'Elgato'],
    brandPlaceholder: 'Ej: Logitech, Microsoft',
    modelPlaceholder: 'Ej: C920, Brio',
    technicalDetails: [
      { label: 'Resolución', suggestions: ['720p', '1080p', '2K', '4K'] },
      { label: 'FPS', suggestions: ['30 FPS', '60 FPS', '90 FPS'] },
      { label: 'Enfoque', suggestions: ['Automático', 'Manual', 'Enfoque fijo'] },
      { label: 'Micrófono', suggestions: ['Integrado', 'No incluye'] },
      { label: 'Montaje', suggestions: ['Clip', 'Trípode', 'Soporte universal'] },
    ]
  },
  'Mobiliario': {
    suggestedBrands: ['Genérico', 'Ikea', 'Herman Miller'],
    brandPlaceholder: 'Ej: Genérico',
    modelPlaceholder: 'Ej: Silla Ergonómica, Mesa de trabajo',
    technicalDetails: [
      { label: 'Tipo', suggestions: ['Silla', 'Mesa', 'Estante', 'Pizarra'] },
    ],
    smartOptions: [
      {
        label: 'Incluir Cojín Ergonómico',
        description: 'Cojín de apoyo lumbar para mayor comodidad',
        accessories: [{
          category: 'Mobiliario',
          brand: 'Genérico',
          model: 'Cojín Lumbar',
          attributes: {
            'Tipo': 'Cojín',
            'Material': 'Memory Foam',
            'Color': 'Negro'
          }
        }]
      },
      {
        label: 'Kit de Oficina Completo',
        description: 'Cojín, organizador, lámpara y protector de piso',
        accessories: [
          {
            category: 'Mobiliario',
            brand: 'Genérico',
            model: 'Cojín Lumbar',
            attributes: {
              'Tipo': 'Cojín'
            }
          },
          {
            category: 'Mobiliario',
            brand: 'Genérico',
            model: 'Organizador de Escritorio',
            attributes: {
              'Tipo': 'Organizador',
              'Material': 'Bambú',
              'Compartimentos': '6'
            }
          },
          {
            category: 'Periféricos',
            brand: 'Philips',
            model: 'Lámpara LED Escritorio',
            attributes: {
              'Tipo': 'Lámpara',
              'Potencia': '12W',
              'Regulable': 'Sí'
            }
          },
          {
            category: 'Mobiliario',
            brand: 'Genérico',
            model: 'Protector de Piso',
            attributes: {
              'Tipo': 'Protector',
              'Material': 'PVC',
              'Tamaño': '120x90cm'
            }
          }
        ]
      }
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
