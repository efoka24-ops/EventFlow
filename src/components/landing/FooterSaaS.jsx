import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function FooterSaaS() {
  return (
    <footer className="bg-slate-900 text-gray-400">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">EventFlow</h3>
            <p className="text-gray-500 mb-6">La plateforme d'événements pour l'Afrique.</p>
            <div className="flex gap-3">
              {["f", "t", "in", "ig"].map((icon) => (
                <a key={icon} href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-blue-600 transition flex items-center justify-center text-white">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {["Créer événement", "Explorer", "Billets", "Analytics", "Mobile Money"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {["À propos", "Blog", "Carrières", "Presse", "Partenaires"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:hello@eventflow.com" className="hover:text-white transition">
                  hello@eventflow.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href="tel:+237670000000" className="hover:text-white transition">
                  +237 670 000 000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Yaoundé, Cameroun</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 EventFlow. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/legal/terms" className="hover:text-white transition">
                Conditions
              </Link>
              <Link to="/legal/privacy" className="hover:text-white transition">
                Confidentialité
              </Link>
              <Link to="/legal/cookies" className="hover:text-white transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
