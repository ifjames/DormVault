import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import logoUrl from "@assets/generated_images/DormVault_logo_design_290d68c6.png";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().min(1, "Email ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Helper function to convert username to email
const getUserEmail = (email: string): string => {
  if (email.includes('@')) {
    return email; // Already an email
  }
  return `${email}@dorm.com`; // Convert username to email
};

export default function Login() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const email = getUserEmail(data.email);
      const result = await login(email, data.password);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });
        
        // Redirect to dashboard
        setLocation('/');
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 dark:from-purple-800 dark:via-purple-900 dark:to-purple-950 relative overflow-hidden select-none">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl transform -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-300/20 to-blue-300/20 rounded-full blur-3xl transform translate-x-32 translate-y-32"></div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex">
              {/* Left side - Form */}
              <div className="w-1/2 p-12">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-8">
                    <img src={logoUrl} alt="DormVault" className="h-16 w-16 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DormVault</h1>
                  </div>
                  
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="you@example.com"
                        className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                        {...form.register("email")}
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter 6 character or more"
                          className="w-full h-12 px-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                          {...form.register("password")}
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input type="checkbox" id="remember" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-medium h-12 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing In...
                        </div>
                      ) : (
                        "LOGIN"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
              
              {/* Right side - Illustration */}
              <div className="w-1/2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto mb-8 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 rounded-2xl flex items-center justify-center">
                    <div className="text-6xl">👩‍💻</div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Welcome Back!</h2>
                  <p className="text-gray-600 dark:text-gray-300">Login to access your dormitory management dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img src={logoUrl} alt="DormVault" className="h-12 w-12 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DormVault</h1>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access your dorm account</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</Label>
                <Input
                  id="email-mobile"
                  type="text"
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                  {...form.register("email")}
                  data-testid="input-email-mobile"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</Label>
                <div className="relative">
                  <Input
                    id="password-mobile"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full h-11 px-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                    {...form.register("password")}
                    data-testid="input-password-mobile"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center text-sm">
                <input type="checkbox" id="remember-mobile" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                <label htmlFor="remember-mobile" className="ml-2 text-gray-700 dark:text-gray-300">Remember me</label>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-medium h-11 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
                data-testid="button-login-mobile"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  "LOGIN"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}