import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Clock3, Flame, HeartHandshake, Instagram, MapPin, Menu as MenuIcon, MessageCircle, Minus, PackageCheck,
  Phone, Plus, Quote, RefreshCw, Search, ShieldCheck, ShoppingBag, Soup, Sparkles, Star, Store,
  Truck, Utensils, X, Zap,
} from 'lucide-react';
import {
  getGetAdminSessionQueryKey, getListAdminOrdersQueryKey, getListMenuQueryKey, getListOrdersQueryKey,
  type AdminOrder, type AdminOrderStatus, type MenuItem, type Order,
  type OrderInput, type OrderStatus, useCancelOrder, useCreateOrder, useListMenu, useListOrders,
  useAdminLogin, useGetAdminSession, useListAdminOrders, useTrackOrder, useUpdateAdminOrderStatus,
  useUpdateMenuAvailability, useUpdateOrderPayment, useUpdateOrderStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logoPath from '@assets/debite-logo.png';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

type CartLine = { item: MenuItem; quantity: number; customizations: Record<string, string>; unitPrice: number };
type CartContextValue = {
  cart: CartLine[];
  addToCart: (item: MenuItem, customizations?: Record<string, string>, unitPrice?: number) => void;
  setQuantity: (itemId: string, quantity: number, customizations?: Record<string, string>) => void;
  removeFromCart: (itemId: string, customizations?: Record<string, string>) => void;
  clearCart: () => void;
  total: number;
  count: number;
};
const CartContext = createContext<CartContextValue | null>(null);
const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('Cart context missing');
  return value;
};

const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;
const sameCustomizations = (a: Record<string, string>, b: Record<string, string>) =>
  JSON.stringify(a) === JSON.stringify(b);
const statusLabels: Record<string, string> = {
  received: 'Order received', confirmed: 'Payment confirmed', preparing: 'Preparing your food',
  ready: 'Ready for pickup / dispatch', out_for_delivery: 'Out for delivery', completed: 'Completed',
  cancelled: 'Order cancelled',
};
const statuses: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];
const cancellableStatuses: OrderStatus[] = ['received', 'confirmed'];
type KitchenOrderStatus = Exclude<OrderStatus, 'cancelled'>;
type KitchenAdminOrderStatus = Exclude<AdminOrderStatus, 'cancelled'>;
const queryClient = new QueryClient();

function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const [location] = useLocation();
  const links = [['Menu', '/menu'], ['Our story', '/about'], ['Track order', '/track'], ['Contact', '/contact']];
  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border)/.8)] bg-[hsl(var(--background)/.92)] backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between gap-5">
        <Link href="/" data-testid="link-home" className="flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-90">
          <img src={logoPath} alt="De•Bite" className="h-12 w-12 object-contain" />
          <span className="hidden text-[17px] font-bold tracking-tight sm:block">De<span className="text-[hsl(var(--secondary))]">•</span>Bite</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}
                className={`relative text-sm font-semibold transition-colors py-1 ${isActive ? 'text-[hsl(var(--accent))] font-bold' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
              >
                {label}
                {isActive && <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[hsl(var(--accent))]" />}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/menu" data-testid="link-header-order" className="btn-primary hidden sm:inline-flex"><Utensils size={16} /> Order food</Link>
          <Link href="/checkout" data-testid="link-cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-transform hover:-translate-y-0.5">
            <ShoppingBag size={19} />
            {count > 0 && <span data-testid="text-cart-count" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[10px] font-bold text-white shadow-sm">{count}</span>}
          </Link>
          <button type="button" aria-label="Toggle navigation" data-testid="button-mobile-menu" onClick={() => setOpen(!open)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--border))] md:hidden">{open ? <X size={19} /> : <MenuIcon size={19} />}</button>
        </div>
      </div>
      {open && <nav className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4 md:hidden">
        <div className="container-shell flex flex-col gap-1">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              data-testid={`link-mobile-${href.slice(1)}`}
              className={`rounded-xl px-4 py-3 font-semibold transition-colors ${location === href ? 'bg-[hsl(var(--primary)/.08)] text-[hsl(var(--accent))] font-bold' : 'hover:bg-[hsl(var(--muted))]'}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/menu"
            onClick={() => setOpen(false)}
            className="btn-primary mt-2 text-center"
          >
            <Utensils size={16} /> Order food
          </Link>
        </div>
      </nav>}
    </header>
  );
}

function Footer() {
  return <footer className="mt-20 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
    <div className="container-shell grid gap-12 py-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
      <div><img src={logoPath} alt="De•Bite" className="mb-5 h-16 w-16 object-contain" /><p className="display max-w-sm text-3xl">Good food. No fuss.<br /><span className="text-[hsl(var(--secondary))]">Made with care.</span></p><p className="mt-5 max-w-xs text-sm leading-6 text-[hsl(var(--primary-foreground)/.66)]">A Lagos kitchen serving fresh, bold food with restaurant-level care.</p></div>
      <div><p className="eyebrow !text-[hsl(var(--secondary))]">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-[hsl(var(--primary-foreground)/.75)]"><Link href="/menu" data-testid="link-footer-menu" className="hover:text-[hsl(var(--secondary))]">Menu</Link><Link href="/about" data-testid="link-footer-about" className="hover:text-[hsl(var(--secondary))]">Our story</Link><Link href="/faq" data-testid="link-footer-faq" className="hover:text-[hsl(var(--secondary))]">FAQs</Link><Link href="/track" data-testid="link-footer-track" className="hover:text-[hsl(var(--secondary))]">Track order</Link></div></div>
      <div><p className="eyebrow !text-[hsl(var(--secondary))]">Find us</p><div className="mt-4 space-y-3 text-sm text-[hsl(var(--primary-foreground)/.75)]"><p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-[hsl(var(--secondary))]" /> Lagos, Nigeria</p><p className="flex gap-2"><Clock3 size={16} className="mt-0.5 shrink-0 text-[hsl(var(--secondary))]" /> Mon–Sat · 10:00–21:00<br />Sun · 12:00–20:00</p><a href="tel:08124379140" data-testid="link-footer-phone" className="flex gap-2 hover:text-[hsl(var(--secondary))]"><Phone size={16} className="text-[hsl(var(--secondary))]" /> 0812 437 9140</a></div></div>
    </div>
    <div className="container-shell flex flex-col justify-between gap-3 border-t border-[hsl(var(--primary-foreground)/.13)] py-5 text-xs text-[hsl(var(--primary-foreground)/.48)] sm:flex-row"><span>© 2024 De•Bite Kitchen. Made in Lagos.</span><div className="flex gap-5"><Link href="/privacy" data-testid="link-footer-privacy">Privacy</Link><Link href="/terms" data-testid="link-footer-terms">Terms</Link><a href="https://instagram.com" data-testid="link-instagram" className="flex items-center gap-1"><Instagram size={14} /> Instagram</a></div></div>
  </footer>;
}

function WhatsAppFloat() {
  return <a href="https://wa.me/2348124379140" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp" title="Chat with us" data-testid="link-floating-whatsapp" className="whatsapp-float">
    <MessageCircle size={24} strokeWidth={2.2} />
  </a>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="noise min-h-[100dvh]"><Header />{children}<Footer /><WhatsAppFloat /></div>;
}
function SectionTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="section-title mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow mb-3">{eyebrow}</p><h2 className="display text-4xl leading-[.98] sm:text-5xl">{title}</h2>{copy && <p className="mt-4 max-w-xl text-[hsl(var(--muted-foreground))]">{copy}</p>}</div>{action}</div>;
}
function PageIntro({ eyebrow, title, copy }: { eyebrow: string; title: ReactNode; copy: string }) {
  return <section className="page-intro container-shell pt-14 sm:pt-20"><p className="eyebrow mb-4">{eyebrow}</p><h1 className="display max-w-3xl text-5xl leading-[.95] sm:text-7xl">{title}</h1><p className="mt-5 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{copy}</p></section>;
}
function LoadingBlocks() { return <div className="stagger-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="skeleton aspect-[1.35] w-full" /><div className="space-y-3 p-5"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-4 w-full rounded" /><div className="skeleton h-10 w-1/3 rounded-full" /></div></div>)}</div>; }
function EmptyMessage({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <div className="empty-state rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] px-6 py-14 text-center"><Soup className="mx-auto mb-4 text-[hsl(var(--secondary))]" size={30} /><h3 className="display text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p>{action && <div className="mt-5">{action}</div>}</div>; }

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85',
    alt: 'De•Bite chargrilled steak and savory suya platter',
    title: 'Smoky Suya & Flame Grills',
  },
  {
    url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1600&q=85',
    alt: 'De•Bite aromatic jollof and savoury rice bowls',
    title: 'Rich Jollof & Savoury Rice Bowls',
  },
  {
    url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1600&q=85',
    alt: 'De•Bite wok-tossed vegetable fried rice with fresh ingredients',
    title: 'Wok-Tossed Fried Rice Specials',
  },
  {
    url: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1600&q=85',
    alt: 'De•Bite golden crispy samosa platter and herb dips',
    title: 'Crispy Starters & Savoury Pastries',
  },
];

function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.url;
    });
  }, []);

  useEffect(() => {
    // Autoplay pauses for reduced-motion users (CSS already disables the fade) and
    // whenever the tab is hidden, then resumes on return.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let interval: ReturnType<typeof setInterval> | null = null;
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const start = () => {
      if (interval || prefersReducedMotion.matches || document.hidden) return;
      interval = setInterval(() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length), 3000);
    };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
      {/* Rotating background image slideshow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <img
            key={slide.url}
            src={slide.url}
            alt={slide.alt}
            className={`hero-bg-slide ${index === activeSlide ? 'hero-slide-active' : 'hero-slide-inactive'}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding={index === 0 ? 'sync' : 'async'}
            fetchPriority={index === 0 ? 'high' : 'low'}
          />
        ))}
      </div>

      {/* Dark gradient & atmospheric vignettes for pristine text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/.96)] via-[hsl(var(--primary)/.86)] to-[hsl(var(--primary)/.68)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))] via-transparent to-[hsl(var(--primary)/.6)] pointer-events-none" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[hsl(var(--secondary)/.2)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[hsl(var(--accent)/.22)] blur-3xl pointer-events-none" />

      {/* Main hero content container - exactly preserving all existing elements */}
      <div className="container-shell relative z-10 grid min-h-[590px] items-center gap-10 py-16 md:grid-cols-[1fr_.78fr] md:py-20">
        <div className="relative z-10 animate-rise">
          <p className="eyebrow !text-[hsl(var(--secondary))]">Lagos, from our kitchen to yours</p>
          <h1 className="display mt-5 max-w-2xl text-6xl leading-[.91] sm:text-8xl">
            The good stuff<br />
            <span className="text-[hsl(var(--secondary))]">is here.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[hsl(var(--primary-foreground)/.78)]">
            Fresh, bold food made with care — prepared to order and delivered when you want it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" data-testid="link-hero-order" className="btn-primary">
              <Utensils size={17} /> See the menu <ArrowRight size={16} />
            </Link>
            <Link href="/about" data-testid="link-hero-story" className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary-foreground)/.3)] px-5 py-3 font-semibold transition-colors hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]">
              Why De•Bite?
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-6 text-xs text-[hsl(var(--primary-foreground)/.72)]">
            <span className="flex items-center gap-2">
              <Zap size={15} className="text-[hsl(var(--secondary))]" /> Fast, reliable delivery
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <ShieldCheck size={15} className="text-[hsl(var(--secondary))]" /> Payment on WhatsApp
            </span>
            {/* Live slideshow indicator pill */}
            <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/.65)] px-3 py-1.5 backdrop-blur-md border border-[hsl(var(--primary-foreground)/.15)] text-[11px]">
              <span className="mono font-bold text-[hsl(var(--secondary))]">0{activeSlide + 1} / 0{HERO_SLIDES.length}</span>
              <span className="text-[hsl(var(--primary-foreground)/.35)]">|</span>
              <span className="text-[hsl(var(--primary-foreground)/.85)] hidden sm:inline">{HERO_SLIDES[activeSlide].title}</span>
              <div className="flex gap-1.5 ml-1">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-4 bg-[hsl(var(--secondary))]' : 'w-1.5 bg-[hsl(var(--primary-foreground)/.35)]'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-art relative mx-auto flex max-w-[420px] items-center justify-center">
          <div className="hero-ring absolute h-[310px] w-[310px] rounded-full border border-[hsl(var(--secondary)/.4)] sm:h-[390px] sm:w-[390px]" />
          <div className="hero-ring absolute h-[250px] w-[250px] rounded-full border border-dashed border-[hsl(var(--secondary)/.25)] [animation-direction:reverse] sm:h-[320px] sm:w-[320px]" />
          <img src={logoPath} alt="De•Bite kitchen logo" className="hero-logo relative z-10 w-[72%] drop-shadow-2xl sm:w-[82%]" />
        </div>
      </div>

      <div className="container-shell relative z-10 border-t border-[hsl(var(--primary-foreground)/.13)] py-4">
        <div className="flex items-center justify-between text-xs text-[hsl(var(--primary-foreground)/.6)]">
          <span>Fresh. Bold. Delivered.</span>
          <span className="hidden sm:block">Made with Care. Served with Pride.</span>
          <span className="mono">EST. LAGOS / 2024</span>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const menu = useListMenu({ query: { queryKey: getListMenuQueryKey() } });
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Starters', 'Rice & Bowls', 'Grills', 'Sides', 'Drinks'];

  const items = menu.data ?? [];
  const filtered = items.filter((item) => {
    if (!item.available) return false;
    if (activeCategory === 'All') return item.featured;
    return item.category === activeCategory;
  });
  const displayItems = filtered.length > 0 ? filtered.slice(0, 4) : items.filter((item) => item.available).slice(0, 4);

  return (
    <Shell>
      <main>
        {/* Upgraded Hero with 4-image rotating background slideshow */}
        <HeroSection />

        {/* Section 1: Browse by Category */}
        <section className="container-shell pt-16 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <p className="eyebrow mb-2">Explore the flavours</p>
              <h2 className="display text-3xl sm:text-4xl">Browse by category</h2>
            </div>
            <Link href="/menu" className="text-sm font-bold text-[hsl(var(--accent))] hover:underline flex items-center gap-1">
              View complete menu <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat === 'Grills' ? <Flame size={14} className="text-[hsl(var(--secondary))]" /> : cat === 'Starters' ? <Soup size={14} className="text-[hsl(var(--secondary))]" /> : <Utensils size={14} className="text-[hsl(var(--secondary))]" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Featured Dishes */}
        <section className="container-shell pb-20 pt-4">
          <SectionTitle
            eyebrow="A little taste of everything"
            title="Made for the craving."
            copy="From bright plates to smoky grills and the dishes that need no introduction."
            action={<Link href="/menu" data-testid="link-featured-menu" className="font-semibold text-[hsl(var(--accent))]">Browse full menu <ArrowRight className="ml-1 inline" size={16} /></Link>}
          />
          {menu.isLoading ? (
            <LoadingBlocks />
          ) : displayItems.length ? (
            <div className="stagger-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayItems.map((item) => (
                <MenuCard key={item.id} item={item} compact />
              ))}
            </div>
          ) : (
            <EmptyMessage
              title="The kitchen is warming up."
              copy={menu.isError ? 'Our menu is taking a moment to connect. Try again soon or reach us on WhatsApp.' : 'Featured dishes will appear here when the kitchen has its first service.'}
              action={menu.isError ? <button type="button" data-testid="button-retry-home-menu" onClick={() => menu.refetch()} className="btn-ink"><RefreshCw size={15} /> Try again</button> : undefined}
            />
          )}
        </section>

        {/* Section 3: How De•Bite Works (4-Step Simple Flow) */}
        <section className="container-shell py-20 border-t border-[hsl(var(--border)/.7)]">
          <SectionTitle
            eyebrow="Smooth ordering"
            title="How it works."
            copy="From your screen to your table in four seamless steps."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="step-card">
              <span className="mono text-xs font-bold text-[hsl(var(--accent))] rounded-full bg-[hsl(var(--accent)/.12)] px-2.5 py-1">Step 01</span>
              <h3 className="display mt-4 text-2xl">Pick your meal</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Explore our curated Lagos menu of flame grills, bowls, and starters with custom portions.
              </p>
            </div>
            <div className="step-card">
              <span className="mono text-xs font-bold text-[hsl(var(--accent))] rounded-full bg-[hsl(var(--accent)/.12)] px-2.5 py-1">Step 02</span>
              <h3 className="display mt-4 text-2xl">Place your order</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Your selections and delivery address are formatted directly into WhatsApp with one click.
              </p>
            </div>
            <div className="step-card">
              <span className="mono text-xs font-bold text-[hsl(var(--accent))] rounded-full bg-[hsl(var(--accent)/.12)] px-2.5 py-1">Step 03</span>
              <h3 className="display mt-4 text-2xl">Cooked fresh</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Prepared to order and sealed in thermal packaging so everything arrives piping hot.
              </p>
            </div>
            <div className="step-card">
              <span className="mono text-xs font-bold text-[hsl(var(--accent))] rounded-full bg-[hsl(var(--accent)/.12)] px-2.5 py-1">Step 04</span>
              <h3 className="display mt-4 text-2xl">Enjoy your food</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Speedy delivery across Lagos or pickup at our Lekki kitchen. Follow live with your Order ID.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Why Choose De•Bite? (The De•Bite Standard) */}
        <section className="bg-[hsl(var(--muted)/.55)] py-20 border-y border-[hsl(var(--border)/.7)]">
          <div className="container-shell grid gap-12 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div>
              <p className="eyebrow mb-3">Why choose De•Bite?</p>
              <h2 className="display text-4xl sm:text-6xl">Comfort,<br /><span className="text-[hsl(var(--accent))]">considered.</span></h2>
              <p className="mt-5 text-sm sm:text-base leading-7 text-[hsl(var(--muted-foreground))]">
                We believe food delivery shouldn't feel like a gamble. We obsess over the details from kitchen prep to doorstep handoff.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Value icon={<HeartHandshake />} title="Made with care" copy="Every dish is prepared, finished and packed by people who care about the details." />
              <Value icon={<PackageCheck />} title="Packed with pride" copy="Thermal-sealed packaging that keeps food fresh, hot, and spill-free. No sad takeaway boxes." />
              <Value icon={<Truck />} title="Delivered reliably" copy="Flat ₦1,000 delivery, free over ₦15,000. Real-time tracking from kitchen to your door." />
              <Value icon={<Star />} title="Always worth it" copy="Fresh ingredients, generous portions and zero shortcuts where flavour is concerned." />
            </div>
          </div>
        </section>

        {/* Section 5: Customer Reviews / Testimonials */}
        <section className="container-shell py-20">
          <SectionTitle
            eyebrow="Loved in Lagos"
            title="What our customers say."
            copy="Real feedback from neighbours who enjoy honest, flavourful food done right."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="testimonial-card">
              <div className="flex items-center gap-1 text-[hsl(var(--secondary))] mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-sm leading-7 text-[hsl(var(--foreground)/.85)] italic">
                “The chargrilled steak and jollof rice arrived steaming hot in Lekki Phase 1. Cleanest packaging I’ve seen in Lagos — no leaks and incredible flavour.”
              </p>
              <div className="mt-5 pt-4 border-t border-[hsl(var(--border)/.6)] flex items-center justify-between">
                <span className="font-bold text-sm">Chioma A.</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Lekki Phase 1</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="flex items-center gap-1 text-[hsl(var(--secondary))] mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-sm leading-7 text-[hsl(var(--foreground)/.85)] italic">
                “Ordering through WhatsApp took literally 30 seconds. The food was delivered to Victoria Island within 45 minutes and the suya spice was on point.”
              </p>
              <div className="mt-5 pt-4 border-t border-[hsl(var(--border)/.6)] flex items-center justify-between">
                <span className="font-bold text-sm">Babatunde O.</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Victoria Island</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="flex items-center gap-1 text-[hsl(var(--secondary))] mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-sm leading-7 text-[hsl(var(--foreground)/.85)] italic">
                “Generous portions, tender meat and zero shortcuts. The crispy samosas and fried rice are our team's go-to for Friday office lunch.”
              </p>
              <div className="mt-5 pt-4 border-t border-[hsl(var(--border)/.6)] flex items-center justify-between">
                <span className="font-bold text-sm">Stephanie E.</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Ikoyi</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Catering & Group Orders Promotional Banner */}
        <section className="container-shell pb-20">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/.92)] p-8 sm:p-14 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[hsl(var(--secondary)/.18)] blur-3xl pointer-events-none" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="eyebrow !text-[hsl(var(--secondary))]">Office catering & weekend feasts</p>
                <h2 className="display mt-3 text-4xl sm:text-5xl max-w-2xl leading-[.95]">
                  Feeding a team or hosting friends?<br />
                  <span className="text-[hsl(var(--secondary))]">We make group dining effortless.</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm sm:text-base leading-7 text-[hsl(var(--primary-foreground)/.75)]">
                  Order custom platters, family trays, and corporate lunches ahead of time with priority kitchen scheduling and dedicated WhatsApp support.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/2348124379140?text=Hello%20De•Bite%20👋%20I%20would%20like%20to%20inquire%20about%20a%20group%20or%20catering%20order."
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <MessageCircle size={17} /> Inquire for catering
                </a>
                <Link href="/menu" className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--primary-foreground)/.3)] px-6 py-3 font-semibold transition-colors hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]">
                  Explore menu <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Preserved dinner plans CTA */}
        <section className="container-shell pb-20">
          <div className="rounded-[2rem] bg-[hsl(var(--accent))] px-6 py-12 text-[hsl(var(--primary-foreground))] sm:px-12">
            <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="eyebrow !text-[hsl(var(--primary))]">Dinner plans, sorted</p>
                <h2 className="display mt-3 max-w-2xl text-5xl leading-[.95] sm:text-6xl">Come hungry.<br />Leave it to us.</h2>
              </div>
              <Link href="/menu" data-testid="link-cta-order" className="btn-ink bg-[hsl(var(--primary))]">
                <ShoppingBag size={17} /> Start an order <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}

function Value({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="value-card border-t border-[hsl(var(--border))] pt-4"><div className="mb-4 text-[hsl(var(--accent))]">{icon}</div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div>;
}

function MenuCard({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  const { addToCart } = useCart();
  const [customizing, setCustomizing] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [justAdded, setJustAdded] = useState(false);

  const adjustment = Object.entries(selected).reduce((sum, [label, value]) => sum + (item.options.find((option) => option.label === label)?.prices[value] ?? 0), 0);
  const add = () => {
    addToCart(item, selected, item.price + adjustment);
    setCustomizing(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return <article data-testid={`card-menu-item-${item.id}`} className="menu-card group overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-sm)] hover:-translate-y-1">
     <div className={`relative overflow-hidden bg-[hsl(var(--muted))] ${compact ? 'aspect-[1.15]' : 'aspect-[1.35]'}`}>
       {item.image ? (
         <img src={item.image} alt={item.name} className="menu-image h-full w-full object-cover" />
       ) : (
         <div className="flex h-full items-center justify-center"><Soup size={42} className="text-[hsl(var(--secondary))]" /></div>
       )}
       <span className="absolute left-3 top-3 rounded-full bg-[hsl(var(--background)/.9)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
       {!item.available && <span className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--primary)/.7)] font-bold text-white">Sold out for now</span>}
     </div>
     <div className="p-4 sm:p-5">
       <div className="flex items-start justify-between gap-3">
         <div>
           <h3 className="font-bold">{item.name}</h3>
           <p className="mt-1 line-clamp-2 text-sm leading-5 text-[hsl(var(--muted-foreground))]">{item.description}</p>
         </div>
         <span data-testid={`text-price-${item.id}`} className="mono shrink-0 text-sm font-bold">{naira(item.price + adjustment)}</span>
       </div>
       {customizing && item.options.length > 0 && (
         <div className="customize-panel mt-4 space-y-3 rounded-xl bg-[hsl(var(--muted)/.65)] p-3">
           {item.options.map((option) => (
             <label key={option.label} className="block text-xs font-bold">{option.label}
               <select data-testid={`select-option-${item.id}-${option.label}`} value={selected[option.label] ?? ''} onChange={(e) => setSelected((old) => ({ ...old, [option.label]: e.target.value }))} className="input-field mt-1 !rounded-lg !py-2 text-xs">
                 <option value="">Choose one</option>
                 {option.values.map((value) => (
                   <option key={value} value={value}>{value}{option.prices[value] ? ` (+${naira(option.prices[value])})` : ''}</option>
                 ))}
               </select>
             </label>
           ))}
         </div>
       )}
       <button
         type="button"
         data-testid={`button-add-${item.id}`}
         disabled={!item.available}
         onClick={() => item.options.length > 0 && !customizing ? setCustomizing(true) : add()}
         className={`menu-add-button group/add mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${justAdded ? 'bg-emerald-600 text-white' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))]'}`}
       >
         {justAdded ? (
           <><Check size={16} /> Added to order!</>
         ) : customizing ? (
           <><Plus size={16} /> Add with choices</>
         ) : (
           <><Plus size={16} /> {item.options.length ? 'Customise & add' : 'Add to order'}</>
         )}
       </button>
     </div>
  </article>;
}

 function MenuPage() {
  const menu = useListMenu({ query: { queryKey: getListMenuQueryKey() } });
  const [active, setActive] = useState('All');
  const [search, setSearch] = useState('');
    const categories = ['All', 'Starters', 'Rice & Bowls', 'Grills', 'Sides', 'Drinks'];
  const items = (menu.data ?? []).filter((item) => (active === 'All' || item.category === active) && item.name.toLowerCase().includes(search.toLowerCase()));
    return <Shell><main><PageIntro eyebrow="The menu" title={<>Proper food.<br /><span className="text-[hsl(var(--accent))]">No shortcuts.</span></>} copy="A generous, flavour-first menu of well-loved favourites and De•Bite signatures. Pick a category, then make it yours." /><section className="container-shell pb-20 pt-12"><div className="sticky top-[76px] z-20 -mx-2 mb-8 flex flex-col gap-4 rounded-2xl bg-[hsl(var(--background)/.94)] p-2 backdrop-blur-xl lg:static lg:flex-row lg:items-center lg:justify-between lg:bg-transparent lg:p-0"><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((cat) => <button type="button" key={cat} data-testid={`button-category-${cat.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setActive(cat)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${active === cat ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--accent))]'}`}>{cat}</button>)}</div><label className="relative block w-full lg:max-w-xs"><Search size={17} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" /><input data-testid="input-menu-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the menu" className="input-field pl-10" /></label></div>{menu.isLoading ? <LoadingBlocks /> : menu.isError ? <EmptyMessage title="The menu took a wrong turn." copy="We could not load the kitchen menu. Check your connection and try again." action={<button type="button" data-testid="button-retry-menu" onClick={() => menu.refetch()} className="btn-ink"><RefreshCw size={15} /> Try again</button>} /> : items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <MenuCard key={item.id} item={item} />)}</div> : <EmptyMessage title="Nothing here yet." copy="Try another category or search term. Our kitchen is adding more good things soon." action={<button type="button" data-testid="button-clear-menu-filter" onClick={() => { setActive('All'); setSearch(''); }} className="btn-primary">Show everything</button>} />}</section></main><CartDock /></Shell>;
}

function CartDock() {
  const { count, total } = useCart();
  if (!count) return null;
  return <Link href="/checkout" data-testid="link-menu-cart-dock" className="cart-dock"><span className="flex min-w-0 items-center gap-2"><ShoppingBag size={18} /><span><strong>{count} {count === 1 ? 'item' : 'items'}</strong><span className="ml-2 hidden text-xs opacity-70 sm:inline">in your order</span></span></span><span className="mono">{naira(total)} <ArrowRight className="ml-1 inline" size={15} /></span></Link>;
}

function CheckoutPage() {
  const { cart, total, count, setQuantity, removeFromCart, clearCart } = useCart();
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const createOrder = useCreateOrder();
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const deliveryFee = orderType === 'pickup' || total >= 15000 ? 0 : 1000;
  const orderTotal = total + deliveryFee;
  const update = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const submit = () => {
    if (!form.name.trim() || form.phone.trim().length < 7 || !cart.length || (orderType === 'delivery' && !form.address.trim())) return;
    const data: OrderInput = { customerName: form.name.trim(), phone: form.phone.trim(), orderType, address: orderType === 'delivery' ? form.address.trim() : null, lines: cart.map((line) => ({ itemId: line.item.id, name: line.item.name, quantity: line.quantity, unitPrice: line.unitPrice, customizations: line.customizations })), subtotal: total, deliveryFee, total: orderTotal };
    createOrder.mutate({ data }, { onSuccess: (order) => {
      setSentOrder(order);
      clearCart();
      const detailLines = cart.map((line) => {
        const choices = Object.values(line.customizations).join(', ');
        return `• ${line.item.name}${choices ? ` (${choices})` : ''} x${line.quantity} — ${naira(line.unitPrice * line.quantity)}`;
      });
      const adminUrl = new URL('/admin', window.location.origin).href;
      const trackUrl = new URL('/track', window.location.origin).href;
      const text = [
        'Hello De•Bite 👋',
        '',
        'I would like to place an order:',
        '',
        `*Order ID:* ${order.id}`,
        '',
        '*Order Details:*',
        ...detailLines,
        '',
        `*Subtotal:* ${naira(order.subtotal)}`,
        `*Delivery Fee:* ${order.deliveryFee ? naira(order.deliveryFee) : 'Free'}`,
        `*Total:* ${naira(order.total)}`,
        '',
        '*Customer Details:*',
        `Name: ${order.customerName}`,
        `Phone: ${order.phone}`,
        `Order Type: ${order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}`,
        ...(order.address ? [`Address: ${order.address}`] : []),
        '',
        `*Admin dashboard:* ${adminUrl}`,
        `Use Order ID ${order.id} and the customer’s phone number to track this order: ${trackUrl}`,
        '',
        'Please confirm my order and send your account details for payment. Thank you!',
      ].join('\n');
      window.open(`https://wa.me/2348124379140?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }});
  };
  if (sentOrder) return <Shell><main className="container-shell py-20"><div className="mx-auto max-w-xl rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[var(--shadow-md)] sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--secondary)/.22)] text-[hsl(var(--primary))]"><BadgeCheck size={32} /></div><p className="eyebrow mt-7">Order received</p><h1 className="display mt-3 text-5xl">You’re almost there.</h1><p className="mt-4 leading-7 text-[hsl(var(--muted-foreground))]">Your order <strong>{sentOrder.id}</strong> is saved. Complete the handoff in WhatsApp so we can confirm your kitchen time.</p><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Keep your order ID and phone number handy. You’ll use both on the Track order page to check your progress.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><a href={`https://wa.me/2348124379140?text=${encodeURIComponent(`Hello De•Bite 👋 Following up on order ${sentOrder.id}.`)}`} target="_blank" rel="noreferrer" data-testid="link-reopen-whatsapp" className="btn-primary"><MessageCircle size={17} /> Open WhatsApp</a><Link href="/track" data-testid="link-track-new-order" className="btn-ink">Track order</Link></div></div></main></Shell>;
  return <Shell><main className="container-shell pb-20 pt-14"><div className="mb-10"><p className="eyebrow mb-3">Almost home</p><h1 className="display text-5xl sm:text-7xl">Your order,<br /><span className="text-[hsl(var(--accent))]">your way.</span></h1></div>{!cart.length ? <EmptyMessage title="Your bag is waiting." copy="There is nothing here yet. Pick something delicious from the menu and come back." action={<Link href="/menu" data-testid="link-checkout-menu" className="btn-primary"><Utensils size={16} /> Browse the menu</Link>} /> : <div className="grid gap-8 lg:grid-cols-[1fr_390px]"><div className="space-y-6"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="display text-2xl">What’s in the bag</h2><span className="mono text-xs text-[hsl(var(--muted-foreground))]">{count} {count === 1 ? 'item' : 'items'}</span></div>{cart.map((line) => <div key={`${line.item.id}-${JSON.stringify(line.customizations)}`} className="flex gap-3 border-t border-[hsl(var(--border))] py-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[hsl(var(--muted))]">{line.item.image ? <img src={line.item.image} alt="" className="h-full w-full object-cover" /> : <Soup size={22} className="text-[hsl(var(--secondary))]" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{line.item.name}</h3>{Object.keys(line.customizations).length > 0 && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{Object.entries(line.customizations).map(([key, val]) => `${key}: ${val}`).join(' · ')}</p>}</div><span className="mono text-sm">{naira(line.unitPrice * line.quantity)}</span></div><div className="mt-3 flex items-center gap-2"><button type="button" data-testid={`button-decrease-${line.item.id}`} onClick={() => line.quantity === 1 ? removeFromCart(line.item.id, line.customizations) : setQuantity(line.item.id, line.quantity - 1, line.customizations)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--border))]"><Minus size={13} /></button><span className="mono w-5 text-center text-xs">{line.quantity}</span><button type="button" data-testid={`button-increase-${line.item.id}`} onClick={() => setQuantity(line.item.id, line.quantity + 1, line.customizations)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--border))]"><Plus size={13} /></button></div></div></div>)}</div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7"><h2 className="display mb-5 text-2xl">How should we bring it?</h2><div className="grid gap-3 sm:grid-cols-2">{(['delivery', 'pickup'] as const).map((type) => <button type="button" key={type} data-testid={`button-order-type-${type}`} onClick={() => setOrderType(type)} className={`rounded-xl border p-4 text-left transition-colors ${orderType === type ? 'border-[hsl(var(--secondary))] bg-[hsl(var(--secondary)/.1)]' : 'border-[hsl(var(--border))]'}`}><div className="mb-3 flex items-center gap-2 font-bold">{type === 'delivery' ? <Truck size={18} /> : <Store size={18} />}{type === 'delivery' ? 'Deliver to me' : 'I’ll pick it up'}</div><p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">{type === 'delivery' ? 'We deliver across selected areas in Lagos.' : 'Pick up at our Lekki Phase 1 kitchen.'}</p></button>)}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Your name<input data-testid="input-customer-name" value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field mt-2" placeholder="e.g. Tola Adeyemi" /></label><label className="text-sm font-semibold">Phone number<input data-testid="input-customer-phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field mt-2" placeholder="0812 437 9140" type="tel" /></label></div>{orderType === 'delivery' && <label className="mt-4 block text-sm font-semibold">Delivery address<textarea data-testid="input-delivery-address" value={form.address} onChange={(e) => update('address', e.target.value)} className="input-field mt-2 min-h-24 resize-y" placeholder="House number, street, estate and landmark" /></label>}</div></div>
   <aside className="h-fit rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] lg:sticky lg:top-28"><h2 className="display text-3xl">Order summary</h2><div className="mt-6 space-y-3 border-b border-[hsl(var(--primary-foreground)/.16)] pb-5 text-sm"><div className="flex justify-between"><span className="text-[hsl(var(--primary-foreground)/.65)]">Subtotal</span><span>{naira(total)}</span></div><div className="flex justify-between"><span className="text-[hsl(var(--primary-foreground)/.65)]">Delivery</span><span>{deliveryFee ? naira(deliveryFee) : 'Free'}</span></div>{total > 0 && total < 15000 && orderType === 'delivery' && <p className="text-xs text-[hsl(var(--secondary))]">Add {naira(15000 - total)} more for free delivery.</p>}</div><div className="flex justify-between py-5 text-lg font-bold"><span>Total</span><span className="mono text-[hsl(var(--secondary))]">{naira(orderTotal)}</span></div><button type="button" data-testid="button-place-order" onClick={submit} disabled={createOrder.isPending || !form.name || form.phone.length < 7 || (orderType === 'delivery' && !form.address)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--secondary))] py-3.5 font-bold text-[hsl(var(--secondary-foreground))] disabled:cursor-not-allowed disabled:opacity-40">{createOrder.isPending ? 'Saving your order…' : <><MessageCircle size={17} /> Order via WhatsApp</>}</button>{createOrder.isError && <p data-testid="status-checkout-error" className="mt-3 text-center text-xs text-red-200">We couldn’t save that order. Please try again.</p>}<p className="mt-4 text-center text-xs leading-5 text-[hsl(var(--primary-foreground)/.54)]">You’ll confirm the order and payment with our team in WhatsApp.</p></aside></div>}</main></Shell>;
}

function TrackPage() {
  const track = useTrackOrder();
  const cancelOrder = useCancelOrder();
  const { toast } = useToast();
  const [form, setForm] = useState({ id: '', phone: '' });
  const [order, setOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const submit = () => track.mutate({ data: { orderId: form.id, phone: form.phone } }, { onSuccess: setOrder });
  const cancelError = cancelOrder.error as (Error & { status?: number }) | null;
  const confirmCancel = () => {
    if (!order) return;
    cancelOrder.mutate(
      { data: { orderId: order.id, phone: order.phone } },
      {
        onSuccess: (updated) => {
          setOrder(updated);
          setCancelDialogOpen(false);
          toast({ title: 'Order cancelled', description: `Order ${updated.id} has been cancelled. The kitchen will not prepare it.` });
        },
        onError: () => setCancelDialogOpen(false),
      },
    );
  };
  return <Shell><main className="container-shell pb-20 pt-14"><div className="mx-auto max-w-3xl"><p className="eyebrow mb-3">Where’s my food?</p><h1 className="display text-5xl sm:text-7xl">Follow it<br /><span className="text-[hsl(var(--accent))]">all the way home.</span></h1><div className="mt-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-sm)] sm:p-7"><div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-sm font-semibold">Order ID<input data-testid="input-track-order-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="input-field mt-2" placeholder="e.g. DB-1048" /></label><label className="text-sm font-semibold">Phone number<input data-testid="input-track-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field mt-2" placeholder="0812 437 9140" /></label><button type="button" data-testid="button-track-order" onClick={submit} disabled={track.isPending || form.id.length < 4 || form.phone.length < 7} className="btn-primary h-[46px] disabled:opacity-40">{track.isPending ? 'Looking…' : <><Search size={16} /> Find order</>}</button></div>{track.isError && <p data-testid="status-track-error" className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--destructive))]"><X size={15} /> We couldn’t find an order with those details.</p>}</div>{order && cancelOrder.isError && <p data-testid="status-cancel-error" className="mt-6 flex items-start gap-2 rounded-xl border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.08)] px-4 py-3 text-sm leading-6 text-[hsl(var(--destructive))]" role="alert"><X size={15} className="mt-1 shrink-0" />{cancelError?.status === 409 ? 'The kitchen has already started on this order, so it can no longer be cancelled. Message us on WhatsApp if something changed.' : 'We couldn’t cancel that order. Check your connection and try again.'}</p>}{order && <OrderTimeline order={order} onCancel={() => setCancelDialogOpen(true)} cancelling={cancelOrder.isPending} />}{order && <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}><AlertDialogContent className="max-w-md rounded-[1.75rem] border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 text-left shadow-[var(--shadow-md)] sm:p-8"><AlertDialogHeader><AlertDialogTitle>Cancel order {order.id}?</AlertDialogTitle><AlertDialogDescription>This stops the kitchen from preparing your {order.orderType === 'delivery' ? 'delivery' : 'pickup'} order of {naira(order.total)}. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel data-testid="button-keep-order" disabled={cancelOrder.isPending}>Keep my order</AlertDialogCancel><AlertDialogAction data-testid="button-confirm-cancel-order" disabled={cancelOrder.isPending} onClick={(event) => { event.preventDefault(); confirmCancel(); }} className="bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive)/.9)]">{cancelOrder.isPending ? 'Cancelling…' : 'Yes, cancel order'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</div></main></Shell>;
}
function OrderTimeline({ order, onCancel, cancelling = false }: { order: Order; onCancel?: () => void; cancelling?: boolean }) {
  const current = statuses.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = !isCancelled && cancellableStatuses.includes(order.status) && Boolean(onCancel);
  return <div className={`mt-10 rounded-2xl border p-6 sm:p-9 ${isCancelled ? 'border-[hsl(var(--destructive)/.4)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--foreground))]' : 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`}>
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[hsl(var(--primary-foreground)/.14)] pb-6">
      <div>
        <p className="eyebrow !text-[hsl(var(--secondary))]">Order {order.id}</p>
        <h2 data-testid="text-tracked-status" className="display mt-2 text-3xl">{statusLabels[order.status]}</h2>
        <p className={`mt-1 text-sm ${isCancelled ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--primary-foreground)/.62)]'}`}>For {order.customerName} · {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
      </div>
      <span className="mono rounded-full bg-[hsl(var(--primary-foreground)/.1)] px-3 py-2 text-sm text-[hsl(var(--secondary))]">{naira(order.total)}</span>
    </div>
    {isCancelled && <div data-testid="panel-order-cancelled" className="mt-6 rounded-xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--background)/.7)] p-5 text-sm leading-6 text-[hsl(var(--foreground)/.85)]"><p className="font-bold text-[hsl(var(--destructive))]">This order has been cancelled.</p><p className="mt-1">The kitchen will not prepare it and no payment is due. If this was a mistake, place a fresh order whenever you’re ready.</p></div>}
    {!isCancelled && <div className="mt-8 space-y-5">{statuses.map((status, index) => <div key={status} className="flex gap-4"><div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${index <= current ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'border border-[hsl(var(--primary-foreground)/.25)] text-[hsl(var(--primary-foreground)/.35)]'}`}>{index <= current ? <BadgeCheck size={16} /> : <span className="text-xs">{index + 1}</span>}{index < statuses.length - 1 && <span className={`absolute left-1/2 top-8 h-5 w-px ${index < current ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--primary-foreground)/.18)]'}`} />}</div><div className={index <= current ? '' : 'opacity-40'}><p className="font-semibold">{statusLabels[status]}</p><p className="mt-0.5 text-xs text-[hsl(var(--primary-foreground)/.55)]">{index === current ? 'This is where your order is right now.' : index < current ? 'Done' : 'Up next'}</p></div></div>)}</div>}
    {canCancel && <div className="mt-8 flex flex-col gap-3 border-t border-[hsl(var(--primary-foreground)/.14)] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[hsl(var(--primary-foreground)/.6)]">Changed your mind? You can cancel as long as the kitchen hasn’t started preparing.</p><button type="button" data-testid="button-cancel-order" onClick={onCancel} disabled={cancelling} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[hsl(var(--destructive)/.6)] px-5 py-2.5 text-sm font-bold text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive))] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"><X size={15} /> {cancelling ? 'Cancelling…' : 'Cancel order'}</button></div>}
  </div>;
}

function AboutPage() { return <Shell><main><PageIntro eyebrow="Our story" title={<>Made with Care.<br /><span className="text-[hsl(var(--accent))]">Served with Pride.</span></>} copy="De•Bite was created for people who believe good food should feel effortless — fresh, considered, and full of flavour." /><section className="container-shell grid gap-12 py-16 md:grid-cols-[.8fr_1.2fr] md:py-24"><div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-[hsl(var(--primary))]"><img src={logoPath} alt="De•Bite logo" className="absolute -bottom-10 -right-10 w-[90%] opacity-90" /><span className="absolute left-7 top-7 max-w-[150px] font-mono text-xs uppercase leading-5 tracking-widest text-[hsl(var(--secondary))]">Good food, with a little more intention.</span></div><div className="self-center"><p className="eyebrow mb-4">Why we cook</p><h2 className="display text-4xl sm:text-5xl">Good food, done properly.</h2><div className="mt-6 space-y-5 text-base leading-8 text-[hsl(var(--muted-foreground))]"><p>We focus on a tight menu so every dish is done properly. No overcrowded menu, no shortcuts, no compromises. Just good food, carefully prepared, and delivered or ready for pickup when you want it.</p><p>Whether you’re in Lekki, Ajah, Victoria Island or Ikoyi, we’re here to make ordering something delicious simple, reliable, and worth looking forward to.</p></div><Link href="/menu" data-testid="link-about-menu" className="btn-ink mt-8">Taste the story <ArrowRight size={16} /></Link></div></section><section className="bg-[hsl(var(--muted)/.55)]"><div className="container-shell py-20"><SectionTitle eyebrow="What guides us" title="Warmth is a standard." /><div className="grid gap-10 md:grid-cols-3"><Value icon={<Soup />} title="Keep it real" copy="Honest flavours, proper ingredients and portions that respect your appetite." /><Value icon={<Sparkles />} title="Make it lovely" copy="A little extra care in the details turns a takeaway into a moment worth looking forward to." /><Value icon={<HeartHandshake />} title="Know your people" copy="We cook for Lagos: fast-moving, particular, generous and always ready for one more bite." /></div></div></section></main></Shell>; }

function ContactPage() { const [sent, setSent] = useState(false); return <Shell><main><PageIntro eyebrow="Say hello" title={<>We’re here<br /><span className="text-[hsl(var(--accent))]">for the hungry.</span></>} copy="Questions, catering ideas, a delivery note or just a very specific craving? Send us a message." /><section className="container-shell grid gap-10 py-14 md:grid-cols-[.75fr_1.25fr] md:py-20"><div className="space-y-7"><ContactLine icon={<Phone />} label="Call or WhatsApp" value="0812 437 9140" href="https://wa.me/2348124379140" /><ContactLine icon={<MapPin />} label="Service location" value="Lagos, Nigeria" /><ContactLine icon={<Clock3 />} label="Opening hours" value={<>Mon–Sat: 10:00 AM – 9:00 PM<br />Sun: 12:00 PM – 8:00 PM<br /><span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">Last order: 45 minutes before closing</span></>} /><ContactLine icon={<MessageCircle />} label="Email" value="raheemcoding101@gmail.com" href="mailto:raheemcoding101@gmail.com" /><div><p className="eyebrow mb-3">Launch service areas</p><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">Lekki Phase 1 & 2 · Ajah · Sangotedo · Chevron · Ikate · Agungi · Victoria Island · Ikoyi</p></div></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><p className="eyebrow mb-3">Drop a note</p><h2 className="display text-3xl">Tell us what’s on your mind.</h2>{sent ? <div className="mt-8 rounded-xl bg-[hsl(var(--secondary)/.14)] p-5"><BadgeCheck className="mb-3 text-[hsl(var(--primary))]" /><p className="font-bold">Message received.</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">We’ll get back to you during kitchen hours.</p></div> : <form className="mt-7 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}><label className="block text-sm font-semibold">Your name<input required data-testid="input-contact-name" className="input-field mt-2" placeholder="What should we call you?" /></label><label className="block text-sm font-semibold">Phone<input required data-testid="input-contact-reply" className="input-field mt-2" placeholder="0812 437 9140" /></label><label className="block text-sm font-semibold">Message<textarea required data-testid="input-contact-message" className="input-field mt-2 min-h-32 resize-y" placeholder="Tell us everything." /></label><button type="submit" data-testid="button-submit-contact" className="btn-primary w-full">Send message <ArrowRight size={16} /></button></form>}</div></section></main></Shell>; }
function ContactLine({ icon, label, value, href }: { icon: ReactNode; label: string; value: ReactNode; href?: string }) { return <div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary)/.22)] text-[hsl(var(--primary))]">{icon}</div><div><p className="eyebrow !text-[hsl(var(--muted-foreground))]">{label}</p>{href ? <a href={href} data-testid={`link-contact-${label}`} className="mt-1 block font-semibold hover:text-[hsl(var(--accent))]">{value}</a> : <p className="mt-1 font-semibold leading-6">{value}</p>}</div></div>; }

const faqs = [['How do I place an order?', 'Browse the menu, customize your dishes, add them to your order, then complete the customer details at checkout. We save the order and open WhatsApp with a pre-filled message for our team.'], ['What payment methods do you accept?', 'We confirm orders and share payment instructions in WhatsApp. No payment is collected directly on this website.'], ['How long does delivery take?', 'Most orders arrive within 45–75 minutes, depending on your area and the kitchen queue. We will keep you updated if anything changes.'], ['Which areas do you deliver to?', 'Launch delivery areas are Lekki Phase 1 & 2, Ajah, Sangotedo, Chevron, Ikate, Agungi, Victoria Island and Ikoyi.'], ['Can I customize my order?', 'Yes. Where a dish has options, you can choose them before adding to your order.'], ['How do I track my order?', 'After payment is confirmed, our team will send your tracking details. Use the order ID and phone number on the Track order page.'], ['What are your opening hours?', 'Monday–Saturday: 10:00 AM–9:00 PM. Sunday: 12:00 PM–8:00 PM. Last order is 45 minutes before closing.'], ['Can I cancel or change my order?', 'Yes — while your order is still waiting for the kitchen (status: Order received or Payment confirmed), you can cancel it yourself on the Track order page using your order ID and phone number. Once preparation has started, cancellation is no longer possible; message us on WhatsApp as soon as possible and we’ll see what we can do.']];
function FAQPage() { const [open, setOpen] = useState(0); return <Shell><main className="container-shell pb-20 pt-14"><div className="mb-14"><p className="eyebrow mb-3">Good to know</p><h1 className="display text-5xl sm:text-7xl">Questions,<br /><span className="text-[hsl(var(--accent))]">answered.</span></h1></div><div className="mx-auto max-w-3xl">{faqs.map(([q, a], i) => <div key={q} className="border-t border-[hsl(var(--border))]"><button type="button" data-testid={`button-faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 py-6 text-left font-bold"><span>{q}</span><ChevronDown size={19} className={`shrink-0 transition-transform ${open === i ? 'rotate-180 text-[hsl(var(--accent))]' : ''}`} /></button>{open === i && <p data-testid={`text-faq-answer-${i}`} className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{a}</p>}</div>)}</div></main></Shell>; }
function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) { const privacy = kind === 'privacy'; return <Shell><main className="container-shell pb-20 pt-14"><div className="mb-12"><p className="eyebrow mb-3">The fine print</p><h1 className="display text-5xl sm:text-7xl">{privacy ? 'Privacy,' : 'Terms,'}<br /><span className="text-[hsl(var(--accent))]">{privacy ? 'without the fog.' : 'kept human.'}</span></h1><p className="mt-5 text-sm text-[hsl(var(--muted-foreground))]">Last updated: 12 June 2024</p></div><article className="prose prose-stone max-w-3xl prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-7 prose-a:text-[hsl(var(--accent))]">{privacy ? <><h2>What we collect</h2><p>When you order from De•Bite, we collect the details needed to prepare and deliver your food: your name, phone number, delivery address and order information. We do not collect more than we need to serve you.</p><h2>How we use it</h2><p>We use your details to process orders, coordinate delivery, answer support questions and improve our kitchen operations. We may contact you about an active order through phone or WhatsApp.</p><h2>Keeping it safe</h2><p>We take reasonable steps to protect the information you share with us. Payment details are handled through the payment method or instructions provided during your order; De•Bite does not store card details.</p><h2>Your choices</h2><p>You can ask what personal information we hold about you or request that we correct or delete it, subject to records we need to keep for legal and operational reasons. Contact us at 0812 437 9140.</p></> : <><h2>Orders and payment</h2><p>An order is confirmed when our team has acknowledged it on WhatsApp. Prices, availability and delivery times can change; we will tell you before proceeding when something affects your order.</p><h2>Delivery and pickup</h2><p>Delivery is ₦1,000, free for orders over ₦15,000. Delivery estimates are not guarantees and can be affected by traffic, weather and kitchen volume. Pickup orders should be collected from our Lekki Phase 1 kitchen during opening hours.</p><h2>Cancellations</h2><p>While your order is still awaiting confirmation or preparation has not started, you can cancel it yourself on the Track order page using your order ID and phone number. Once food preparation has started, self-service cancellation is no longer available; contact us as soon as possible on WhatsApp — a change, cancellation or refund may not be possible.</p><h2>Food and allergies</h2><p>Please tell our team about allergies or dietary needs before we confirm your order. Our kitchen handles common allergens and cannot guarantee an allergen-free environment.</p></>}</article></main></Shell>; }

 function LegacyAdminPage() {
  const client = useQueryClient();
  const orders = useListOrders({ query: { queryKey: getListOrdersQueryKey() } });
  const menu = useListMenu({ query: { queryKey: getListMenuQueryKey() } });
  const payment = useUpdateOrderPayment();
  const status = useUpdateOrderStatus();
  const availability = useUpdateMenuAvailability();
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');
  const updateStatus = (id: string, next: KitchenOrderStatus) => status.mutate({ id, data: { status: next } }, { onSuccess: () => client.invalidateQueries({ queryKey: getListOrdersQueryKey() }) });
  const markPaid = (id: string) => payment.mutate({ id, data: { paymentConfirmed: true } }, { onSuccess: () => client.invalidateQueries({ queryKey: getListOrdersQueryKey() }) });
  const toggle = (item: MenuItem) => availability.mutate({ id: item.id, data: { available: !item.available } }, { onSuccess: () => client.invalidateQueries({ queryKey: getListMenuQueryKey() }) });
  const activeOrders = (orders.data ?? []).filter((order) => order.status !== 'completed' && order.status !== 'cancelled').length;
   return <div className="min-h-[100dvh] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><div className="container-shell"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--primary-foreground)/.13)] py-5"><Link href="/" data-testid="link-admin-home" className="flex items-center gap-3"><img src={logoPath} alt="De•Bite" className="h-11 w-11" /><div><p className="font-bold">De•Bite kitchen</p><p className="mono text-[10px] uppercase tracking-wider text-[hsl(var(--primary-foreground)/.5)]">Operations desk</p></div></Link><div className="flex items-center gap-3 text-xs text-[hsl(var(--primary-foreground)/.6)]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--secondary))]" /> Live view</span><Link href="/menu" data-testid="link-admin-customer-menu" className="rounded-full border border-[hsl(var(--primary-foreground)/.2)] px-3 py-2 hover:border-[hsl(var(--secondary))]">Customer menu</Link></div></header><main className="py-10"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow !text-[hsl(var(--secondary))]">Today at a glance</p><h1 className="display mt-2 text-5xl">Keep the kitchen moving.</h1></div><div className="flex gap-3"><div className="rounded-xl bg-[hsl(var(--primary-foreground)/.08)] px-4 py-3"><p className="mono text-2xl text-[hsl(var(--secondary))]">{activeOrders}</p><p className="text-xs text-[hsl(var(--primary-foreground)/.55)]">active orders</p></div><div className="rounded-xl bg-[hsl(var(--primary-foreground)/.08)] px-4 py-3"><p className="mono text-2xl text-[hsl(var(--secondary))]">{(menu.data ?? []).filter((i) => i.available).length}</p><p className="text-xs text-[hsl(var(--primary-foreground)/.55)]">items available</p></div></div></div><div className="mb-6 flex gap-2 border-b border-[hsl(var(--primary-foreground)/.13)]"><button type="button" data-testid="button-admin-orders-tab" onClick={() => setTab('orders')} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'orders' ? 'border-[hsl(var(--secondary))] text-[hsl(var(--secondary))]' : 'border-transparent text-[hsl(var(--primary-foreground)/.55)]'}`}>Incoming orders</button><button type="button" data-testid="button-admin-menu-tab" onClick={() => setTab('menu')} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'menu' ? 'border-[hsl(var(--secondary))] text-[hsl(var(--secondary))]' : 'border-transparent text-[hsl(var(--primary-foreground)/.55)]'}`}>Menu availability</button></div>{tab === 'orders' ? <AdminOrders orders={orders.data ?? []} loading={orders.isLoading} updateStatus={updateStatus} markPaid={markPaid} /> : <AdminMenu items={menu.data ?? []} loading={menu.isLoading} toggle={toggle} />}</main></div><WhatsAppFloat /></div>;
}
function AdminOrders({ orders, loading, updateStatus, markPaid }: { orders: Order[]; loading: boolean; updateStatus: (id: string, status: KitchenOrderStatus) => void; markPaid: (id: string) => void }) { if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl opacity-20" />)}</div>; if (!orders.length) return <div className="rounded-2xl border border-dashed border-[hsl(var(--primary-foreground)/.2)] p-12 text-center"><ShoppingBag className="mx-auto mb-3 text-[hsl(var(--secondary))]" /><p className="display text-2xl">No orders in the queue.</p><p className="mt-2 text-sm text-[hsl(var(--primary-foreground)/.5)]">New orders will appear here as they land.</p></div>; return <div className="grid gap-4 lg:grid-cols-2">{orders.map((order) => <div key={order.id} data-testid={`card-admin-order-${order.id}`} className={`rounded-2xl p-5 ${order.status === 'cancelled' ? 'border border-[hsl(var(--destructive)/.45)] bg-[hsl(var(--destructive)/.08)]' : 'bg-[hsl(var(--primary-foreground)/.08)]'}`}><div className="flex items-start justify-between gap-3"><div><p className="mono text-xs text-[hsl(var(--secondary))]">{order.id}</p><h2 className="mt-1 text-lg font-bold">{order.customerName}</h2><p className="text-xs text-[hsl(var(--primary-foreground)/.55)]">{order.orderType === 'delivery' ? order.address : 'Pickup at kitchen'} · {order.phone}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${order.status === 'cancelled' ? 'bg-[hsl(var(--destructive)/.35)] text-[hsl(var(--destructive-foreground))]' : 'bg-[hsl(var(--secondary)/.18)] text-[hsl(var(--secondary))]'}`}>{statusLabels[order.status]}</span></div><div className="my-4 border-y border-[hsl(var(--primary-foreground)/.12)] py-3 text-sm">{order.lines.map((line) => <div key={line.itemId} className="flex justify-between py-1"><span>{line.quantity} × {line.name}</span><span className="mono text-xs">{naira(line.unitPrice * line.quantity)}</span></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3"><span className="mono font-bold">{naira(order.total)} <span className="font-sans text-xs text-[hsl(var(--primary-foreground)/.48)]">{order.paymentConfirmed ? '· paid' : '· payment pending'}</span></span><div className="flex gap-2">{order.status === 'cancelled' ? <span className="text-xs font-semibold text-[hsl(var(--primary-foreground)/.55)]">Cancelled by customer</span> : <>{!order.paymentConfirmed && <button type="button" data-testid={`button-mark-paid-${order.id}`} onClick={() => markPaid(order.id)} className="rounded-full border border-[hsl(var(--secondary)/.5)] px-3 py-2 text-xs font-bold text-[hsl(var(--secondary))]">Mark paid</button>}{order.status !== 'completed' && <select data-testid={`select-status-${order.id}`} value={order.status} onChange={(e) => updateStatus(order.id, e.target.value as KitchenOrderStatus)} className="rounded-full border border-[hsl(var(--primary-foreground)/.2)] bg-[hsl(var(--primary))] px-3 py-2 text-xs text-[hsl(var(--primary-foreground))]"><option value={order.status}>{statusLabels[order.status]}</option>{statuses.filter((s) => s !== order.status).map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>}</>}</div></div></div>)}</div>; }
function AdminMenu({ items, loading, toggle }: { items: MenuItem[]; loading: boolean; toggle: (item: MenuItem) => void }) { if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl opacity-20" />)}</div>; return <div className="overflow-hidden rounded-2xl bg-[hsl(var(--primary-foreground)/.08)]">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[hsl(var(--primary-foreground)/.1)] p-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--primary-foreground)/.1)]">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Soup size={18} className="text-[hsl(var(--secondary))]" />}</div><div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="text-xs text-[hsl(var(--primary-foreground)/.5)]">{item.category} · {naira(item.price)}</p></div></div><button type="button" data-testid={`button-toggle-availability-${item.id}`} onClick={() => toggle(item)} className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${item.available ? 'bg-[hsl(var(--secondary)/.2)] text-[hsl(var(--secondary))]' : 'bg-[hsl(var(--primary-foreground)/.12)] text-[hsl(var(--primary-foreground)/.5)]'}`}>{item.available ? 'Available' : 'Sold out'}</button></div>)}</div>; }

const adminStatusLabels: Record<AdminOrderStatus, string> = {
  received: 'Received',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const adminStatuses: AdminOrderStatus[] = ['received', 'preparing', 'out_for_delivery', 'delivered'];

function AdminLoginScreen({ password, setPassword, onSubmit, pending, failed }: { password: string; setPassword: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean; failed: boolean }) {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--primary))] px-4 py-10 text-[hsl(var(--primary-foreground))]">
    <div className="w-full max-w-md rounded-[2rem] border border-[hsl(var(--primary-foreground)/.14)] bg-[hsl(var(--primary-foreground)/.08)] p-7 shadow-2xl sm:p-10">
      <Link href="/" data-testid="link-admin-login-home" className="flex items-center gap-3"><img src={logoPath} alt="De•Bite" className="h-12 w-12" /><span className="font-bold">De•Bite kitchen</span></Link>
      <p className="eyebrow mt-12 !text-[hsl(var(--secondary))]">Private operations</p>
      <h1 className="display mt-3 text-5xl">Welcome back.</h1>
      <p className="mt-4 text-sm leading-6 text-[hsl(var(--primary-foreground)/.62)]">Enter the kitchen password to view and manage live orders.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold">Admin password<input autoFocus required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="input-admin-password" className="input-field mt-2 !border-[hsl(var(--primary-foreground)/.2)] !bg-[hsl(var(--primary-foreground)/.08)] !text-[hsl(var(--primary-foreground))]" /></label>
        {failed && <p data-testid="status-admin-login-error" className="text-sm text-[hsl(var(--secondary))]">That password didn’t match. Try again.</p>}
        <button type="submit" data-testid="button-admin-login" disabled={pending || !password} className="btn-primary w-full disabled:opacity-50">{pending ? 'Checking…' : 'Unlock kitchen'}</button>
      </form>
    </div>
  </main>;
}

function AdminPage() {
  const client = useQueryClient();
  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey(), retry: false } });
  const login = useAdminLogin();
  const authenticated = session.isSuccess && session.data.authenticated;
  const orders = useListAdminOrders({ query: { enabled: authenticated, queryKey: getListAdminOrdersQueryKey(), refetchInterval: 30000, retry: false } });
  const status = useUpdateAdminOrderStatus();
  const [password, setPassword] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const submitLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ data: { password } }, {
      onSuccess: () => {
        setPassword('');
        void session.refetch();
      },
    });
  };
  const updateStatus = (orderId: string, nextStatus: KitchenAdminOrderStatus) => {
    status.mutate({ orderId, data: { status: nextStatus } }, {
      onSuccess: () => void client.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() }),
    });
  };
  const toggleExpanded = (orderId: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
    return next;
  });

  if (session.isLoading) return <main className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><p className="text-sm text-[hsl(var(--primary-foreground)/.65)]">Checking kitchen access…</p></main>;
  if (!authenticated) return <AdminLoginScreen password={password} setPassword={setPassword} onSubmit={submitLogin} pending={login.isPending} failed={login.isError} />;

  return <main className="min-h-[100dvh] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
    <div className="container-shell">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--primary-foreground)/.13)] py-5">
        <Link href="/" data-testid="link-admin-home" className="flex items-center gap-3"><img src={logoPath} alt="De•Bite" className="h-11 w-11" /><div><p className="font-bold">De•Bite kitchen</p><p className="mono text-[10px] uppercase tracking-wider text-[hsl(var(--primary-foreground)/.5)]">Operations desk</p></div></Link>
        <Link href="/menu" data-testid="link-admin-customer-menu" className="rounded-full border border-[hsl(var(--primary-foreground)/.2)] px-3 py-2 text-xs font-semibold hover:border-[hsl(var(--secondary))]">Customer menu</Link>
      </header>
      <section className="py-10">
         <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow !text-[hsl(var(--secondary))]">Kitchen operations</p><h1 className="display mt-2 text-5xl">Live orders.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--primary-foreground)/.6)]">Manage the full kitchen queue and keep customers moving from received to delivered.</p></div><div className="rounded-xl bg-[hsl(var(--primary-foreground)/.08)] px-4 py-3"><p className="mono text-2xl text-[hsl(var(--secondary))]">{orders.data?.length ?? 0}</p><p className="text-xs text-[hsl(var(--primary-foreground)/.55)]">orders</p></div></div>
        {orders.isLoading ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-44 rounded-2xl opacity-20" />)}</div> : orders.isError ? <div className="rounded-2xl border border-[hsl(var(--secondary)/.4)] bg-[hsl(var(--secondary)/.08)] p-6"><p className="font-bold">We couldn’t load the Supabase orders.</p><p className="mt-2 text-sm text-[hsl(var(--primary-foreground)/.6)]">Check the connection and refresh the page.</p><button type="button" onClick={() => void orders.refetch()} className="btn-primary mt-5">Try again</button></div> : !orders.data?.length ? <div className="rounded-2xl border border-dashed border-[hsl(var(--primary-foreground)/.2)] p-12 text-center"><ShoppingBag className="mx-auto mb-3 text-[hsl(var(--secondary))]" /><p className="display text-2xl">No orders yet.</p><p className="mt-2 text-sm text-[hsl(var(--primary-foreground)/.5)]">New Supabase orders will appear here.</p></div> : <div className="space-y-4">{orders.data.map((order) => <AdminSupabaseOrder key={order.orderId} order={order} expanded={expanded.has(order.orderId)} updating={status.isPending && status.variables?.orderId === order.orderId} onToggle={() => toggleExpanded(order.orderId)} onStatusChange={(next) => updateStatus(order.orderId, next)} />)}</div>}
      </section>
    </div>
  </main>;
}

function AdminSupabaseOrder({ order, expanded, updating, onToggle, onStatusChange }: { order: AdminOrder; expanded: boolean; updating: boolean; onToggle: () => void; onStatusChange: (status: KitchenAdminOrderStatus) => void }) {
  return <article data-testid={`card-supabase-order-${order.orderId}`} className="rounded-2xl bg-[hsl(var(--primary-foreground)/.08)] p-5 sm:p-6">
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminOrderField label="order_id" value={order.orderId} mono />
        <AdminOrderField label="customer_name" value={order.customerName} />
        <AdminOrderField label="phone" value={order.phone} />
        <AdminOrderField label="order_type" value={order.orderType} />
        <AdminOrderField label="total" value={naira(order.total)} mono />
        <div><p className="eyebrow text-[10px] !text-[hsl(var(--primary-foreground)/.45)]">status</p>{order.status === 'cancelled' ? <p data-testid={`text-supabase-order-cancelled-${order.orderId}`} className="mt-2 inline-flex w-full items-center rounded-full border border-[hsl(var(--destructive)/.5)] bg-[hsl(var(--destructive)/.15)] px-3 py-2 text-sm font-bold text-[hsl(var(--destructive-foreground))]">Cancelled by customer</p> : <select data-testid={`select-supabase-order-status-${order.orderId}`} value={order.status} disabled={updating} onChange={(event) => onStatusChange(event.target.value as KitchenAdminOrderStatus)} className="mt-2 w-full rounded-full border border-[hsl(var(--primary-foreground)/.2)] bg-[hsl(var(--primary))] px-3 py-2 text-sm text-[hsl(var(--primary-foreground))]"><option value="received">{adminStatusLabels.received}</option>{adminStatuses.filter((status) => status !== 'received' && status !== 'cancelled').map((status) => <option key={status} value={status}>{adminStatusLabels[status]}</option>)}</select>}</div>
      </div>
      <button type="button" data-testid={`button-expand-supabase-order-${order.orderId}`} aria-expanded={expanded} onClick={onToggle} className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--primary-foreground)/.2)] px-4 py-2 text-xs font-bold hover:border-[hsl(var(--secondary))]">{expanded ? 'Hide items' : `Show items (${order.items.length})`}<ChevronDown size={15} className={expanded ? 'rotate-180' : ''} /></button>
    </div>
    {expanded && <div data-testid={`panel-supabase-order-items-${order.orderId}`} className="mt-6 border-t border-[hsl(var(--primary-foreground)/.12)] pt-5"><p className="eyebrow !text-[hsl(var(--secondary))]">order_items</p>{order.items.length ? <div className="mt-3 space-y-3">{order.items.map((item, index) => <div key={`${item.itemName}-${index}`} className="flex flex-col gap-1 rounded-xl bg-[hsl(var(--primary-foreground)/.06)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span><strong>{item.quantity} × {item.itemName}</strong>{Object.keys(item.customizations).length > 0 && <span className="ml-2 text-xs text-[hsl(var(--primary-foreground)/.55)]">{Object.entries(item.customizations).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')}</span>}</span></div>)}</div> : <p className="mt-3 text-sm text-[hsl(var(--primary-foreground)/.55)]">No items recorded for this order.</p>}</div>}
  </article>;
}

function AdminOrderField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><p className="eyebrow text-[10px] !text-[hsl(var(--primary-foreground)/.45)]">{label}</p><p className={`mt-2 break-words text-sm font-semibold ${mono ? 'mono' : ''}`}>{value}</p></div>; }

function AppRouter() { return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route path="/menu" component={MenuPage} /><Route path="/checkout" component={CheckoutPage} /><Route path="/track" component={TrackPage} /><Route path="/about" component={AboutPage} /><Route path="/contact" component={ContactPage} /><Route path="/faq" component={FAQPage} /><Route path="/privacy"><LegalPage kind="privacy" /></Route><Route path="/terms"><LegalPage kind="terms" /></Route><Route path="/admin" component={AdminPage} /><Route><NotFound /></Route></Switch></ErrorBoundary>; }
function NotFound() { return <Shell><main className="container-shell py-24 text-center"><p className="eyebrow">Wrong turn</p><h1 className="display mt-3 text-6xl">That page is<br /><span className="text-[hsl(var(--accent))]">not on the menu.</span></h1><Link href="/" data-testid="link-not-found-home" className="btn-ink mt-8">Back home</Link></main></Shell>; }
function App() { const [cart, setCart] = useState<CartLine[]>([]); useEffect(() => { const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]'); if (favicon) favicon.href = logoPath; }, []); const value = useMemo<CartContextValue>(() => { const addToCart = (item: MenuItem, customizations: Record<string, string> = {}, unitPrice = item.price) => setCart((lines) => { const found = lines.find((line) => line.item.id === item.id && sameCustomizations(line.customizations, customizations)); return found ? lines.map((line) => line === found ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { item, quantity: 1, customizations, unitPrice }]; }); const setQuantity = (itemId: string, quantity: number, customizations: Record<string, string> = {}) => setCart((lines) => lines.map((line) => line.item.id === itemId && sameCustomizations(line.customizations, customizations) ? { ...line, quantity: Math.max(1, quantity) } : line)); const removeFromCart = (itemId: string, customizations: Record<string, string> = {}) => setCart((lines) => lines.filter((line) => !(line.item.id === itemId && sameCustomizations(line.customizations, customizations)))); return { cart, addToCart, setQuantity, removeFromCart, clearCart: () => setCart([]), total: cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), count: cart.reduce((sum, line) => sum + line.quantity, 0) }; }, [cart]); return <QueryClientProvider client={queryClient}><TooltipProvider><CartContext.Provider value={value}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppRouter /></WouterRouter></CartContext.Provider></TooltipProvider><Toaster /></QueryClientProvider>; }
export default App;
