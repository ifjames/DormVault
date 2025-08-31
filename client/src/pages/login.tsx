import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen bg-white relative overflow-hidden flex">
      {/* Left blue gradient blob */}
      <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-r-[200px] transform -translate-x-20"></div>
      
      {/* Right blue gradient blob */}
      <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-bl from-blue-500 to-blue-600 rounded-l-[200px] transform translate-x-20"></div>
      
      {/* Login form container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Login title */}
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8">Login</h1>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email ID field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600 font-medium">Email ID</Label>
              <Input
                id="email"
                type="text"
                className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-600 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                  {...form.register("password")}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Login button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium h-12 rounded-lg transition-colors"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}