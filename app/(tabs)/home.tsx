import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
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
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  watchCurrentUserLocation,
  type FriendLocation,
} from "../../utils/location";


const NEARBY_RADIUS_METERS = 500;

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

  const [friendLocations, setFriendLocations] =
    useState<FriendLocation[]>([]);

  const [selectedFriend, setSelectedFriend] =
    useState<FriendLocation | null>(null);

  const [loadingLocation, setLoadingLocation] =
    useState(true);

  const [locationError, setLocationError] =
    useState("");

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
  const syncBackgroundTracking = async () => {
    const settings = await getNearSettings();

    if (
      settings.shareLocation &&
      settings.backgroundLocation
    ) {
      const { started, error } =
        await startBackgroundLocationTracking();

      if (error) {
        console.log(
          "Background tracking error:",
          error.message
        );
      }

      console.log(
        "Background tracking started:",
        started
      );
    } else {
      await stopBackgroundLocationTracking();
    }
  };

  syncBackgroundTracking();
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
        <Circle
          center={coordinates}
          radius={NEARBY_RADIUS_METERS}
          fillColor="rgba(66, 153, 225, 0.18)"
          strokeColor="rgba(66, 153, 225, 0.35)"
          strokeWidth={1}
        />

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
            }}
          >
            {locationError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}