import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-hover flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(39,174,96,0.15),transparent_70%)]" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl animate-scale-in">
        <CardHeader className="space-y-4">
          <Link to="/" className="flex items-center gap-2 mx-auto group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">AutoTrack</span>
          </Link>
          
          <div className="text-center">
            <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>
              Entre com sua conta Google para continuar
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={signInWithGoogle}
            variant="outline" 
            className="w-full" 
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </Button>
          
          <div className="mt-6 p-4 bg-surface rounded-lg">
            <p className="text-xs text-center text-muted-foreground">
              🚀 <strong>MVP em fase de testes</strong>
              <br />
              Esta é uma demonstração do AutoTrack. Os dados são simulados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
