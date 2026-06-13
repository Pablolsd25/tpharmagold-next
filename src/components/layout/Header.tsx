"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";
import { LEGAL } from "@/lib/site-legal";
import {
  TPHARMA_HEADER_NAV,
  TPHARMA_MENU_NAV,
  TPHARMA_MORE_NAV,
} from "@/lib/tpharma-home";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDropdown, setMenuDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toggleCart, itemCount } = useCartStore();
  const count = itemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data: { isAdmin?: boolean }) => setIsAdmin(!!data.isAdmin))
        .catch(() => setIsAdmin(false));
    }, 2500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-black border-b border-wix-gold/15">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 min-h-[88px] lg:min-h-[100px] py-3">
            {/* Logo + marca — como Wix */}
            <Link href="/" className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt={LEGAL.tradeName}
                width={72}
                height={72}
                className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-sm"
                priority
              />
              <div className="hidden sm:block leading-tight">
                <p className="font-display uppercase tracking-wide" style={{ fontSize: "clamp(1.1rem, 2vw, 1.6rem)" }}>
                  <span className="text-white font-semibold">T-PHARMA </span>
                  <span className="text-gold-metal font-light">GOLD</span>
                </p>
                <p className="text-[10px] sm:text-xs text-white/90 uppercase tracking-[0.12em] mt-0.5">
                  {LEGAL.tagline}
                </p>
              </div>
            </Link>

            {/* Nav Wix */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
              <div
                className="relative"
                onMouseEnter={() => setMenuDropdown(true)}
                onMouseLeave={() => setMenuDropdown(false)}
              >
                <button
                  type="button"
                  className="text-white text-xs font-display uppercase tracking-wide hover:text-wix-gold transition-colors"
                >
                  Menú
                </button>
                {menuDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 py-2 z-50 shadow-xl">
                    {TPHARMA_MENU_NAV.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs text-zinc-300 hover:text-wix-gold hover:bg-zinc-900 uppercase tracking-wide"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {TPHARMA_HEADER_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white text-xs font-display uppercase tracking-wide hover:text-wix-gold transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}

              <div
                className="relative"
                onMouseEnter={() => setMoreDropdown(true)}
                onMouseLeave={() => setMoreDropdown(false)}
              >
                <button
                  type="button"
                  className="text-white text-xs font-display uppercase tracking-wide hover:text-wix-gold transition-colors flex items-center gap-1"
                >
                  More
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {moreDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-zinc-950 border border-zinc-800 py-2 z-50 shadow-xl">
                    {TPHARMA_MORE_NAV.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-xs text-zinc-300 hover:text-wix-gold hover:bg-zinc-900 uppercase tracking-wide"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              {isAdmin && (
                <Link href="/admin" className="text-wix-gold text-[10px] font-display uppercase border border-wix-gold/40 px-2 py-0.5 hidden md:inline">
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={toggleCart}
                className="flex items-center gap-1.5 text-white hover:text-wix-gold transition-colors"
                aria-label="Carrito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-sm font-light">{mounted ? count : 0}</span>
              </button>

              <button
                className="lg:hidden text-white"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-4 max-h-[75vh] overflow-y-auto">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Menú</p>
            {TPHARMA_MENU_NAV.map((link) => (
              <Link key={link.href} href={link.href} className="block text-white text-sm py-2 border-b border-zinc-900" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-4 mb-2">Info</p>
            {[...TPHARMA_HEADER_NAV, ...TPHARMA_MORE_NAV].map((link) => (
              <Link key={link.href} href={link.href} className="block text-zinc-300 text-sm py-2 border-b border-zinc-900" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
