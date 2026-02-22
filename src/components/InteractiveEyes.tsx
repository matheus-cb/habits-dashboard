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

  // Dispara animação de choque quando a senha é revelada com campo de senha focado
  useEffect(() => {
    if (!showPassword) {
      setShockAnim(false);
      prevShowPassword.current = false;
      return;
    }
    if (!prevShowPassword.current && passwordFocused) {
      setShockAnim(true);
      const t = setTimeout(() => setShockAnim(false), 650);
      prevShowPassword.current = true;
      return () => clearTimeout(t);
    }
  }, [showPassword, passwordFocused]);

  // Três estados visuais
  const isSleeping = !passwordFocused && !textFocused;
  const isExcited  = passwordFocused && showPassword;
  // isSemiOpen = qualquer campo focado sem showPassword ativo na senha

  // fechado=2.0 | semi-aberto=0.95 (email e senha) | super animado=0.18
  const eyelidScaleY = isSleeping ? 2.0 : isExcited ? 0.18 : 0.95;

  // Pupila dilatada APENAS no estado super animado
  const pupilR = isExcited ? 13 : 9;

  // Atualiza posição da pupila via DOM — sem re-render a cada tecla
  useEffect(() => {
    let offsetX = 0;
    let offsetY = 0;

    if (isExcited) {
      // Super animado — olha direto para frente
      offsetX = 0;
      offsetY = 0;
    } else if (passwordFocused || textFocused) {
      // Semi-aberto — deriva suavemente para a direita conforme digita
      const length = passwordFocused ? passwordLength : textLength;
      offsetX = Math.min(length * 0.12, 3);
      offsetY = 8;
    }

    EYES.forEach(({ id }) => {
      const pupil = svgRef.current?.getElementById(`pupil-${id}`) as SVGElement | null;
      const glint = svgRef.current?.getElementById(`glint-${id}`) as SVGElement | null;
      const glint2 = svgRef.current?.getElementById(`glint2-${id}`) as SVGElement | null;
      if (pupil) pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      if (glint) glint.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      if (glint2) glint2.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
  }, [passwordLength, passwordFocused, isExcited, textFocused, textLength]);

  const getBrowControlY = (cy: number) => {
    if (isExcited) return cy - SR - 30;   // disparada para cima
    if (!isSleeping) return cy - SR - 20; // semi-aberto — levemente levantada
    return cy - SR - 16;                  // relaxada (sleeping)
  };

  // Translação vertical extra da sobrancelha no estado animado
  const browTranslateY = isExcited ? -8 : 0;

  const getEyelidClass = (id: string) => {
    if (shockAnim) return id === 'right' ? 'eye-shocked eye-shocked-right' : 'eye-shocked';
    return ''; // sem piscar — olho fechado (sleeping) ou aberto por CSS/style
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
            {/* Íris lilás suave */}
            <stop offset="0%"   stopColor="#fefcff" />
            <stop offset="40%"  stopColor="#ede8f9" />
            <stop offset="78%"  stopColor="#c5b8e6" />
            <stop offset="100%" stopColor="#9278c0" />
          </radialGradient>
        ))}
        {EYES.map(({ id, cx, cy }) => (
          <clipPath key={`clip-${id}`} id={`clip-eye-${id}`}>
            <circle cx={cx} cy={cy} r={SR} />
          </clipPath>
        ))}
        <filter id="eye-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#c5b8e618" />
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
              fill="white" stroke="#ede8f9" strokeWidth="1.5"
              filter="url(#eye-shadow)"
            />
            {/* Íris com gradiente radial azul */}
            <circle cx={cx} cy={cy} r={IR} fill={`url(#iris-grad-${id})`} />
            {/* Anel limbal (efeito de profundidade) */}
            <circle cx={cx} cy={cy} r={IR} fill="none" stroke="#9278c0" strokeWidth="1" opacity={0.25} />
            {/* Pupila */}
            <circle
              id={`pupil-${id}`}
              cx={cx} cy={cy} r={pupilR}
              fill="#0c1a2e"
              style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), r 0.35s ease' }}
            />
            {/* Reflexo principal */}
            <circle
              id={`glint-${id}`}
              cx={cx - 4} cy={cy - 5} r={3}
              fill="white" opacity={0.9}
              style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
            {/* Reflexo secundário */}
            <circle
              id={`glint2-${id}`}
              cx={cx + 4} cy={cy - 7} r={1.5}
              fill="white" opacity={0.55}
              style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
            {/* Pálpebra superior — <g> com clip fixo, path anima dentro */}
            <g clipPath={`url(#clip-eye-${id})`}>
              <path
                id={`eyelid-${id}`}
                d={eyelidPath}
                fill="white"
                style={{
                  transformOrigin: `${cx}px ${cy - SR}px`,
                  transform: `scaleY(${eyelidScaleY})`,
                  transition: shockAnim ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={getEyelidClass(id)}
              />
            </g>
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
