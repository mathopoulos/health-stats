import { HeroConfig } from '../types';

/**
 * Button action types and utilities for landing page interactions
 */

export type ButtonActionType = 'scroll' | 'link';

export interface ButtonActionConfig {
  action: ButtonActionType;
  target?: string;
  href?: string;
}

/**
 * Handles button action execution with proper validation
 * @param actionConfig - Configuration for the button action
 * @param scrollFunction - Optional scroll function to use (for testability)
 */
export function executeButtonAction(
  actionConfig: ButtonActionConfig,
  scrollFunction?: (target: string) => void
): void {
  switch (actionConfig.action) {
    case 'scroll':
      if (!actionConfig.target) {
        console.warn('Scroll action requires a target element ID');
        return;
      }
      
      if (scrollFunction) {
        scrollFunction(actionConfig.target);
      } else {
        // Default scroll behavior
        const element = document.getElementById(actionConfig.target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.warn(`Target element with ID "${actionConfig.target}" not found`);
        }
      }
      break;
      
    case 'link':
      if (!actionConfig.href) {
        console.warn('Link action requires an href');
        return;
      }
      
      // Use window.location for internal navigation or window.open for external
      if (actionConfig.href.startsWith('http') || actionConfig.href.startsWith('//')) {
        window.open(actionConfig.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = actionConfig.href;
      }
      break;
      
    default:
      console.warn(`Unknown button action: ${actionConfig.action}`);
  }
}

/**
 * Creates a button action handler function
 * @param actionConfig - Configuration for the button action
 * @param scrollFunction - Optional scroll function to use
 * @returns Handler function for button clicks
 */
export function createButtonActionHandler(
  actionConfig: ButtonActionConfig,
  scrollFunction?: (target: string) => void
) {
  return () => executeButtonAction(actionConfig, scrollFunction);
}

/**
 * Validates button action configuration
 * @param actionConfig - Configuration to validate
 * @returns Boolean indicating if configuration is valid
 */
export function isValidButtonAction(actionConfig: ButtonActionConfig): boolean {
  switch (actionConfig.action) {
    case 'scroll':
      return Boolean(actionConfig.target);
    case 'link':
      return Boolean(actionConfig.href);
    default:
      return false;
  }
}

/**
 * Extracts button action configuration from HeroConfig
 * @param config - Hero configuration
 * @returns Button action configurations for primary and secondary buttons
 */
export function extractButtonActions(config: HeroConfig) {
  return {
    primary: {
      action: 'link' as const,
      href: config.buttons.primary.href
    },
    secondary: {
      action: config.buttons.secondary.action,
      target: config.buttons.secondary.target,
      href: config.buttons.secondary.href
    }
  };
}
