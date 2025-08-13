import { HeroConfig, Step, Feature, PricingTier, DashboardPreviewConfig, ScrollAnimationConfig } from './types';

export const heroConfig: HeroConfig = {
  title: {
    line1: "It's never been",
    line2: "easier to",
    highlightedWord: "track and improve"
  },
  buttons: {
    primary: {
      text: "Get Access (Beta)",
      href: "/auth/checkout"
    },
    secondary: {
      text: "Explore",
      action: "scroll",
      target: "how-it-works-section"
    }
  }
};

export const stepsConfig: Step[] = [
  {
    id: 0,
    title: "Connect your fitness trackers",
    image: {
      src: "/images/landing/fitness-tracker.png",
      alt: "Connect your fitness trackers"
    },
    animation: {
      delay: 200,
      threshold: 0.3
    }
  },
  {
    id: 1,
    title: "Upload any blood tests and health records",
    image: {
      src: "/images/landing/blood-upload.png",
      alt: "Upload blood tests and health records"
    },
    animation: {
      delay: 300,
      threshold: 0.3
    }
  },
  {
    id: 2,
    title: "Experiment with workouts & health protocols",
    image: {
      src: "/images/landing/experiment.png",
      alt: "Experiment with workouts & health protocols"
    },
    animation: {
      delay: 400,
      threshold: 0.3
    }
  },
  {
    id: 4,
    title: "Track the impact, optimise, repeat",
    image: {
      src: "/images/landing/progress.png",
      alt: "Track the impact, optimise, repeat"
    },
    animation: {
      delay: 500,
      threshold: 0.3
    }
  }
];

export const featuresConfig: Feature[] = [
  {
    id: "data-sync",
    title: "All Your Health Data, Automatically",
    description: "Upload blood test PDFs for automatic biomarker extraction and sync live fitness metrics from your tracker—everything centralized in one dashboard.",
    icon: {
      type: "checkmark"
    }
  },
  {
    id: "experiments",
    title: "Document Health Experiments",
    description: "Log and organize different experiments and health protocols you're trying, from workout routines to supplement stacks to lifestyle changes.",
    icon: {
      type: "checkmark"
    }
  },
  {
    id: "insights",
    title: "See What's Actually Working",
    description: "Visualize how your experiments affect your health metrics with beautiful charts that reveal correlations and prove what's driving real results. Share your dashboard publicly online to showcase your health journey.",
    icon: {
      type: "checkmark"
    }
  }
];

export const pricingConfig: PricingTier = {
  id: "beta",
  name: "revly",
  tagline: "It's time you own your health.",
  price: {
    amount: "$29.99",
    currency: "USD",
    billing: "One-time payment • Lifetime access"
  },
  cta: {
    text: "Get Beta Access",
    href: "/auth/checkout"
  },
  features: featuresConfig
};

export const dashboardPreviewConfig: DashboardPreviewConfig = {
  title: "Live Dashboard Preview",
  linkText: "See Full Demo Dashboard →",
  demoUrl: "/dashboard/userId=100492380040453908509",
  iframeId: "dashboard-iframe"
};

export const scrollAnimationConfig: ScrollAnimationConfig = {
  threshold: 0.3,
  rootMargin: '-10% 0px -10% 0px'
};

export const sectionIds = {
  hero: 'hero-section',
  dashboard: 'dashboard-section',
  howItWorks: 'how-it-works-section',
  pricing: 'pricing-section'
} as const;