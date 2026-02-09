import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Clock, Star, ArrowRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { postsAPI } from "@/lib/api";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  {
    icon: Shield,
    title: "Verified Workers",
    desc: "Every professional is background-checked and verified for your safety.",
  },
  {
    icon: Clock,
    title: "Book Instantly",
    desc: "Choose your service, pick a date, and confirm — it's that simple.",
  },
  {
    icon: Star,
    title: "Top-Rated Service",
    desc: "Our workers are rated by real customers so you always get the best.",
  },
];

const Index = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const isLoggedIn = !!sessionStorage.getItem("userId");
  const userRole = sessionStorage.getItem("userRole");

  useEffect(() => {
    if (isLoggedIn) {
      if (userRole === "consumer") {
        fetchPosts();
      } else if (userRole === "operator") {
        fetchOperatorPosts();
      }
    }
  }, [isLoggedIn, userRole]);

  const fetchOperatorPosts = async () => {
    setLoading(true);
    try {
      const userId = sessionStorage.getItem("userId") || "";
      const response = await postsAPI.getOperatorPosts(userId);
      setPosts(response || []);
    } catch (error) {
      console.error("Failed to fetch operator posts", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postsAPI.getAllPosts();
      setPosts(response || []);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setZoom(1);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.8));
  };

  // If user is logged in as consumer, show posts
  if (isLoggedIn && userRole === "consumer") {
    return (
      <div className="p-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6 md:mb-8">Available Services</h1>
        

        {loading ? (
          <div className="text-center py-12">Loading posts...</div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link to={`/workers`} key={post.id}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 bg-muted">
                      <div className="bg-muted aspect-square flex items-center justify-center" onClick={(e) => {
                        e.preventDefault();
                        handleImageClick(post.beforeImage);
                      }}>
                        <img 
                          src={post.beforeImage} 
                          alt="Before" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        /> 
                      </div>
                      <div className="bg-muted aspect-square flex items-center justify-center" onClick={(e) => {
                        e.preventDefault();
                        handleImageClick(post.afterImage);
                      }}>
                        <img 
                          src={post.afterImage} 
                          alt="After" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{post.typeOfWork}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        ⏱️ {post.hoursWorked} hours
                      </p>
                      {post.userRating > 0 && (
                        <p className="text-sm text-yellow-500 mb-2">
                          ⭐ {post.userRating.toFixed(1)} rating
                        </p>
                      )}
                      <Button size="sm" className="w-full">Book Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No services available yet. Check back soon!
          </div>
        )}

        {/* Image Zoom Modal */}
        <Dialog open={!!selectedImage} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh] bg-black flex items-center justify-center overflow-hidden">
              {selectedImage && (
                <>
                  <img
                    src={selectedImage}
                    alt="Zoomed"
                    style={{
                      transform: `scale(${zoom})`,
                      transition: "transform 0.2s ease-in-out",
                    }}
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                    title="Close"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.8}
                      className="bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-full transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                      className="bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-full transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                    {(zoom * 100).toFixed(0)}%
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If user is logged in as operator, show their posts and welcome
  if (isLoggedIn && userRole === "operator") {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-heading font-bold mb-2">Welcome, Operator!</h1>
        <p className="text-muted-foreground mb-8">
          Manage your posts and messages from the navigation menu.
        </p>
        <Link to="/post">
          <Button size="lg" className="mb-8">Create New Post</Button>
        </Link>
        
        <h2 className="text-2xl font-heading font-bold mb-6">Your Posts</h2>
        {loading ? (
          <div className="text-center py-12">Loading your posts...</div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 bg-muted">
                    <div className="bg-muted aspect-square flex items-center justify-center cursor-pointer" onClick={() => {
                      handleImageClick(post.beforeImage);
                    }}>
                      <img 
                        src={post.beforeImage} 
                        alt="Before" 
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      /> 
                    </div>
                    <div className="bg-muted aspect-square flex items-center justify-center cursor-pointer" onClick={() => {
                      handleImageClick(post.afterImage);
                    }}>
                      <img 
                        src={post.afterImage} 
                        alt="After" 
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{post.typeOfWork}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      ⏱️ {post.hoursWorked} hours
                    </p>
                    {post.userRating > 0 && (
                      <p className="text-sm text-yellow-500 mb-2">
                        ⭐ {post.userRating.toFixed(1)} rating
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No posts yet. Create your first post!
          </div>
        )}

        {/* Image Zoom Modal */}
        <Dialog open={!!selectedImage} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh] bg-black flex items-center justify-center overflow-hidden">
              {selectedImage && (
                <>
                  <img
                    src={selectedImage}
                    alt="Zoomed"
                    style={{
                      transform: `scale(${zoom})`,
                      transition: "transform 0.2s ease-in-out",
                    }}
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                    title="Close"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.8}
                      className="bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-full transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                      className="bg-white/20 hover:bg-white/30 disabled:opacity-50 p-2 rounded-full transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                    {(zoom * 100).toFixed(0)}%
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If not logged in, show intro content
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Happy family at home" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="relative z-10 px-4 md:px-8 py-24 md:py-36 max-w-3xl">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
            Find trusted workers for your home, instantly
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl">
            Book verified plumbers, electricians, carpenters and more — all from one app.
          </p>
          <Link to="/login">
            <Button size="lg" className="text-base gap-2">
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="px-4 md:px-8 py-16 md:py-24 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          FixIt connects you with skilled, trusted local workers. Browse services, pick a date, and get the job done — hassle-free.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="text-center p-6 rounded-xl bg-card shadow-card animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-8 py-16 bg-primary text-primary-foreground text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
          Join thousands of homeowners who trust FixIt for reliable home services.
        </p>
        <Link to="/login">
          <Button variant="secondary" size="lg" className="text-base gap-2">
            Create an Account <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default Index;
