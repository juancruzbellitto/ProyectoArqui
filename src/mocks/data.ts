// Tipos del dominio usados en los mocks y luego en la app real
export interface Complejo {
  id: number;
  nombre: string;
  direccion: string;
  canchasDisponibles: number;
  deportes: string[];
}

export interface Cancha {
  id: number;
  nombre: string;
  deporte: string;
  complejoId: number;
  complejoNombre: string;
  horarioApertura: string;
  horarioCierre: string;
  disponible: boolean;
}

export const complejos: Complejo[] = [
  {
    id: 1,
    nombre: "Complejo Los Pinos",
    direccion: "Av. Corrientes 1234, Buenos Aires",
    canchasDisponibles: 3,
    deportes: ["Fútbol 5", "Pádel", "Tenis"],
  },
  {
    id: 2,
    nombre: "Centro Deportivo Sur",
    direccion: "Calle Rivadavia 567, Lomas de Zamora",
    canchasDisponibles: 2,
    deportes: ["Fútbol 5", "Básquet"],
  },
  {
    id: 3,
    nombre: "Club Atlético Norte",
    direccion: "Av. San Martín 890, San Isidro",
    canchasDisponibles: 4,
    deportes: ["Pádel", "Tenis", "Fútbol 7"],
  },
];

export const canchas: Cancha[] = [
  {
    id: 1,
    nombre: "Cancha 1 — Césped Sintético",
    deporte: "Fútbol 5",
    complejoId: 1,
    complejoNombre: "Complejo Los Pinos",
    horarioApertura: "08:00",
    horarioCierre: "23:00",
    disponible: true,
  },
  {
    id: 2,
    nombre: "Cancha de Pádel A",
    deporte: "Pádel",
    complejoId: 1,
    complejoNombre: "Complejo Los Pinos",
    horarioApertura: "09:00",
    horarioCierre: "22:00",
    disponible: false,
  },
  {
    id: 3,
    nombre: "Cancha Central",
    deporte: "Fútbol 5",
    complejoId: 2,
    complejoNombre: "Centro Deportivo Sur",
    horarioApertura: "07:00",
    horarioCierre: "23:00",
    disponible: true,
  },
  {
    id: 4,
    nombre: "Cancha de Básquet",
    deporte: "Básquet",
    complejoId: 2,
    complejoNombre: "Centro Deportivo Sur",
    horarioApertura: "08:00",
    horarioCierre: "21:00",
    disponible: true,
  },
  {
    id: 5,
    nombre: "Cancha de Tenis 1",
    deporte: "Tenis",
    complejoId: 3,
    complejoNombre: "Club Atlético Norte",
    horarioApertura: "07:00",
    horarioCierre: "22:00",
    disponible: false,
  },
  {
    id: 6,
    nombre: "Cancha de Pádel Premium",
    deporte: "Pádel",
    complejoId: 3,
    complejoNombre: "Club Atlético Norte",
    horarioApertura: "08:00",
    horarioCierre: "23:00",
    disponible: true,
  },
];
