import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  AppState,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import ClusteredMapView from "react-native-map-clustering";

import MapView, {
  Circle,
  Marker,
  Region,
} from "react-native-maps";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import * as Location from "expo-location";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../../contexts/themeContext";

import { getNearSettings } from "../../utils/settings";

import {
  updateCurrentUserLocation,
  getFriendLocations,
  subscribeToFriendLocationUpdates,
  restartBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  watchCurrentUserLocation,
  type FriendLocation,
} from "../../utils/location";

import * as TaskManager from "expo-task-manager";
import { BACKGROUND_LOCATION_TASK } from "../../tasks/backgroundLocation";

import { registerAndSavePushToken } from "../../utils/notifications";

import { supabase } from "../../lib/supabase";


const DEFAULT_NEARBY_RADIUS_METERS = 500;

const NEARBY_RADIUS_OPTIONS = [
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
  { label: "100 km", value: 100000 },
  { label: "200 km", value: 200000 },
  { label: "500 km", value: 500000 },
];

const MAP_ZOOM = {
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const MAP_OVERVIEW_ZOOM = {
  latitudeDelta: 16,
  longitudeDelta: 16,
};

const FRIEND_MARKER_COLORS = [
  "#F43F5E",
  "#F59E0B",
  "#8B5CF6",
  "#22C55E",
  "#EC4899",
  "#06B6D4",
];

type Coordinates = {
  latitude: number;
  longitude: number;
};

function calculateDistanceMeters(
  firstCoordinates: Coordinates,
  secondCoordinates: Coordinates
) {
  const earthRadiusMetres = 6371000;

  const firstLatitude =
    (firstCoordinates.latitude * Math.PI) / 180;

  const secondLatitude =
    (secondCoordinates.latitude * Math.PI) / 180;

  const latitudeDifference =
    ((secondCoordinates.latitude -
      firstCoordinates.latitude) *
      Math.PI) /
    180;

  const longitudeDifference =
    ((secondCoordinates.longitude -
      firstCoordinates.longitude) *
      Math.PI) /
    180;

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversineValue),
      Math.sqrt(1 - haversineValue)
    );

  return earthRadiusMetres * angularDistance;
}

function formatDistance(distanceMetres: number) {
  if (distanceMetres < 1000) {
    return `${Math.round(distanceMetres)} m away`;
  }

  return `${(distanceMetres / 1000).toFixed(1)} km away`;
}

export default function Home() {

  useEffect(() => {
  const checkBackgroundTask = async () => {
    console.log("TASK DEBUG:", {
      defined: TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK),

      registered:
        await TaskManager.isTaskRegisteredAsync(
          BACKGROUND_LOCATION_TASK
        ),

      locationStarted:
        await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK
        ),

      tasks:
        await TaskManager.getRegisteredTasksAsync(),
    });
  };

  checkBackgroundTask();
}, []);

useEffect(() => {
  const setupPushNotifications = async () => {
    console.log("STARTING PUSH REGISTRATION");

    const { token, error } =
      await registerAndSavePushToken();

    if (error) {
      console.log(
        "PUSH REGISTRATION ERROR:",
        error.message
      );
      return;
    }

    console.log(
      "PUSH REGISTRATION SUCCESS:",
    );
  };

  setupPushNotifications();
}, []);

  const { theme, colorScheme } =
  useAppTheme();

  const { friendId } = useLocalSearchParams<{
  friendId?: string;
}>();

  const defaultAvatar =
  colorScheme === "dark"
    ? require("../../assets/images/Sample_User_Icon-dark.png")
    : require("../../assets/images/Sample_User_Icon.png");

  const mapRef = useRef<MapView>(null);

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [nearbyRadius, setNearbyRadius] =
  useState<number | null>(null);

    const [showRadiusSelector, setShowRadiusSelector] =
      useState(false);

  const [friendLocations, setFriendLocations] =
    useState<FriendLocation[]>([]);

  const [selectedFriend, setSelectedFriend] =
    useState<FriendLocation | null>(null);

  const [loadingLocation, setLoadingLocation] =
    useState(true);

  const [locationError, setLocationError] =
    useState("");

useEffect(() => {
  const loadNearbyRadius = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("notification_settings")
      .select("nearby_radius_meters")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log(
        "LOAD NEARBY RADIUS ERROR:",
        error.message
      );
      return;
    }

    setNearbyRadius(
      data?.nearby_radius_meters ??
        DEFAULT_NEARBY_RADIUS_METERS
    );
  };

  loadNearbyRadius();
}, []);

  const loadCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setLocationError("");

      const { location, error } =
        await updateCurrentUserLocation();

      if (error || !location) {
        setLocationError(
          error?.message ??
            "Could not get your current location."
        );

        return;
      }

      const nextCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCoordinates(nextCoordinates);

      mapRef.current?.animateToRegion(
        {
          ...nextCoordinates,
          ...MAP_ZOOM,
        },
        500
      );
    } catch {
      setLocationError(
        "Something went wrong while loading your location."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadFriendLocations = useCallback(async () => {
    const { friends, error } =
      await getFriendLocations();

    if (error) {
      setLocationError(error.message);
      return;
    }

    setFriendLocations(friends);
  }, []);

  useEffect(() => {
    loadCurrentLocation();
    loadFriendLocations();
  }, [loadFriendLocations]);

  useEffect(() => {
  let subscription:
    | Location.LocationSubscription
    | null = null;

  const startForegroundTracking = async () => {
    const result =
      await watchCurrentUserLocation(
        (location) => {
          setCoordinates({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

    subscription = result.subscription;

    if (result.error) {
      console.log(
        "Foreground location error:",
        result.error.message
      );
    }
  };

  startForegroundTracking();

  return () => {
    subscription?.remove();
  };
}, []);

useEffect(() => {
  let running = false;

  const syncBackgroundTracking = async () => {
    if (running) return;
    running = true;

    try {
      const settings = await getNearSettings();

      if (settings.shareLocation && settings.backgroundLocation) {
        const { started, error } =
          await restartBackgroundLocationTracking();

        if (error) {
          console.log("Background tracking error:", error.message);
        }

        console.log("Background tracking started:", started);
      } else {
        await stopBackgroundLocationTracking();
      }
    } finally {
      running = false;
    }
  };

  syncBackgroundTracking();

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      syncBackgroundTracking();
    }
  });

  return () => sub.remove();
}, []);

  useFocusEffect(
    useCallback(() => {
      loadFriendLocations();
    }, [loadFriendLocations])
  );

  useEffect(() => {
    const unsubscribe =
      subscribeToFriendLocationUpdates(() => {
        loadFriendLocations();
      });

    return unsubscribe;
  }, [loadFriendLocations]);

  // Keep the selected friend's popup synced with Realtime updates.
  useEffect(() => {
    if (!selectedFriend) {
      return;
    }

    const updatedSelectedFriend =
      friendLocations.find(
        (friend) =>
          friend.user_id === selectedFriend.user_id
      );

    if (updatedSelectedFriend) {
      setSelectedFriend(updatedSelectedFriend);
    }
  }, [friendLocations, selectedFriend?.user_id]);

  const handleOverview = () => {
    if (!coordinates) {
      return;
    }

    setSelectedFriend(null);

    mapRef.current?.animateToRegion(
      {
        ...coordinates,
        ...MAP_OVERVIEW_ZOOM,
      },
      500
    );
  };

  const handleRecenter = () => {
    if (!coordinates) {
      loadCurrentLocation();
      return;
    }

    setSelectedFriend(null);

    mapRef.current?.animateToRegion(
      {
        ...coordinates,
        ...MAP_ZOOM,
      },
      500
    );
  };

  const handleRadiusChange = async (radius: number) => {
  const previousRadius = nearbyRadius;

  // Change the circle immediately
  setNearbyRadius(radius);
  setShowRadiusSelector(false);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setNearbyRadius(previousRadius);
    return;
  }

  const { error } = await supabase
    .from("notification_settings")
    .update({
      nearby_radius_meters: radius,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.log(
      "UPDATE NEARBY RADIUS ERROR:",
      error.message
    );

    setNearbyRadius(previousRadius);
  }
};

  const handleFriendMarkerPress = (
    friend: FriendLocation
  ) => {
    setSelectedFriend(friend);

    mapRef.current?.animateToRegion(
      {
        latitude: friend.latitude,
        longitude: friend.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      400
    );
  };

useEffect(() => {
  if (!friendId || friendLocations.length === 0) {
    return;
  }

  const friend = friendLocations.find(
    (item) => item.user_id === friendId
  );

  if (!friend) {
    return;
  }

  const timeout = setTimeout(() => {
    setSelectedFriend(friend);

    mapRef.current?.animateToRegion(
      {
        latitude: friend.latitude,
        longitude: friend.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      400
    );

    // friendId is only a one-time instruction.
    // Remove it after opening the friend on the map.
    router.setParams({
      friendId: undefined,
    });
  }, 300);

  return () => clearTimeout(timeout);
}, [friendId, friendLocations]);

  if (loadingLocation && !coordinates) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />

        <Text
          style={{
            color: theme.text,
            marginTop: 14,
            fontFamily: "alanRegular",
          }}
        >
          Finding your location...
        </Text>
      </SafeAreaView>
    );
  }

  if (!coordinates) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: theme.text,
            textAlign: "center",
            marginBottom: 16,
            fontFamily: "alanRegular",
          }}
        >
          {locationError ||
            "Your location is currently unavailable."}
        </Text>

        <Pressable
          onPress={loadCurrentLocation}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: theme.text,
          }}
        >
          <Text
            style={{
              color: theme.background,
              fontFamily: "alanRegular",
            }}
          >
            Try again
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const initialRegion: Region = {
    ...coordinates,
    ...MAP_ZOOM,
  };

  const selectedFriendDistance =
    selectedFriend
      ? calculateDistanceMeters(coordinates, {
          latitude: selectedFriend.latitude,
          longitude: selectedFriend.longitude,
        })
      : null;

  return (
    <View style={{ flex: 1 }}>
      <ClusteredMapView
        mapRef={(ref) => {
          mapRef.current = ref as MapView | null;
        }}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        clusteringEnabled
        minPoints={2}
        radius={45}
        clusterColor="#2563EB"
        clusterTextColor="#FFFFFF"
        clusterFontFamily="alanRegular"
        spiralEnabled
        spiderLineColor="transparent"
        animationEnabled={false}
        tracksViewChanges={false}
        edgePadding={{
          top: 80,
          right: 80,
          bottom: 120,
          left: 80,
        }}
        renderCluster={(cluster) => {
          const {
            id,
            geometry,
            properties,
            onPress,
          } = cluster;

          const lat = geometry.coordinates[1];
          const lng = geometry.coordinates[0];

          const isNearMe =
            coordinates &&
            Math.abs(
              lat - coordinates.latitude
            ) < 0.0002 &&
            Math.abs(
              lng - coordinates.longitude
            ) < 0.0002;

          const coordinate = {
            latitude: isNearMe
              ? lat + 0.00045
              : lat,
            longitude: lng,
          };

          const pointCount =
            properties.point_count;

          return (
            <Marker
              key={`cluster-${id}`}
              coordinate={coordinate}
              centerOffset={{
                x: 0,
                y: -32,
              }}
              onPress={(event) => {
                event.stopPropagation();
                onPress();
              }}
              tracksViewChanges
              zIndex={1000}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "#2563EB",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontFamily: "alanRegular",
                  }}
                >
                  {pointCount}
                </Text>
              </View>
            </Marker>
          );
        }}
        onPress={() =>
          setSelectedFriend(null)
        }
      >
        {nearbyRadius !== null && (
          <Circle
            key={`nearby-radius-${nearbyRadius}`}
            center={coordinates}
            radius={nearbyRadius}
            fillColor="rgba(66, 153, 225, 0.18)"
            strokeColor="rgba(66, 153, 225, 0.35)"
            strokeWidth={1}
          />
        )}

        {friendLocations.map(
          (friend, index) => (
            <Marker
              key={friend.user_id}
              coordinate={{
                latitude: friend.latitude,
                longitude: friend.longitude,
              }}
              onPress={(event) => {
                event.stopPropagation();
                handleFriendMarkerPress(friend);
              }}
              tracksViewChanges
              zIndex={10 + index}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor:
                    FRIEND_MARKER_COLORS[
                      index %
                        FRIEND_MARKER_COLORS.length
                    ],
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000000",
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  elevation: 8,
                }}
              />
            </Marker>
          )
        )}
      </ClusteredMapView>

      {selectedFriend ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 20,
            backgroundColor: theme.background,
            borderRadius: 26,
            padding: 18,
            shadowColor: "#000000",
            shadowOpacity: 0.2,
            shadowRadius: 14,
            shadowOffset: {
              width: 0,
              height: 5,
            },
            elevation: 10,
          }}
        >
          <Pressable
            onPress={() =>
              setSelectedFriend(null)
            }
            hitSlop={10}
            style={{
              position: "absolute",
              right: 15,
              top: 15,
              zIndex: 2,
            }}
          >
            <Ionicons
              name="close-outline"
              size={27}
              color={theme.text}
            />
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingRight: 35,
            }}
          >
            <Image
              source={
                selectedFriend.profile.avatar_url
                  ? {
                      uri:
                        selectedFriend.profile
                          .avatar_url,
                    }
                  : defaultAvatar
              }
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                marginRight: 14,
              }}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontFamily: "alanRegular",
                }}
              >
                {
                  selectedFriend.profile
                    .first_name
                }
              </Text>

              <Text
                style={{
                  color: theme.text,
                  marginTop: 3,
                  opacity: 0.65,
                  fontFamily: "alanRegular",
                }}
              >
                ID:{" "}
                {selectedFriend.profile
                  .username ?? "No ID"}
              </Text>

              {selectedFriendDistance !==
              null ? (
                <Text
                  style={{
                    color: theme.text,
                    marginTop: 8,
                    fontSize: 17,
                    fontFamily: "alanRegular",
                  }}
                >
                  {formatDistance(
                    selectedFriendDistance
                  )}
                </Text>
              ) : null}
            </View>
          </View>

          <Text
            style={{
              color: theme.text,
              marginTop: 16,
              opacity: 0.7,
              fontFamily: "alanRegular",
            }}
          >
            Last update:{" "}
            {new Date(
              selectedFriend.updated_at
            ).toLocaleString([], {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/user/[id]",
                params: {
                  id:
                    selectedFriend.profile.id,
                },
              })
            }
            style={({ pressed }) => ({
              marginTop: 16,
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: theme.text,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                color: theme.background,
                fontFamily: "alanRegular",
              }}
            >
              View profile
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showRadiusSelector ? (
        <View
          style={{
            position: "absolute",
            right: 82,
            bottom: selectedFriend ? 255 : 24,
            backgroundColor: theme.background,
            borderRadius: 18,
            padding: 14,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            elevation: 8,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontFamily: "alanRegular",
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            Near range
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              width: 220,
            }}
          >
            {NEARBY_RADIUS_OPTIONS.map((option) => {
              const selected =
                nearbyRadius === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    handleRadiusChange(option.value)
                  }
                  style={({ pressed }) => ({
                    paddingHorizontal: 11,
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: selected
                      ? "#2563EB"
                      : theme.background,
                    borderWidth: selected ? 0 : 1,
                    borderColor: "rgba(128,128,128,0.25)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: selected
                        ? "#FFFFFF"
                        : theme.text,
                      fontFamily: "alanRegular",
                      fontSize: 13,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View
        style={{
          position: "absolute",
          right: 18,
          bottom: selectedFriend
            ? 255
            : 24,
          gap: 12,
        }}
      >
      <Pressable
        onPress={() =>
          setShowRadiusSelector((current) => !current)
        }
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
          opacity: pressed ? 0.75 : 1,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          elevation: 5,
        })}
      >
        <Ionicons
          name="radio-outline"
          size={27}
          color="#2563EB"
        />
      </Pressable>
        <Pressable
          onPress={handleOverview}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor:
              theme.background,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.75 : 1,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: {
              width: 0,
              height: 3,
            },
            elevation: 5,
          })}
        >
          <Ionicons
            name="map-outline"
            size={26}
            color="#2563EB"
          />
        </Pressable>

        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor:
              theme.background,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.75 : 1,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: {
              width: 0,
              height: 3,
            },
            elevation: 5,
          })}
        >
          <Ionicons
            name="locate-outline"
            size={28}
            color="#2563EB"
          />
        </Pressable>
      </View>

      {locationError ? (
        <View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            right: 20,
            padding: 12,
            borderRadius: 12,
            backgroundColor:
              "rgba(0, 0, 0, 0.75)",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontFamily: "alanRegular",
            }}
          >
            {locationError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}