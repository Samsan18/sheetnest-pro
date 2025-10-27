import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Activity, BarChart3, Download, FolderOpen, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-manufacturing.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SheetNest Optimizer
            </h1>
          </div>
          <nav className="flex gap-4">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">Documentation</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-primary font-semibold">Professional CAD Optimization</span>
              </div>
              <h2 className="text-5xl font-bold leading-tight">
                Optimize Sheet Metal
                <span className="block text-primary">Material Usage</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Upload DXF files, calculate material efficiency, minimize waste, and maximize 
                your fabrication productivity with advanced nesting algorithms.
              </p>
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <Link to="/projects">
                    <Button size="lg" className="gap-2">
                      My Projects <FolderOpen className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="lg" className="gap-2">
                      Get Started <LogIn className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/optimizer">
                  <Button size="lg" variant="outline" className="gap-2">
                    Try Demo <Upload className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Avg Efficiency</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <div className="text-sm text-muted-foreground">Waste Reduction</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">5min</div>
                  <div className="text-sm text-muted-foreground">Avg Processing</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="Industrial manufacturing and CAD optimization" 
                className="rounded-lg border border-primary/20 shadow-2xl relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Professional Features</h3>
          <p className="text-muted-foreground text-lg">
            Built for fabrication shops, engineers, and manufacturers
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">DXF Processing</h4>
            <p className="text-muted-foreground">
              Upload and parse 2D DXF CAD files with automatic geometry extraction and preview.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Smart Calculations</h4>
            <p className="text-muted-foreground">
              Real-time material usage, waste percentage, and sheet count calculations.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Nesting Optimization</h4>
            <p className="text-muted-foreground">
              Advanced algorithms to arrange parts efficiently and minimize material waste.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-primary rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4 text-primary-foreground">
            Ready to Optimize Your Production?
          </h3>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Start processing your DXF files and reduce material waste today.
          </p>
          <Link to="/optimizer">
            <Button size="lg" variant="secondary" className="gap-2">
              <Upload className="h-5 w-5" />
              Launch Optimizer
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 SheetNest Optimizer. Professional CAD Material Optimization.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
