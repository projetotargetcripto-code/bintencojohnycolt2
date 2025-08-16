import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/dataClient";

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    })();
  }, [navigate]);
  return null;
}
