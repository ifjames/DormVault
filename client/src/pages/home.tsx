import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import DormLayout from "@/components/DormLayout";
import DormerLayout from "@/components/DormerLayout";
import { useLocation } from "wouter";
import { dormersService } from "@/lib/firestoreService";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<"admin" | "dormer" | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to access this page.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.email && isAuthenticated) {
        try {
          console.log("Checking role for email:", user.email);
          
          // Check if user exists in dormers collection first
          const dormers = await dormersService.getAll();
          const dormerExists = dormers.some((dormer: any) => dormer.email === user.email);
          
          if (dormerExists) {
            console.log("User found in dormers collection - setting role to dormer");
            setUserRole("dormer");
          } else {
            // If not in dormers collection, default to admin
            console.log("User NOT found in dormers collection - setting role to admin");
            setUserRole("admin");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          // If there's an error accessing dormers, default to admin to be safe
          setUserRole("admin");
        }
        setRoleLoading(false);
      }
    };

    if (isAuthenticated && user) {
      checkUserRole();
    }
  }, [user, isAuthenticated]);

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Render different dashboards based on user role
  if (userRole === "admin") {
    return <DormLayout />;
  } else {
    return <DormerLayout />;
  }
}
