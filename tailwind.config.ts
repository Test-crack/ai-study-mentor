import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	future: {
		hoverOnlyWhenSupported: true,
	},
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				// Marketing site type. Loaded via Google Fonts in index.html.
				manrope: ['Manrope', 'sans-serif'],
				plex: ['"IBM Plex Sans"', 'sans-serif'],
				jetbrains: ['"JetBrains Mono"', 'monospace'],
				// Student Dashboard only — matches the reference design's primary UI font.
				dm: ['"DM Sans"', 'sans-serif'],
			},
			colors: {
				/**
				 * TestCrack brand palette — deep ink + action teal.
				 * Replaces the previous indigo/purple scheme across the marketing
				 * site. Scoped under `brand` so it does not disturb the shadcn
				 * HSL tokens used by the authenticated app.
				 */
				brand: {
					/**
					 * Action teal. 50–950 ramp so the app-wide sweep can map
					 * indigo-N -> brand-teal-N shade-for-shade and keep every
					 * existing light/dark relationship intact.
					 * 600 is the primary action colour; 700 its hover.
					 */
					/**
					 * Vivid mint — the hero's bright accent. Nothing in the existing
					 * ramp is saturated enough for it; revert to `teal-300` to drop it.
					 */
					mint: '#3EE0A0',
					teal: {
						DEFAULT: '#0E7C66',   // primary action
						dark: '#0B6151',      // hover
						soft: '#7FBFB6',      // accents on dark
						mute: '#B5D6D1',
						tint: '#D6E7E4',      // badge / icon backgrounds
						wash: '#EAF3F1',      // lightest fill
						50: '#F0F7F5',
						100: '#D6E7E4',
						200: '#B0D4CE',
						300: '#7FBFB6',
						400: '#0D9488',
						500: '#12897C',
						600: '#0E7C66',
						700: '#0B6151',
						800: '#0C574F',
						900: '#0E463F',
						950: '#0E1F2B',
					},
					/**
					 * Academic blue. purple/violet map here rather than onto teal,
					 * so existing two-tone gradients keep a visible hue shift.
					 */
					blue: {
						DEFAULT: '#185A78',   // secondary data accent
						tint: '#E6EFF2',
						50: '#F1F6F8',
						100: '#DCE9EE',
						200: '#BBD3DD',
						300: '#8FB6C7',
						400: '#4E8CA6',
						500: '#256B8B',
						600: '#185A78',
						700: '#154B64',
						800: '#133D52',
						900: '#122F3F',
						950: '#0E1F2B',
					},
					ink: {
						DEFAULT: '#142B3A',   // headings, CTA block
						deep: '#0B1F26',      // footer
						nav: '#1C3D4D',       // nav bar — lighter than ink so the logo's dark squares stay visible
					},
					warm: {
						DEFAULT: '#E8753D',   // risk / attention
						tint: '#FDEEE6',
						danger: '#DC4C1B',    // destructive hover (e.g. logout)
					},
					line: '#D8E0E2',
					'on-ink': '#B7C4C9',    // body copy on dark
					'on-ink-mute': '#8FA0A8',
					// light chapters + body text
					bg: '#F4F5F1',
					'bg-alt': '#EAF0EF',
					text: '#17232B',
					'text-mute': '#5E6B73',
					'on-ink-nav': '#C3CFD4',
					'on-ink-feature': '#E6ECEE',
					// hairline borders/dividers on ink
					'line-09': 'rgba(246,247,243,0.09)',
					'line-12': 'rgba(246,247,243,0.12)',
					'line-14': 'rgba(246,247,243,0.14)',
					'line-16': 'rgba(246,247,243,0.16)',
					'line-20': 'rgba(246,247,243,0.20)',
					'line-25': 'rgba(246,247,243,0.25)',
					'line-35': 'rgba(246,247,243,0.35)',
					'line-60': 'rgba(246,247,243,0.60)',
					'wash-06': 'rgba(246,247,243,0.06)',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;