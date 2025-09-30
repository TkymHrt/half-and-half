import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        const { data, error } = await createClient().auth.getSession();
        if (error) {
          setImage(null);
          return;
        }

        setImage(data.session?.user.user_metadata.avatar_url ?? null);
      } catch {
        setImage(null);
      }
    };
    fetchUserImage();
  }, []);

  return image;
};
