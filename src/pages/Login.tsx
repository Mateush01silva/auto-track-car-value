import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ArrowLeft, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BRAZILIAN_STATES, MUNICIPALITIES_BY_STATE } from "@/constants/brazilLocations";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const { toast } = useToast();

  const userType = searchParams.get("type") || "user";
  const isWorkshop = userType === "workshop";

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupState, setSignupState] = useState("");
  const [signupMunicipality, setSignupMunicipality] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Workshop-specific fields
  const [workshopName, setWorkshopName] = useState("");
  const [workshopCnpj, setWorkshopCnpj] = useState("");
  const [workshopPhone, setWorkshopPhone] = useState("");

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user) {
        if (isWorkshop) {
          // Check if user has a workshop
          const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

          if (workshop) {
            navigate("/workshop/dashboard", { replace: true });
          } else {
            // User logged in but doesn't have a workshop yet
            // They might need to create one
            navigate("/workshop/dashboard", { replace: true });
          }
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    };

    checkUserAndRedirect();
  }, [user, navigate, isWorkshop]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);

    if (!error) {
      if (isWorkshop) {
        // Check if user has a workshop
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', currentUser.id)
            .single();

          if (workshop) {
            setIsLoading(false);
            navigate("/workshop/dashboard", { replace: true });
          } else {
            // User doesn't have a workshop - show message to use signup tab
            setIsLoading(false);
            toast({
              title: "Oficina nao encontrada",
              description: "Sua conta nao possui oficina. Use a aba 'Criar Conta' para adicionar uma oficina.",
              variant: "destructive",
            });
          }
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        navigate("/dashboard", { replace: true });
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isWorkshop && !workshopName.trim()) {
      toast({
        title: "Nome da oficina obrigatorio",
        description: "Por favor, informe o nome da sua oficina.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // For workshop signup, call supabase directly to control error handling
    if (isWorkshop) {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
            phone: signupPhone,
            state: signupState,
            municipality: signupMunicipality,
          },
        },
      });

      // Handle "User already registered" error
      if (error && error.message?.includes('already registered')) {
        // Try to log in the existing user
        const { error: loginError } = await signInWithEmail(signupEmail, signupPassword);

        if (loginError) {
          toast({
            title: "Email ja cadastrado",
            description: "Este email ja possui uma conta. Use a aba 'Entrar' com sua senha para adicionar uma oficina.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // User logged in successfully, now check if they already have a workshop
        const { data: { user: existingUser } } = await supabase.auth.getUser();

        if (existingUser) {
          // Check if workshop already exists
          const { data: existingWorkshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', existingUser.id)
            .single();

          if (existingWorkshop) {
            toast({
              title: "Oficina ja cadastrada",
              description: "Voce ja possui uma oficina cadastrada. Redirecionando...",
            });
            navigate("/workshop/dashboard", { replace: true });
          } else {
            // Create workshop for existing user
            const { error: workshopError } = await supabase
              .from('workshops')
              .insert({
                owner_id: existingUser.id,
                name: workshopName.trim(),
                cnpj: workshopCnpj.trim() || null,
                phone: workshopPhone.trim() || null,
                email: signupEmail,
                city: signupMunicipality || null,
                state: signupState || null,
              });

            if (workshopError) {
              console.error('Error creating workshop:', workshopError);
              toast({
                title: "Erro ao criar oficina",
                description: workshopError.message || "Houve um erro ao criar a oficina. Tente novamente.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Oficina criada com sucesso!",
                description: "Sua oficina foi adicionada a sua conta existente.",
              });
              navigate("/workshop/dashboard", { replace: true });
            }
          }
        }
        setIsLoading(false);
        return;
      }

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // New user created, auto-login
      const { error: loginError } = await signInWithEmail(signupEmail, signupPassword);

      if (!loginError) {
        const { data: { user: newUser } } = await supabase.auth.getUser();

        if (newUser) {
          // Create workshop for the new user
          const { error: workshopError } = await supabase
            .from('workshops')
            .insert({
              owner_id: newUser.id,
              name: workshopName.trim(),
              cnpj: workshopCnpj.trim() || null,
              phone: workshopPhone.trim() || null,
              email: signupEmail,
              city: signupMunicipality || null,
              state: signupState || null,
            });

          if (workshopError) {
            console.error('Error creating workshop:', workshopError);
            toast({
              title: "Erro ao criar oficina",
              description: workshopError.message || "Conta criada, mas houve um erro ao criar a oficina.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Oficina criada com sucesso!",
              description: "Bem-vindo ao WiseDrive para Oficinas.",
            });
            navigate("/workshop/dashboard", { replace: true });
          }
        }
      }
      setIsLoading(false);
      return;
    }

    // For regular user signup, use the normal flow
    const { error } = await signUpWithEmail(signupEmail, signupPassword, signupName, signupPhone, signupState, signupMunicipality);

    if (!error) {
      // Auto-login after signup
      const { error: loginError } = await signInWithEmail(signupEmail, signupPassword);

      if (!loginError) {
        navigate("/dashboard", { replace: true });
      }
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    // Store the user type in localStorage before OAuth redirect
    localStorage.setItem('wisedrive_signup_type', userType);
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-hover flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(39,174,96,0.15),transparent_70%)]" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl animate-scale-in">
        <CardHeader className="space-y-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          <Link to="/" className="flex items-center gap-2 mx-auto group pt-4">
            <div className={`rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300 ${isWorkshop ? 'bg-green-600' : 'bg-primary'}`}>
              {isWorkshop ? (
                <Wrench className="h-6 w-6 text-white" />
              ) : (
                <Car className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            <span className={`text-2xl font-bold ${isWorkshop ? 'text-green-600' : 'text-primary'}`}>
              WiseDrive
            </span>
          </Link>

          <div className="text-center">
            <CardTitle className="text-2xl">
              {isWorkshop ? "Login - Oficina" : "Bem-vindo de volta"}
            </CardTitle>
            <CardDescription>
              {isWorkshop
                ? "Acesse o painel da sua oficina"
                : "Entre com sua conta para continuar"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="********"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full ${isWorkshop ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
                disabled={isLoading}
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
                Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="********"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Minimo de 6 caracteres</p>
                </div>

                {/* Workshop-specific fields */}
                {isWorkshop && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-sm font-medium text-green-600">Dados da Oficina</p>

                    <div className="space-y-2">
                      <Label htmlFor="workshop-name">Nome da Oficina *</Label>
                      <Input
                        id="workshop-name"
                        type="text"
                        placeholder="Auto Mecanica Silva"
                        value={workshopName}
                        onChange={(e) => setWorkshopName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workshop-cnpj">CNPJ (opcional)</Label>
                      <Input
                        id="workshop-cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={workshopCnpj}
                        onChange={(e) => setWorkshopCnpj(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workshop-phone">Telefone da Oficina (opcional)</Label>
                      <Input
                        id="workshop-phone"
                        type="tel"
                        placeholder="(11) 3456-7890"
                        value={workshopPhone}
                        onChange={(e) => setWorkshopPhone(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Personal phone field - only for regular users */}
                {!isWorkshop && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone (opcional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-state">Estado</Label>
                    <Select value={signupState} onValueChange={(value) => {
                      setSignupState(value);
                      setSignupMunicipality("");
                    }}>
                      <SelectTrigger id="signup-state">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-municipality">Municipio</Label>
                    <Select
                      value={signupMunicipality}
                      onValueChange={setSignupMunicipality}
                      disabled={!signupState}
                    >
                      <SelectTrigger id="signup-municipality">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {signupState && MUNICIPALITIES_BY_STATE[signupState]?.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full ${isWorkshop ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
                disabled={isLoading}
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
                Google
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-surface rounded-lg">
            <p className="text-xs text-center text-muted-foreground">
              {isWorkshop ? (
                <>
                  <strong>Teste gratuito por 30 dias</strong>
                  <br />
                  Apos o periodo de teste, escolha o plano ideal para sua oficina.
                </>
              ) : (
                <>
                  <strong>MVP em fase de testes</strong>
                  <br />
                  Esta e uma demonstracao do WiseDrive. Os dados sao simulados.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
