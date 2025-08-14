// Landing page type definitions

export interface HeroConfig {
  title: {
    line1: string;
    line2: string;
    highlightedWord: string;
  };
  buttons: {
    primary: {
      text: string;
      href: string;
    };
    secondary: {
      text: string;
      action: 'scroll' | 'link';
      target?: string;
      href?: string;
    };
  };
}

export interface Step {
  id: number;
  title: string;
  image: {
    src: string;
    alt: string;
  };
  animation: {
    delay: number;
    threshold?: number;
  };
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: {
    type: 'checkmark' | 'custom';
    customPath?: string;
  };
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: {
    amount: string;
    currency: string;
    billing: string;
  };
  cta: {
    text: string;
    href: string;
  };
  features: Feature[];
}

export interface SectionConfig {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface DashboardPreviewConfig {
  title: string;
  linkText: string;
  demoUrl: string;
  iframeId: string;
}

export interface ScrollAnimationConfig {
  threshold: number;
  rootMargin: string;
}

// Animation state management
export interface AnimationState {
  visibleSections: Set<number>;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}