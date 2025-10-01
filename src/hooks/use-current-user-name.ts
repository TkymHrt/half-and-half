import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const { data, error } = await createClient().auth.getSession();
        if (error) {
          setName("?");
          return;
        }

        setName(data.session?.user.user_metadata.full_name ?? "?");
      } catch {
        setName("?");
      }
    };

    fetchProfileName();
  }, []);

  return name || "?";
};
