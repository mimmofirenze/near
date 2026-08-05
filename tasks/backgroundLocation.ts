import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { supabase } from "../lib/supabase";

export const BACKGROUND_LOCATION_TASK =
  "near-background-location";

type BackgroundLocationTaskData = {
  locations: Location.LocationObject[];
};

TaskManager.defineTask<BackgroundLocationTaskData>(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.log(
        "Background location task error:",
        error.message
      );
      return;
    }

    const locations = data?.locations;

    if (!locations || locations.length === 0) {
      return;
    }

    const latestLocation =
      locations[locations.length - 1];

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log(
        "Background location: no authenticated user",
        userError?.message
      );
      return;
    }

    const {
      latitude,
      longitude,
      accuracy,
    } = latestLocation.coords;

    const { error: updateError } = await supabase
      .from("user_locations")
      .upsert({
        user_id: user.id,
        latitude,
        longitude,
        accuracy,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.log(
        "Background location upload error:",
        updateError.message
      );
    }
  }
);