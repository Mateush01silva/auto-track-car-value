import { Link } from "react-router-dom";
import { Car } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-success rounded-lg p-2">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">AutoTrack</span>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Transparência que valoriza seu carro.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#funcionalidades" className="hover:text-success transition-colors">Funcionalidades</a></li>
              <li><a href="#como-funciona" className="hover:text-success transition-colors">Como funciona</a></li>
              <li><Link to="/login" className="hover:text-success transition-colors">Experimente</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-success transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-success transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-success transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-success transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-success transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© 2025 AutoTrack. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
