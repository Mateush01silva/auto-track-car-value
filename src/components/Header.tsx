import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">AutoTrack</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Como funciona
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="success" size="sm">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
