import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Trash2, Calendar, User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadProjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async () => {
    const name = prompt("Enter project name:");
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name,
        description: "",
      });

      if (error) throw error;
      
      toast.success("Project created!");
      loadProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Project deleted");
      loadProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Projects</h2>
            <p className="text-muted-foreground">
              Manage your sheet metal nesting projects
            </p>
          </div>
          <Button onClick={handleNewProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first nesting project to get started
            </p>
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(project.updated_at).toLocaleDateString()}
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/optimizer?project=${project.id}`)}
                >
                  Open Project
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
