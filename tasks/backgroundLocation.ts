import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { supabase } from "../lib/supabase";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SETTINGS_KEYS } from "../utils/settings";

export const BACKGROUND_LOCATION_TASK =
  "near-background-location";
  console.log("BACKGROUND TASK FILE LOADED");

type BackgroundLocationTaskData = {
  locations: Location.LocationObject[];
};

TaskManager.defineTask<BackgroundLocationTaskData>(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    console.log("BACKGROUND TASK FIRED");
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

    const shareLocation =
      await AsyncStorage.getItem(
        SETTINGS_KEYS.shareLocation
      );

    if (shareLocation === "false") {
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

      console.log(
        "BACKGROUND LOCATION RECEIVED:",
        latitude,
        longitude
      );

      console.log(
        "BACKGROUND UPLOAD ERROR:",
        updateError
      );

    if (updateError) {
      console.log(
        "Background location upload error:",
        updateError.message
      );
    }
  }
);