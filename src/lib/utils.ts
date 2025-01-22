import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { exec } from 'child_process';
import { promisify } from 'util';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const execAsync = promisify(exec); 