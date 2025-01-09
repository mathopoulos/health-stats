'use client';

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignIn() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to upload and manage your health data</p>
          </div>
          
          <button
            onClick={() => signIn('google', { callbackUrl: '/upload' })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <Image
              src="/images/google.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
} 