import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
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
			colors: {
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
				stamp: {
					DEFAULT: 'hsl(var(--stamp-bg))',
					foreground: 'hsl(var(--stamp-fg))'
				},
				product: {
					DEFAULT: 'hsl(var(--product-bg))',
					foreground: 'hsl(var(--product-fg))'
				},
				employee: {
					DEFAULT: 'hsl(var(--employee-bg))',
					foreground: 'hsl(var(--employee-fg))'
				},
				failure: {
					DEFAULT: 'hsl(var(--failure-bg))',
					foreground: 'hsl(var(--failure-fg))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning-bg))',
					foreground: 'hsl(var(--warning-fg))'
				},
				success: {
					DEFAULT: 'hsl(var(--success-bg))',
					foreground: 'hsl(var(--success-fg))'
				},
				estampa: {
					DEFAULT: 'hsl(var(--estampa-bg))',
					foreground: 'hsl(var(--estampa-fg))'
				},
				costura: {
					DEFAULT: 'hsl(var(--costura-bg))',
					foreground: 'hsl(var(--costura-fg))'
				},
				corte: {
					DEFAULT: 'hsl(var(--corte-bg))',
					foreground: 'hsl(var(--corte-fg))'
				},
				acabamento: {
					DEFAULT: 'hsl(var(--acabamento-bg))',
					foreground: 'hsl(var(--acabamento-fg))'
				},
				qualidade: {
					DEFAULT: 'hsl(var(--qualidade-bg))',
					foreground: 'hsl(var(--qualidade-fg))'
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
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
