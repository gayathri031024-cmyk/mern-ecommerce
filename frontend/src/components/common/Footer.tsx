import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface text-paper">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">Shopfront</p>
          <p className="mt-2 text-sm text-paper/60">
            Thoughtfully sourced goods, delivered with care.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Shop</p>
          <ul className="flex flex-col gap-2 text-paper/70">
            <li><Link to="/products">All products</Link></li>
            <li><Link to="/products?sort=featured">Featured</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Account</p>
          <ul className="flex flex-col gap-2 text-paper/70">
            <li><Link to="/orders">Order history</Link></li>
            <li><Link to="/profile">Profile settings</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Support</p>
          <ul className="flex flex-col gap-2 text-paper/70">
            <li>help@shopfront.example</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-paper/40">
        © {new Date().getFullYear()} Shopfront. All rights reserved.
      </div>
    </footer>
  );
}