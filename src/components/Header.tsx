import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, ChevronDown, User, Wrench } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Vybo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Como funciona
          </a>
          <a href="#oficinas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Para Oficinas
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Entrar
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg">
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100">
                <Link to="/login?type=user" className="flex items-center gap-2 w-full text-gray-900">
                  <User className="h-4 w-4 text-primary" />
                  <span>Sou Proprietário</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100">
                <Link to="/login?type=workshop" className="flex items-center gap-2 w-full text-gray-900">
                  <Wrench className="h-4 w-4 text-green-600" />
                  <span>Sou Oficina</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/select-type">
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
