'use client'

import { useState } from 'react'

// Modo lectura: muestra una calificación (enteros o decimales para el promedio)
// Modo interactivo: permite seleccionar calificación 1-5

type Props =
  | { modo: 'lectura'; valor: number; size?: 'sm' | 'md' | 'lg' }
  | { modo: 'interactivo'; valor: number; onChange: (v: number) => void; size?: 'sm' | 'md' | 'lg' }

export default function Estrellas(props: Props) {
  const [hover, setHover] = useState(0)

  const size = props.size ?? 'md'
  const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18

  if (props.modo === 'lectura') {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${props.valor} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const llena = props.valor >= i
          const media = !llena && props.valor >= i - 0.5
          return (
            <svg
              key={i}
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={llena ? '#F59E0B' : media ? `url(#half-${i})` : '#D1D5DB'}
              />
            </svg>
          )
        })}
      </span>
    )
  }

  // Modo interactivo
  const activo = hover > 0 ? hover : props.valor
  return (
    <span
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
      aria-label="Seleccioná una calificación"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => props.onChange(i)}
          onMouseEnter={() => setHover(i)}
          aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={activo >= i ? '#F59E0B' : '#D1D5DB'}
            />
          </svg>
        </button>
      ))}
    </span>
  )
}
