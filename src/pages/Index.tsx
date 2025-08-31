// This page has been replaced by Dashboard.tsx as the main landing page
// The routing is now handled in App.tsx with MainLayout

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard since this is now the main entry point
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
