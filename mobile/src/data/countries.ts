/**
 * Lista de países con códigos telefónicos y banderas
 * Datos principales de América Latina y países comunes
 */

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  states?: State[];
}

export interface State {
  id: string;
  name: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    flag: '🇦🇷',
    states: [
      {
        id: 'buenos-aires',
        name: 'Buenos Aires',
        cities: ['CABA', 'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Quilmes', 'Morón']
      },
      {
        id: 'cordoba',
        name: 'Córdoba',
        cities: ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María']
      },
      {
        id: 'santa-fe',
        name: 'Santa Fe',
        cities: ['Rosario', 'Santa Fe', 'Venado Tuerto', 'Rafaela']
      },
      {
        id: 'mendoza',
        name: 'Mendoza',
        cities: ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo']
      },
      {
        id: 'tucuman',
        name: 'Tucumán',
        cities: ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo']
      }
    ]
  },
  {
    code: 'MX',
    name: 'México',
    dialCode: '+52',
    flag: '🇲🇽',
    states: [
      {
        id: 'cdmx',
        name: 'Ciudad de México',
        cities: ['CDMX', 'Iztapalapa', 'Gustavo A. Madero', 'Álvaro Obregón']
      },
      {
        id: 'jalisco',
        name: 'Jalisco',
        cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá']
      },
      {
        id: 'nuevo-leon',
        name: 'Nuevo León',
        cities: ['Monterrey', 'San Pedro Garza García', 'Guadalupe', 'Apodaca']
      }
    ]
  },
  {
    code: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    flag: '🇨🇴',
    states: [
      {
        id: 'bogota',
        name: 'Bogotá D.C.',
        cities: ['Bogotá', 'Suba', 'Kennedy', 'Engativá']
      },
      {
        id: 'antioquia',
        name: 'Antioquia',
        cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado']
      },
      {
        id: 'valle',
        name: 'Valle del Cauca',
        cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá']
      }
    ]
  },
  {
    code: 'CL',
    name: 'Chile',
    dialCode: '+56',
    flag: '🇨🇱',
    states: [
      {
        id: 'metropolitana',
        name: 'Región Metropolitana',
        cities: ['Santiago', 'Maipú', 'La Florida', 'Puente Alto']
      },
      {
        id: 'valparaiso',
        name: 'Valparaíso',
        cities: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana']
      }
    ]
  },
  {
    code: 'PE',
    name: 'Perú',
    dialCode: '+51',
    flag: '🇵🇪',
    states: [
      {
        id: 'lima',
        name: 'Lima',
        cities: ['Lima', 'Callao', 'San Juan de Lurigancho', 'San Martín de Porres']
      },
      {
        id: 'arequipa',
        name: 'Arequipa',
        cities: ['Arequipa', 'Cayma', 'Cerro Colorado', 'Yanahuara']
      }
    ]
  },
  {
    code: 'UY',
    name: 'Uruguay',
    dialCode: '+598',
    flag: '🇺🇾',
    states: [
      {
        id: 'montevideo',
        name: 'Montevideo',
        cities: ['Montevideo', 'Ciudad Vieja', 'Pocitos', 'Carrasco']
      },
      {
        id: 'canelones',
        name: 'Canelones',
        cities: ['Canelones', 'Ciudad de la Costa', 'Las Piedras', 'Pando']
      }
    ]
  },
  {
    code: 'PY',
    name: 'Paraguay',
    dialCode: '+595',
    flag: '🇵🇾',
    states: [
      {
        id: 'asuncion',
        name: 'Asunción',
        cities: ['Asunción', 'Lambaré', 'Fernando de la Mora', 'San Lorenzo']
      }
    ]
  },
  {
    code: 'BO',
    name: 'Bolivia',
    dialCode: '+591',
    flag: '🇧🇴',
    states: [
      {
        id: 'la-paz',
        name: 'La Paz',
        cities: ['La Paz', 'El Alto', 'Viacha']
      },
      {
        id: 'santa-cruz',
        name: 'Santa Cruz',
        cities: ['Santa Cruz de la Sierra', 'Montero', 'Warnes']
      }
    ]
  },
  {
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷',
    states: [
      {
        id: 'sao-paulo',
        name: 'São Paulo',
        cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo']
      },
      {
        id: 'rio',
        name: 'Rio de Janeiro',
        cities: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu']
      }
    ]
  },
  {
    code: 'VE',
    name: 'Venezuela',
    dialCode: '+58',
    flag: '🇻🇪',
    states: [
      {
        id: 'caracas',
        name: 'Distrito Capital',
        cities: ['Caracas', 'Chacao', 'Baruta', 'El Hatillo']
      }
    ]
  },
  {
    code: 'EC',
    name: 'Ecuador',
    dialCode: '+593',
    flag: '🇪🇨',
    states: [
      {
        id: 'pichincha',
        name: 'Pichincha',
        cities: ['Quito', 'Cayambe', 'Sangolquí', 'Machachi']
      },
      {
        id: 'guayas',
        name: 'Guayas',
        cities: ['Guayaquil', 'Durán', 'Milagro', 'Daule']
      }
    ]
  },
  {
    code: 'ES',
    name: 'España',
    dialCode: '+34',
    flag: '🇪🇸',
    states: [
      {
        id: 'madrid',
        name: 'Madrid',
        cities: ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada']
      },
      {
        id: 'barcelona',
        name: 'Barcelona',
        cities: ['Barcelona', 'Hospitalet', 'Badalona', 'Sabadell']
      }
    ]
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flag: '🇺🇸',
    states: [
      {
        id: 'california',
        name: 'California',
        cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose']
      },
      {
        id: 'florida',
        name: 'Florida',
        cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville']
      },
      {
        id: 'texas',
        name: 'Texas',
        cities: ['Houston', 'Dallas', 'Austin', 'San Antonio']
      },
      {
        id: 'new-york',
        name: 'New York',
        cities: ['New York City', 'Buffalo', 'Rochester', 'Albany']
      }
    ]
  }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return COUNTRIES.find(c => c.dialCode === dialCode);
};
