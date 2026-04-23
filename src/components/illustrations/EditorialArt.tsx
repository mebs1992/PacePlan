import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

type ArtProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const baseStops = {
  paper: '#FBF6EE',
  cream: '#F2E6D2',
  sand: '#D9C4A8',
  sage: '#8FA08E',
  sageDeep: '#65796F',
  rust: '#B35A3C',
  rustSoft: '#D38F66',
  olive: '#6D6752',
  ink: '#2A251F',
};

export function LandscapeArt({ className, title = 'Landscape', ...props }: ArtProps) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={title}
      {...props}
    >
      <defs>
        <linearGradient id="sky-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={baseStops.paper} />
          <stop offset="55%" stopColor={baseStops.cream} />
          <stop offset="100%" stopColor="#E0D4C2" />
        </linearGradient>
        <linearGradient id="hill-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D5C8B7" />
          <stop offset="100%" stopColor="#B8AB97" />
        </linearGradient>
        <linearGradient id="hill-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#AFA28E" />
          <stop offset="100%" stopColor="#887C6A" />
        </linearGradient>
        <linearGradient id="ground" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6D6752" />
          <stop offset="100%" stopColor="#4B473B" />
        </linearGradient>
        <linearGradient id="path" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF2DE" />
          <stop offset="100%" stopColor="#D8B895" />
        </linearGradient>
        <radialGradient id="sun-wash" cx="50%" cy="45%" r="45%">
          <stop offset="0%" stopColor="#FFF6E8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFF6E8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="220" rx="28" fill="url(#sky-glow)" />
      <circle cx="238" cy="58" r="25" fill={baseStops.rustSoft} fillOpacity="0.85" />
      <circle cx="214" cy="74" r="88" fill="url(#sun-wash)" />
      <path
        d="M0 120C40 100 90 95 134 108C177 121 208 118 248 99C271 88 301 87 320 92V220H0Z"
        fill="url(#hill-1)"
      />
      <path
        d="M0 142C43 151 69 132 116 130C155 128 198 156 246 140C280 129 299 127 320 131V220H0Z"
        fill="url(#hill-2)"
      />
      <path
        d="M0 176C34 158 77 154 116 171C153 188 193 186 224 167C257 147 296 150 320 164V220H0Z"
        fill="url(#ground)"
      />
      <path
        d="M174 220C171 192 177 166 189 141C199 120 206 100 203 88C177 95 154 113 137 139C111 179 101 200 102 220Z"
        fill="#D0B18D"
        fillOpacity="0.28"
      />
      <path
        d="M154 220C148 197 151 175 163 150C176 123 198 103 228 86C212 88 191 94 170 107C132 131 105 168 97 220Z"
        fill="#FFF2DC"
        fillOpacity="0.6"
      />
      <path
        d="M160 220C155 196 158 176 168 155C179 132 198 110 225 92C213 93 196 99 176 111C142 132 119 165 112 220Z"
        fill="url(#path)"
      />
      <path
        d="M160 220C156 206 157 192 163 177C150 187 139 199 131 220Z"
        fill="#C49F77"
      />
      <path
        d="M195 171C190 161 190 152 194 144C199 135 206 129 214 126C208 135 205 143 205 152C205 160 208 166 214 171Z"
        fill="#1F1B17"
        fillOpacity="0.86"
      />
      <rect x="196" y="170" width="6" height="21" rx="3" fill="#1F1B17" fillOpacity="0.86" />
      <path d="M188 191H208" stroke="#1F1B17" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.86" />
      <ellipse cx="194" cy="191" rx="8" ry="3" fill="#1F1B17" fillOpacity="0.15" />
      <ellipse cx="210" cy="192" rx="10" ry="3" fill="#1F1B17" fillOpacity="0.1" />
      <path
        d="M63 55C75 43 92 39 109 42C94 44 82 50 72 61Z"
        fill="#FFF7ED"
        fillOpacity="0.6"
      />
      <path
        d="M101 68C108 60 118 57 129 60C120 61 112 65 106 72Z"
        fill="#FFF7ED"
        fillOpacity="0.46"
      />
    </svg>
  );
}

export function GlassStillLifeArt({
  className,
  title = 'Glass of water with lime',
  ...props
}: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={title}
      {...props}
    >
      <defs>
        <linearGradient id="glass-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECF4F1" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#B7C8C2" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="glass-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#BFCAC6" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="table-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6EFDF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F6EFDF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="240" height="180" rx="28" fill="transparent" />
      <ellipse cx="118" cy="132" rx="84" ry="28" fill="url(#table-glow)" />
      <path
        d="M100 26C118 24 130 24 148 26C147 79 147 111 145 123C143 139 104 139 102 123C100 111 100 79 100 26Z"
        fill="url(#glass-rim)"
        stroke="#A7B7B1"
        strokeWidth="1.5"
      />
      <path
        d="M104 55C117 53 130 53 144 55C143 78 143 97 141 117C139 129 106 129 104 117C102 97 103 78 104 55Z"
        fill="url(#glass-fill)"
      />
      <ellipse cx="124" cy="26" rx="24" ry="5" fill="#F9FCFB" stroke="#BAC8C3" strokeWidth="1.4" />
      <ellipse cx="124" cy="55" rx="20" ry="4" fill="#E2EFEB" />
      <path d="M133 31C138 47 141 69 142 108" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="123" cy="129" rx="30" ry="8" fill="#867761" fillOpacity="0.15" />
      <ellipse cx="76" cy="130" rx="30" ry="8" fill="#867761" fillOpacity="0.15" />

      <g transform="translate(28 96)">
        <ellipse cx="42" cy="28" rx="28" ry="18" fill="#CCB36B" fillOpacity="0.26" />
        <path
          d="M18 25C18 11 30 0 44 0C58 0 70 11 70 25C70 39 58 50 44 50C30 50 18 39 18 25Z"
          fill="#F5E3A0"
          stroke="#C2A253"
          strokeWidth="2"
        />
        <path d="M44 0V50" stroke="#CFB46C" strokeWidth="2" />
        <path d="M18 25H70" stroke="#CFB46C" strokeWidth="2" />
        <path d="M26 10L62 40" stroke="#CFB46C" strokeWidth="1.6" />
        <path d="M26 40L62 10" stroke="#CFB46C" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function TrendSparkArt({ className, title = 'Trend line', ...props }: ArtProps) {
  return (
    <svg
      viewBox="0 0 280 160"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={title}
      {...props}
    >
      <defs>
        <linearGradient id="trend-wash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8F1E6" />
          <stop offset="100%" stopColor="#EFE2CF" />
        </linearGradient>
        <linearGradient id="trend-line" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CABFA7" />
          <stop offset="100%" stopColor="#A38E4A" />
        </linearGradient>
      </defs>

      <rect width="280" height="160" rx="24" fill="url(#trend-wash)" />
      <path
        d="M0 132C28 123 43 110 76 114C101 117 117 126 141 122C166 118 186 100 209 97C231 94 249 105 280 96V160H0Z"
        fill="#E9DECC"
      />
      <path
        d="M0 144C37 136 64 132 99 136C137 141 167 130 206 128C234 127 256 131 280 136V160H0Z"
        fill="#F1E8DA"
      />
      <path
        d="M28 116L66 102L96 110L137 82L170 93L217 60L244 66L268 36"
        fill="none"
        stroke="url(#trend-line)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M252 20L268 36L247 41" fill="none" stroke="#A38E4A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
