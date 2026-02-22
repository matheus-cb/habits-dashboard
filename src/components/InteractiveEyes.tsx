import { useEffect, useRef, useState } from 'react';

interface InteractiveEyesProps {
  passwordFocused: boolean;
  passwordLength: number;
  showPassword: boolean;
  textFocused: boolean;
  textLength: number;
}

const EYES = [
  { id: 'left', cx: 80, cy: 73 },
  { id: 'right', cx: 160, cy: 73 },
] as const;

const SR = 32; // sclera radius
const IR = 19; // iris radius

export default function InteractiveEyes({
  passwordFocused,
  passwordLength,
  showPassword,
  textFocused,
  textLength,
}: InteractiveEyesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shockAnim, setShockAnim] = useState(false);
  const prevShowPassword = useRef(false);

  // Dispara animação de choque quando a senha é revelada
  useEffect(() => {
    if (!showPassword) {
      setShockAnim(false);
      prevShowPassword.current = false;
      return;
    }
    if (!prevShowPassword.current) {
      setShockAnim(true);
      const t = setTimeout(() => setShockAnim(false), 650);
      prevShowPassword.current = true;
      return () => clearTimeout(t);
    }
  }, [showPassword]);

  // Prioridade: showPassword > passwordFocused > textFocused > idle
  const isIdle = !passwordFocused && !showPassword && !textFocused;

  const eyelidScaleY = showPassword
    ? 0.18
    : passwordFocused
    ? 0.95
    : textFocused
    ? 0.38
    : 0.45;

  const pupilR = showPassword ? 13 : textFocused ? 9 : 9;

  // Atualiza posição da pupila via DOM — sem re-render a cada tecla
  useEffect(() => {
    let offsetX = 0;
    let offsetY = 0;

    if (showPassword) {
      // Olha direto para frente (susto)
      offsetX = 0;
      offsetY = 0;
    } else if (passwordFocused) {
      // Leitura: varre da esquerda para direita, olhando para baixo
      offsetX = Math.min(passwordLength * 0.7, 8) - 4;
      offsetY = 5;
    } else if (textFocused) {
      // Varredura suave da esquerda para direita
      offsetX = Math.min(textLength * 0.4, 6);
      offsetY = 2;
    }

    EYES.forEach(({ id }) => {
      const pupil = svgRef.current?.getElementById(`pupil-${id}`) as SVGElement | null;
      const glint = svgRef.current?.getElementById(`glint-${id}`) as SVGElement | null;
      const glint2 = svgRef.current?.getElementById(`glint2-${id}`) as SVGElement | null;
      if (pupil) pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      if (glint) glint.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      if (glint2) glint2.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
  }, [passwordLength, passwordFocused, showPassword, textFocused, textLength]);

  const getBrowControlY = (cy: number) => {
    if (showPassword) return cy - SR - 30;    // sobrancelha disparada para cima
    if (passwordFocused) return cy - SR - 13; // franzida/concentrada
    if (textFocused) return cy - SR - 22;     // levemente levantada
    return cy - SR - 19;                      // posição normal
  };

  // Translação vertical extra da sobrancelha no estado revelado
  const browTranslateY = showPassword ? -8 : 0;

  const getEyelidClass = (id: string) => {
    if (shockAnim) return id === 'right' ? 'eye-shocked eye-shocked-right' : 'eye-shocked';
    if (isIdle) return id === 'right' ? 'eye-blink eye-blink-right' : 'eye-blink';
    return '';
  };

  return (
    <svg
      ref={svgRef}
      width="240"
      height="130"
      viewBox="0 0 240 130"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-4"
    >
      <defs>
        {EYES.map(({ id }) => (
          <radialGradient key={id} id={`iris-grad-${id}`} cx="38%" cy="32%" r="65%">
            {/* Íris azul céu — amigável e calorosa */}
            <stop offset="0%"   stopColor="#e0f2fe" />
            <stop offset="40%"  stopColor="#7dd3fc" />
            <stop offset="78%"  stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
        ))}
        <filter id="eye-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c722" />
        </filter>
      </defs>

      {EYES.map(({ id, cx, cy }) => {
        const controlY = getBrowControlY(cy);
        const browY = cy - SR - 10;
        const eyelidPath = `M ${cx - SR},${cy} A ${SR},${SR} 0 0,1 ${cx + SR},${cy} Z`;

        return (
          <g key={id}>
            {/* Esclera */}
            <circle
              cx={cx} cy={cy} r={SR}
              fill="white" stroke="#e0f2fe" strokeWidth="1.5"
              filter="url(#eye-shadow)"
            />
            {/* Íris com gradiente radial azul */}
            <circle cx={cx} cy={cy} r={IR} fill={`url(#iris-grad-${id})`} />
            {/* Anel limbal (efeito de profundidade) */}
            <circle cx={cx} cy={cy} r={IR} fill="none" stroke="#0369a1" strokeWidth="1" opacity={0.4} />
            {/* Pupila */}
            <circle
              id={`pupil-${id}`}
              cx={cx} cy={cy} r={pupilR}
              fill="#0c1a2e"
              style={{ transition: 'transform 0.15s ease, r 0.35s ease' }}
            />
            {/* Reflexo principal */}
            <circle
              id={`glint-${id}`}
              cx={cx - 4} cy={cy - 5} r={3}
              fill="white" opacity={0.9}
              style={{ transition: 'transform 0.15s ease' }}
            />
            {/* Reflexo secundário */}
            <circle
              id={`glint2-${id}`}
              cx={cx + 4} cy={cy - 7} r={1.5}
              fill="white" opacity={0.55}
              style={{ transition: 'transform 0.15s ease' }}
            />
            {/* Pálpebra superior como arco */}
            <path
              id={`eyelid-${id}`}
              d={eyelidPath}
              fill="white"
              style={{
                transformOrigin: `${cx}px ${cy - SR}px`,
                transform: `scaleY(${eyelidScaleY})`,
                // Desativa transition durante a animação de choque para não conflitar
                transition: shockAnim ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className={getEyelidClass(id)}
            />
            {/* Sobrancelha (bezier quadrático) */}
            <path
              d={`M ${cx - 20},${browY} Q ${cx},${controlY} ${cx + 20},${browY}`}
              fill="none"
              stroke="#374151"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transform: `translateY(${browTranslateY}px)`,
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transformOrigin: `${cx}px ${cy - SR - 15}px`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
